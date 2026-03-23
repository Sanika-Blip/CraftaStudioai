# CraftaStudio — agents/routes/plan.py
"""
Planner agent route.

Receives: User prompt + list of block types in the project
Returns:  SharedContext — the structured architectural contract
          used by all downstream generator agents.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import anthropic
import json
import os

from types_.context import SharedContext

router = APIRouter()

# Lazy-initialised Anthropic client — key sourced from ANTHROPIC_API_KEY env var
_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    """Returns the shared Anthropic client, initialising it on first call."""
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY environment variable is not set")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


class PlanRequest(BaseModel):
    """Request body for the /plan endpoint."""

    run_id: str = Field(..., description="UUID of the WorkflowRun record")
    project_name: str = Field(..., description="Human-readable project name")
    prompt: str = Field(
        ...,
        min_length=10,
        description="User's natural-language architecture intent",
    )
    block_types: list[str] = Field(
        ...,
        description="Block types present in the canvas (e.g. ['data', 'api', 'ui'])",
    )


class PlanResponse(BaseModel):
    """Response from the /plan endpoint."""

    run_id: str
    shared_context: SharedContext


@router.post("/", response_model=PlanResponse)
async def plan(req: PlanRequest) -> PlanResponse:
    """
    Planner agent endpoint.

    Calls Claude claude-3-5-sonnet-20241022 with the planner system prompt to produce
    a structured SharedContext in JSON. This context is then broadcast to
    all parallel generator agents.

    Args:
        req: PlanRequest containing run_id, project_name, prompt, block_types

    Returns:
        PlanResponse with run_id and the populated SharedContext

    Raises:
        HTTPException 500 if Claude fails or returns invalid JSON
    """
    # Load system prompt from file — no hardcoded prompts
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "planner_system.txt")
    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    user_message = (
        f"Project: {req.project_name}\n"
        f"Prompt: {req.prompt}\n"
        f"Block types on canvas: {', '.join(req.block_types)}\n\n"
        "Produce the SharedContext JSON."
    )

    client = _get_client()

    try:
        message = client.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5"),
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
    except anthropic.APIError as exc:
        raise HTTPException(status_code=500, detail=f"Anthropic API error: {exc}") from exc

    raw_text = message.content[0].text if message.content else ""

    try:
        # Claude should return the JSON block inside triple backticks
        json_str = raw_text.strip()
        if json_str.startswith("```"):
            json_str = json_str.split("```")[1]
            if json_str.startswith("json"):
                json_str = json_str[4:]
        context_dict: dict = json.loads(json_str)
        shared_context = SharedContext(**context_dict)
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse SharedContext from Claude response: {exc}\nRaw: {raw_text[:500]}",
        ) from exc

    return PlanResponse(run_id=req.run_id, shared_context=shared_context)
