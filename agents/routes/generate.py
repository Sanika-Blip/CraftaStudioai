import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Internal imports from your established structure
from agents.types_.context import SharedContext
from agents.orchestrator.graph import app_graph
from agents.utils.r2_storage import upload_block

router = APIRouter()

class GenerateRequest(BaseModel):
    """Request body for the /generate endpoint."""
    run_id: str = Field(..., description="UUID of the WorkflowRun record")
    block_id: str = Field(..., description="UUID of the Block being generated")
    block_type: str = Field(..., description="Type of block (data, api, ui, etc.)")
    block_name: str = Field(..., description="Human-readable block name")
    block_json: dict = Field(..., description="Full block definition")
    shared_context: SharedContext = Field(..., description="Shared architecture context")

class GenerateResponse(BaseModel):
    """Response from the /generate endpoint."""
    run_id: str
    block_id: str
    block_type: str
    output_code: str
    risk_level: str
    tokens_used: int

@router.post("/", response_model=GenerateResponse)
async def generate(req: GenerateRequest) -> GenerateResponse:
    """
    PRO ENTRY POINT:
    Injects the specific block data into the SharedContext and
    triggers the full LangGraph Refinement Pipeline.
    """
    try:
        # 1. Prepare the State
        state = req.shared_context

        # Reset transient state for the new block generation
        state.generated_code = ""
        state.loop_count = 0

        # 2. TRIGGER THE AGENTIC GRAPH
        # 🔥 FIX: We pass the 'run_id' as the thread_id for persistence.
        # This allows the SQLite checkpointer to save the state of this specific run.
        config = {"configurable": {"thread_id": req.run_id}}

        # Use invoke to run the graph from Planner -> Generator -> Reviewer
        final_state = app_graph.invoke(state, config=config)

        # 3. Calculate total tokens from the state
        total_tokens = final_state.token_usage.get("input", 0) + final_state.token_usage.get("output", 0)

        # 4. ✅ Upload generated block output to Cloudflare R2
        try:
            upload_block(
                block_id=req.block_id,
                content={
                    "run_id": req.run_id,
                    "block_id": req.block_id,
                    "block_type": req.block_type,
                    "block_name": req.block_name,
                    "output_code": final_state.generated_code,
                    "risk_level": final_state.risk_level,
                    "tokens_used": total_tokens,
                }
            )
            print(f"✅ Block {req.block_id} uploaded to R2")
        except Exception as r2_err:
            # R2 failure is non-fatal — log it but don't crash generation
            print(f"⚠️ R2 upload failed for block {req.block_id}: {r2_err}")

        # 5. Return response
        return GenerateResponse(
            run_id=req.run_id,
            block_id=req.block_id,
            block_type=req.block_type,
            output_code=final_state.generated_code,
            risk_level=final_state.risk_level,
            tokens_used=total_tokens
        )

    except Exception as e:
        print(f"PIPELINE ERROR for block {req.block_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Agent Pipeline Failed: {str(e)}")