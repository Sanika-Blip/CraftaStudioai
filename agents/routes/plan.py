import os
import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Any

# Internal imports
from agents.types_.context import SharedContext
from agents.utils.llm_client import ai 
from agents.memory_layer import retrieve_memory 

router = APIRouter()

# ── JSON repair helper ─────────────────────────────────────────────────────────
def repair_json(raw: str) -> str:
    """
    Attempt to recover a valid JSON object from a potentially truncated LLM response.
    Strategy:
      1. Strip markdown fences.
      2. Find the first '{' and try to parse everything up to the last '}'.
      3. If that fails, balance unclosed brackets/braces and retry.
    """
    # Strip markdown fences
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw)
    text = fence_match.group(1) if fence_match else raw.strip()

    # Find outermost JSON object boundaries
    start = text.find("{")
    if start == -1:
        return text  # Let caller raise the parse error

    # Try the clean parse first (common case)
    end = text.rfind("}")
    if end != -1:
        candidate = text[start:end + 1]
        try:
            json.loads(candidate)
            return candidate
        except json.JSONDecodeError:
            pass

    # Balance truncated JSON by counting open brackets
    segment = text[start:]
    depth_brace = 0
    depth_bracket = 0
    in_string = False
    escape = False

    for i, ch in enumerate(segment):
        if escape:
            escape = False
            continue
        if ch == "\\" and in_string:
            escape = True
            continue
        if ch == '"' and not escape:
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth_brace += 1
        elif ch == "}":
            depth_brace -= 1
        elif ch == "[":
            depth_bracket += 1
        elif ch == "]":
            depth_bracket -= 1

    # Close any unterminated string
    if in_string:
        segment += '"'

    # Close open arrays then objects
    segment += "]" * depth_bracket + "}" * depth_brace

    return segment



# ── Existing plan endpoint models ──────────────────────────────────────────────
class PlanRequest(BaseModel):
    run_id: str
    project_name: str
    prompt: str
    block_types: List[str]

class PlanResponse(BaseModel):
    run_id: str
    shared_context: SharedContext

@router.post("/", response_model=PlanResponse)
async def plan(req: PlanRequest) -> PlanResponse:
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "planner_system.txt")
    
    if not os.path.exists(prompt_path):
        raise HTTPException(status_code=500, detail="System prompt 'planner_system.txt' missing.")

    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    past_memory = retrieve_memory(req.run_id)
    memory_context = f"\n[PAST MEMORY INJECTION]: {json.dumps(past_memory)}" if past_memory else ""

    user_message = (
        f"Project: {req.project_name}\n"
        f"User Intent: {req.prompt}\n"
        f"Required Blocks: {', '.join(req.block_types)}\n"
        f"{memory_context}\n\n"
        "Generate the SharedContext JSON now."
    )

    try:
        response = ai.call(system_prompt=system_prompt, user_message=user_message)
        raw_text = response["text"]

        json_match = re.search(r"```json\s*([\s\S]*?)\s*```", raw_text)
        json_str = json_match.group(1) if json_match else raw_text.strip()

        context_dict = json.loads(json_str)
        shared_context = SharedContext(**context_dict)

        shared_context.token_usage["input"] += response["input_tokens"]
        shared_context.token_usage["output"] += response["output_tokens"]

        return PlanResponse(run_id=req.run_id, shared_context=shared_context)

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"LLM returned invalid JSON: {str(e)}")
    except Exception as e:
        print(f"PLANNING ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Architecture Planning Failed: {str(e)}")


# ── NEW: Plan Document endpoint ────────────────────────────────────────────────
class PlanDocRequest(BaseModel):
    prompt: str
    project_name: Optional[str] = "My Project"

class PlanDocResponse(BaseModel):
    title: str
    summary: str
    markdown: str
    blocks: List[Any]
    is_chat: bool = False

@router.post("/doc", response_model=PlanDocResponse)
async def plan_doc(req: PlanDocRequest) -> PlanDocResponse:
    """
    Calls Sarvam LLM to generate a rich Architecture Plan Document.
    Returns structured markdown + canvas-ready block list.
    """
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "plan_doc.txt")

    if not os.path.exists(prompt_path):
        raise HTTPException(status_code=500, detail="System prompt 'plan_doc.txt' missing.")

    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    user_message = (
        f"Project Name: {req.project_name}\n"
        f"User Request: {req.prompt}\n\n"
        "Generate the Architecture Plan JSON now. Respond with ONLY valid JSON."
    )

    try:
        response = ai.call(system_prompt=system_prompt, user_message=user_message)
        raw_text = response["text"].strip()

        # Use repair_json to handle truncated or fence-wrapped LLM output
        json_str = repair_json(raw_text)

        try:
            plan_data = json.loads(json_str)
        except json.JSONDecodeError as inner_e:
            print(f"[plan-doc] JSON parse error after repair: {inner_e}")
            print(f"[plan-doc] Raw (first 800 chars): {raw_text[:800]}")
            raise HTTPException(
                status_code=500,
                detail=f"LLM returned invalid JSON: {str(inner_e)}"
            )

        return PlanDocResponse(
            title=plan_data.get("title", req.project_name),
            summary=plan_data.get("summary", ""),
            markdown=plan_data.get("markdown", ""),
            blocks=plan_data.get("blocks", []),
            is_chat=plan_data.get("is_chat", False)
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[plan-doc] ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)}")