import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from agents.utils.gemini_client import groq_client

router = APIRouter()


class SimpleGenerateRequest(BaseModel):
    run_id: str
    block_id: str
    block_type: str
    block_name: str
    block_json: dict = Field(default_factory=dict)
    shared_context: dict = Field(default_factory=dict)


class SimpleGenerateResponse(BaseModel):
    run_id: str
    block_id: str
    block_type: str
    output_code: str
    risk_level: str = "low"
    tokens_used: int = 0


@router.post("/", response_model=SimpleGenerateResponse)
async def generate(req: SimpleGenerateRequest) -> SimpleGenerateResponse:
    """
    Lightweight Groq-powered code generator.
    Each block gets its own focused system prompt based on block_type.
    """
    prompt = req.shared_context.get("prompt", "")
    project_id = req.shared_context.get("project_id", "")
    title = req.block_json.get("title", req.block_name)
    stack = req.block_json.get("stack", "")
    description = req.block_json.get("description", "")

    system_prompt = f"""You are a senior full-stack engineer generating production-ready code for a software project.
You MUST prefix every file with a comment: // FILE: path/to/filename.ext
Generate complete, working code — no placeholders, no TODO comments.
Use TypeScript unless the block type requires otherwise.
Generate multiple files if needed, each starting with // FILE: ...

Project context: {prompt}
"""

    type_instructions = {
        "auth": "Generate authentication code: middleware, session guards, JWT utilities, and auth routes.",
        "frontend": "Generate React/Next.js UI components, pages, and hooks. Use Tailwind CSS for styling.",
        "backend": "Generate API routes, controllers, and service layer code using Node.js/Express or Next.js API Routes.",
        "database": "Generate Prisma schema, migrations, and database utility functions.",
        "api": "Generate REST API endpoints with request/response types, validation, and error handling.",
        "ui": "Generate React components with Tailwind CSS, proper props types, and responsive design.",
    }

    block_instruction = type_instructions.get(
        req.block_type.lower(), 
        f"Generate production code for the {req.block_name} module."
    )

    user_message = f"""Block: {title}
Type: {req.block_type}
Stack: {stack}
Description: {description}

{block_instruction}

Start each file with: // FILE: src/{req.block_type}/{req.block_name.lower().replace(' ', '-')}/filename.ext
Generate complete working code now:"""

    try:
        response = groq_client.generate_code(
            system_prompt=system_prompt,
            user_message=user_message
        )
        output = response["text"]
        tokens = response.get("input_tokens", 0) + response.get("output_tokens", 0)

        print(f"✅ [generate] Block {req.block_id} ({req.block_type}) → {len(output)} chars, {tokens} tokens")

        return SimpleGenerateResponse(
            run_id=req.run_id,
            block_id=req.block_id,
            block_type=req.block_type,
            output_code=output,
            tokens_used=tokens
        )

    except Exception as e:
        print(f"❌ [generate] Block {req.block_id} failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")