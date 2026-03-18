from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.music import router as music_router
from app.routes.process import router as process_router

app = FastAPI(title="Fayez Music App", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(music_router)
app.include_router(process_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "fayez-music-app"}
