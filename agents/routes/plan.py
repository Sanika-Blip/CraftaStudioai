import os
import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List

# Internal imports
from agents.types_.context import SharedContext
from agents.utils.llm_client import ai 
from agents.memory_layer import retrieve_memory 

router = APIRouter()

# 🔥 MODELS DEFINED FIRST TO PREVENT NameError
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

    # 🔥 AI-12: Retrieve existing memory to inject into context
    past_memory = retrieve_memory(req.run_id)
    memory_context = f"\n[PAST MEMORY INJECTION]: {json.dumps(past_memory)}" if past_memory else ""

    user_message = (
        f"Project: {req.project_name}\n"
        f"User Intent: {req.prompt}\n"
        f"Required Blocks: {', '.join(req.block_types)}\n"
        f"{memory_context}\n\n" # 🔥 Injected here
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
        raise HTTPException(status_code=500, detail=f"Claude returned invalid JSON: {str(e)}")
    except Exception as e:
        print(f"PLANNING ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Architecture Planning Failed: {str(e)}")