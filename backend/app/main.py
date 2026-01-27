from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.simulate import router as simulate_router
from app.api.routes.sweep import router as sweep_router

app = FastAPI(title="VoyagerPulse API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "VoyagerPulse backend"}

# Routers (after app exists ✅)
app.include_router(simulate_router)
app.include_router(sweep_router)
