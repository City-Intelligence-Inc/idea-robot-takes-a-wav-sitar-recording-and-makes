import os
import uuid
from datetime import datetime, timezone
from typing import Optional

import boto3
from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/music", tags=["music"])

TABLE_NAME = os.environ.get("TABLE_NAME", "fayez-music-app")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class MusicItem(BaseModel):
    id: Optional[str] = None
    title: str
    artist: str
    genre: Optional[str] = None
    bpm: Optional[int] = None
    key: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class MusicItemUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    genre: Optional[str] = None
    bpm: Optional[int] = None
    key: Optional[str] = None


# ---------------------------------------------------------------------------
# CRUD endpoints
# ---------------------------------------------------------------------------

@router.post("/", status_code=201)
def create_item(item: MusicItem) -> dict:
    if not item.id:
        item.id = str(uuid.uuid4())
    item.created_at = datetime.now(timezone.utc).isoformat()

    record = item.model_dump(exclude_none=True)
    table.put_item(Item=record)
    return record


@router.get("/")
def list_items() -> list[dict]:
    response = table.scan()
    return response.get("Items", [])


@router.get("/{item_id}")
def get_item(item_id: str) -> dict:
    response = table.get_item(Key={"id": item_id})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.put("/{item_id}")
def update_item(item_id: str, updates: MusicItemUpdate) -> dict:
    # Verify item exists
    response = table.get_item(Key={"id": item_id})
    if not response.get("Item"):
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = updates.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    update_expr_parts: list[str] = []
    expr_attr_names: dict[str, str] = {}
    expr_attr_values: dict[str, any] = {}

    for field_key, value in update_data.items():
        placeholder = f"#{field_key}"
        value_placeholder = f":{field_key}"
        update_expr_parts.append(f"{placeholder} = {value_placeholder}")
        expr_attr_names[placeholder] = field_key
        expr_attr_values[value_placeholder] = value

    update_expression = "SET " + ", ".join(update_expr_parts)

    response = table.update_item(
        Key={"id": item_id},
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expr_attr_names,
        ExpressionAttributeValues=expr_attr_values,
        ReturnValues="ALL_NEW",
    )
    return response.get("Attributes", {})


@router.delete("/{item_id}")
def delete_item(item_id: str) -> dict[str, str]:
    # Verify item exists
    response = table.get_item(Key={"id": item_id})
    if not response.get("Item"):
        raise HTTPException(status_code=404, detail="Item not found")

    table.delete_item(Key={"id": item_id})
    return {"detail": "Item deleted"}
