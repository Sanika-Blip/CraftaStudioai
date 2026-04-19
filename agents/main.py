import os
import uvicorn
import uuid 
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

# Internal imports
from agents.routes import plan, generate
from agents.utils.database import load_project_context 
from agents.types_.context import SharedContext
# 🔥 Import the graph so the API can trigger the orchestrator
from agents.orchestrator.graph import app_graph 

app = FastAPI(
    title="CraftaStudio Agent Service",
    description="Parallel AI agents for architecture-driven code generation",
    version="1.0.0",
)

# ── AI-12: MEMORY RE-HYDRATION HELPER ───────────────────────
@app.get("/api/v1/context/{project_id}")
async def get_memory(project_id: str):
    """
    Retrieves the persistent memory from PostgreSQL.
    Ensures agents remember earlier decisions in long projects.
    """
    existing_context = load_project_context(project_id)
    if existing_context:
        # Return the context so the Frontend can populate the next request
        return {"status": "memory_found", "context": existing_context}
    return {"status": "new_project", "context": None}

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Set to specific URL in production
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Middleware for AI-11 Tracing ──────────────────────────────
@app.middleware("http")
async def add_trace_id_header(request: Request, call_next):
    # Ensure every API call has a unique ID for Langfuse/Logging
    trace_id = request.headers.get("X-Trace-Id", str(uuid.uuid4()))
    request.state.trace_id = trace_id
    response = await call_next(request)
    response.headers["X-Trace-Id"] = trace_id
    return response

# ── Global Exception Handler ──────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"💥 GLOBAL ERROR: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Agent Error", "details": str(exc)},
    )

# ── Routes ───────────────────────────────────────────────────
app.include_router(plan.router, prefix="/api/v1/plan", tags=["Planner"])
app.include_router(generate.router, prefix="/api/v1/generate", tags=["Generator"])

@app.get("/health", tags=["Health"])
async def health() -> dict[str, str]:
    return {
        "status": "online",
        "service": "CraftaStudio-Agent-Layer",
        "engine": "Gemini-3-Flash"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Note: Use "agents.main:app" if running from the root folder
    uvicorn.run("agents.main:app", host="0.0.0.0", port=port, reload=True)