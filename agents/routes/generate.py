# CraftaStudio — agents/routes/generate.py
"""
Generator agent route.

Receives: SharedContext + one block definition
Returns:  Generated source code for that specific block type

Each block type has a dedicated system prompt that knows exactly
what to generate (SQL schema, API routes, React components, etc.)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import anthropic
import os

from types_.context import SharedContext

router = APIRouter()

_client: anthropic.Anthropic | None = None

# Maps block type → prompt filename in agents/prompts/
BLOCK_PROMPT_MAP: dict[str, str] = {
    "data":        "db_agent.txt",
    "api":         "backend_agent.txt",
    "ui":          "frontend_agent.txt",
    "service":     "backend_agent.txt",
    "integration": "backend_agent.txt",
    "auth":        "backend_agent.txt",
    "job":         "backend_agent.txt",
}


def _get_client() -> anthropic.Anthropic:
    """Returns the shared Anthropic client, initialising it on first call."""
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY environment variable is not set")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


class GenerateRequest(BaseModel):
    """Request body for the /generate endpoint."""

    run_id: str = Field(..., description="UUID of the WorkflowRun record")
    block_id: str = Field(..., description="UUID of the Block being generated")
    block_type: str = Field(..., description="Type of block — must match a key in BLOCK_PROMPT_MAP")
    block_name: str = Field(..., description="Human-readable block name (e.g. 'UserProfile')")
    block_json: dict = Field(..., description="Full block definition including schema fields")
    shared_context: SharedContext = Field(..., description="Shared architecture context from the Planner")


class GenerateResponse(BaseModel):
    """Response from the /generate endpoint."""

    run_id: str
    block_id: str
    block_type: str
    output_code: str
    tokens_used: int


@router.post("/", response_model=GenerateResponse)
async def generate(req: GenerateRequest) -> GenerateResponse:
    """
    Generator agent endpoint.

    Selects the correct system prompt for the given block_type, then calls
    Claude to generate code for that specific block in the context of the
    full SharedContext (so it knows entities, routes, conventions, etc.)

    Args:
        req: GenerateRequest with block details + shared context

    Returns:
        GenerateResponse with generated source code and token count

    Raises:
        HTTPException 400 if block_type is unknown
        HTTPException 500 if Claude API call fails
    """
    if req.block_type not in BLOCK_PROMPT_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown block type '{req.block_type}'. Valid types: {list(BLOCK_PROMPT_MAP.keys())}",
        )

    prompt_file = BLOCK_PROMPT_MAP[req.block_type]
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", prompt_file)

    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    user_message = (
        f"SharedContext:\n{req.shared_context.model_dump_json(indent=2)}\n\n"
        f"Block to generate:\n"
        f"  type: {req.block_type}\n"
        f"  name: {req.block_name}\n"
        f"  definition:\n{req.block_json}\n\n"
        "Generate the complete source code for this block."
    )

    client = _get_client()

    try:
        message = client.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5"),
            max_tokens=8192,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
    except anthropic.APIError as exc:
        raise HTTPException(status_code=500, detail=f"Anthropic API error: {exc}") from exc

    output_code = message.content[0].text if message.content else ""
    tokens_used = message.usage.input_tokens + message.usage.output_tokens

    return GenerateResponse(
        run_id=req.run_id,
        block_id=req.block_id,
        block_type=req.block_type,
        output_code=output_code,
        tokens_used=tokens_used,
    )
