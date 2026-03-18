import io
import os
import uuid
from datetime import datetime, timezone

import boto3
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse

from app.services.audio import process_sitar_to_tabla, analyze_sitar, _build_section_ranges, VALID_TAALS, TAAL_PATTERNS

router = APIRouter(prefix="/process", tags=["process"])

S3_BUCKET = os.environ.get("S3_BUCKET_NAME", "fayez-app-audio")
TABLE_NAME = os.environ.get("TABLE_NAME", "fayez-music-app")

from botocore.config import Config as BotoConfig
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
s3 = boto3.client("s3", region_name=AWS_REGION, config=BotoConfig(read_timeout=600, connect_timeout=30))
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)


@router.post("/upload-url")
def get_upload_url(filename: str = "recording.wav"):
    """Get a presigned S3 URL so the browser can upload directly to S3."""
    job_id = str(uuid.uuid4())
    input_key = f"inputs/{job_id}.wav"

    presigned = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": S3_BUCKET,
            "Key": input_key,
            "ContentType": "audio/wav",
        },
        ExpiresIn=3600,
    )
    return {
        "job_id": job_id,
        "upload_url": presigned,
        "input_key": input_key,
        "filename": filename,
    }


@router.post("/run/{job_id}")
def run_processing(
    job_id: str,
    taal: str = "teentaal",
    tabla_level: float = 0.6,
    reverb_level: float = 0.3,
    filename: str = "recording.wav",
):
    """Process an already-uploaded S3 file. Called after browser uploads directly to S3."""
    import json
    import numpy as np

    if taal not in VALID_TAALS:
        raise HTTPException(status_code=400, detail=f"Unknown taal '{taal}'. Choose from: {VALID_TAALS}")

    input_key = f"inputs/{job_id}.wav"
    output_key = f"outputs/{job_id}.wav"
    now = datetime.now(timezone.utc).isoformat()

    # Download input from S3
    try:
        s3_obj = s3.get_object(Bucket=S3_BUCKET, Key=input_key)
        input_bytes = s3_obj["Body"].read()
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"Input file not found in S3: {exc}")

    # Process
    try:
        output_bytes, analysis = process_sitar_to_tabla(
            input_bytes,
            taal=taal,
            tabla_level=tabla_level,
            reverb=reverb_level,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}")

    # Upload output
    s3.upload_fileobj(io.BytesIO(output_bytes), S3_BUCKET, output_key)

    # Save to DynamoDB
    record = {
        "id": job_id,
        "input_s3_key": input_key,
        "output_s3_key": output_key,
        "input_filename": filename,
        "taal": taal,
        "tabla_level": str(tabla_level),
        "reverb": str(reverb_level),
        "status": "completed",
        "created_at": now,
        "analysis": json.dumps(analysis),
    }
    table.put_item(Item=record)
    record["analysis"] = analysis
    return record


@router.post("/", status_code=201)
async def process_audio(
    file: UploadFile = File(...),
    taal: str = Form("teentaal"),
    tabla_level: float = Form(0.6),
    reverb: float = Form(0.3),
):
    """
    1. Upload the input .wav to S3
    2. Run the sitar → tabla processing pipeline
    3. Upload the output .wav to S3
    4. Save input + output references in DynamoDB
    """
    if not file.filename or not file.filename.lower().endswith(".wav"):
        raise HTTPException(status_code=400, detail="Only .wav files are accepted")

    if taal not in VALID_TAALS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown taal '{taal}'. Choose from: {VALID_TAALS}",
        )

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    input_key = f"inputs/{job_id}.wav"
    output_key = f"outputs/{job_id}.wav"

    # Read uploaded file in chunks to handle large files
    chunks = []
    while True:
        chunk = await file.read(8 * 1024 * 1024)  # 8MB chunks
        if not chunk:
            break
        chunks.append(chunk)
    input_bytes = b"".join(chunks)

    # 1 — Upload input to S3 (multipart for large files)
    s3.upload_fileobj(io.BytesIO(input_bytes), S3_BUCKET, input_key)

    # 2 — Process: sitar → tabla
    try:
        output_bytes, analysis = process_sitar_to_tabla(
            input_bytes,
            taal=taal,
            tabla_level=tabla_level,
            reverb=reverb,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}")

    # 3 — Upload output to S3 (multipart for large files)
    s3.upload_fileobj(io.BytesIO(output_bytes), S3_BUCKET, output_key)

    # 4 — Save record + analysis in DynamoDB
    import json
    record = {
        "id": job_id,
        "input_s3_key": input_key,
        "output_s3_key": output_key,
        "input_filename": file.filename,
        "taal": taal,
        "tabla_level": str(tabla_level),
        "reverb": str(reverb),
        "status": "completed",
        "created_at": now,
        "analysis": json.dumps(analysis),
    }
    table.put_item(Item=record)

    record["analysis"] = analysis
    return record


@router.get("/jobs")
def list_jobs() -> list[dict]:
    """List all processing jobs with parsed analysis."""
    import json
    response = table.scan()
    items = response.get("Items", [])
    jobs = []
    for item in items:
        if "input_s3_key" not in item:
            continue
        # Parse analysis JSON if stored as string
        if "analysis" in item and isinstance(item["analysis"], str):
            try:
                item["analysis"] = json.loads(item["analysis"])
            except json.JSONDecodeError:
                pass
        jobs.append(item)
    return jobs


@router.get("/download/{job_id}")
def download_output(job_id: str):
    """Stream the output .wav from S3 for playback."""
    response = table.get_item(Key={"id": job_id})
    item = response.get("Item")
    if not item or "output_s3_key" not in item:
        raise HTTPException(status_code=404, detail="Job not found")

    s3_obj = s3.get_object(Bucket=S3_BUCKET, Key=item["output_s3_key"])

    return StreamingResponse(
        s3_obj["Body"],
        media_type="audio/wav",
        headers={
            "Content-Disposition": f'inline; filename="{job_id}_output.wav"',
        },
    )


@router.get("/download/{job_id}/input")
def download_input(job_id: str):
    """Stream the input .wav from S3 for playback."""
    response = table.get_item(Key={"id": job_id})
    item = response.get("Item")
    if not item or "input_s3_key" not in item:
        raise HTTPException(status_code=404, detail="Job not found")

    s3_obj = s3.get_object(Bucket=S3_BUCKET, Key=item["input_s3_key"])

    return StreamingResponse(
        s3_obj["Body"],
        media_type="audio/wav",
        headers={
            "Content-Disposition": f'inline; filename="{job_id}_input.wav"',
        },
    )


@router.post("/analyze/{job_id}")
def reanalyze_job(job_id: str):
    """Re-analyze an existing job's input from S3 and store the analysis."""
    import json
    import numpy as np
    import soundfile as sf

    response = table.get_item(Key={"id": job_id})
    item = response.get("Item")
    if not item or "input_s3_key" not in item:
        raise HTTPException(status_code=404, detail="Job not found")

    # Download input from S3
    s3_obj = s3.get_object(Bucket=S3_BUCKET, Key=item["input_s3_key"])
    wav_bytes = s3_obj["Body"].read()

    buf = io.BytesIO(wav_bytes)
    y, sr = sf.read(buf, dtype="float32")
    if y.ndim > 1:
        y = y.mean(axis=1)

    analysis = analyze_sitar(y, sr)
    taal = item.get("taal", "teentaal")

    section_ranges = _build_section_ranges(
        analysis["beat_times"], analysis["sections"], analysis["duration"]
    )
    note_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    metadata = {
        "duration": round(float(analysis["duration"]), 2),
        "global_tempo": round(float(analysis["global_tempo"]), 1),
        "tonic_hz": round(float(analysis["tonic_hz"]), 1),
        "tonic_note": note_names[analysis["tonic_class"]],
        "total_beats": len(analysis["beat_times"]),
        "sections": section_ranges,
        "taal_pattern": [bol for bol, _ in TAAL_PATTERNS[taal]["bols"]],
        "taal_beats": TAAL_PATTERNS[taal]["beats"],
    }

    table.update_item(
        Key={"id": job_id},
        UpdateExpression="SET analysis = :a",
        ExpressionAttributeValues={":a": json.dumps(metadata)},
    )

    return metadata
