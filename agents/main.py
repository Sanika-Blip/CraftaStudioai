# CraftaStudio — agents/main.py
"""
FastAPI application entry point for the CraftaStudio agent service.

This service hosts the Python AI agents powered by Anthropic + LangGraph.
It exposes two primary endpoints:
  POST /plan      — Planner agent: converts user prompt → SharedContext
  POST /generate  — Generator agents: produces code for one block type
"""

from dotenv import load_dotenv

# Load environment variables before any other imports
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from routes.plan import router as plan_router
from routes.generate import router as generate_router

app = FastAPI(
    title="CraftaStudio Agent Service",
    description="Parallel AI agents for architecture-driven code generation",
    version="0.1.0",
)

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("BACKEND_URL", "http://localhost:3001")],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────
app.include_router(plan_router, prefix="/plan", tags=["Planner"])
app.include_router(generate_router, prefix="/generate", tags=["Generator"])


@app.get("/health", tags=["Health"])
async def health() -> dict[str, str]:
    """Health check endpoint — used by backend to verify agent service is up."""
    return {"status": "ok"}
