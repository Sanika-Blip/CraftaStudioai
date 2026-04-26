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


# Map block types / title keywords to generation instructions
def build_instruction(block_type: str, block_name: str, stack: str, description: str, project_prompt: str) -> str:
    bt = block_type.lower()
    bn = block_name.lower()

    # Detect if this is a pure frontend / UI project (calculator, todo, etc.)
    is_pure_frontend = any(k in project_prompt.lower() for k in [
        'calculator', 'todo', 'timer', 'clock', 'game', 'converter', 'quiz', 'counter'
    ])

    if 'frontend' in bt or 'ui' in bt or 'calculator' in bn or 'interface' in bn:
        if is_pure_frontend:
            return f"""Generate a COMPLETE, BEAUTIFUL, SELF-CONTAINED HTML file for: {block_name}

REQUIREMENTS:
- Output EXACTLY ONE FILE starting with: // FILE: index.html
- Include ALL CSS in a <style> tag inside the HTML
- Include ALL JavaScript in a <script> tag inside the HTML
- NO external dependencies except Google Fonts (via CDN link in head)
- Must work when opened directly in a browser (file:// protocol)
- Make it visually stunning: dark theme, gradients, smooth animations
- Fully functional — all buttons/interactions must work

Project: {project_prompt}
Description: {description}
Stack: {stack}

Generate the complete HTML now:"""
        return f"""Generate production React/Next.js UI code for: {block_name}
Stack: {stack}
Description: {description}
Project: {project_prompt}

Prefix each file with: // FILE: src/components/filename.tsx
Generate 2-3 component files with full TypeScript types and Tailwind CSS styling."""

    elif 'backend' in bt or 'api' in bt or 'server' in bt:
        return f"""Generate production backend/API code for: {block_name}
Stack: {stack}  
Description: {description}
Project: {project_prompt}

Prefix each file with: // FILE: src/filename.ts
Generate the API routes, controllers, and service layer. Use TypeScript."""

    elif 'database' in bt or 'db' in bt or 'schema' in bt:
        return f"""Generate complete database schema and utilities for: {block_name}
Stack: {stack}
Description: {description}
Project: {project_prompt}

Prefix each file with: // FILE: prisma/filename.prisma or // FILE: src/lib/filename.ts
Include: Prisma schema, seed file, and database client utilities."""

    elif 'auth' in bt or 'authentication' in bn:
        return f"""Generate authentication code for: {block_name}
Stack: {stack}
Description: {description}
Project: {project_prompt}

Prefix each file with: // FILE: src/auth/filename.ts
Include: middleware, session guards, auth utilities."""

    else:
        return f"""Generate complete, production-ready code for: {block_name}
Type: {block_type}
Stack: {stack}
Description: {description}
Project: {project_prompt}

Prefix each file with: // FILE: src/{block_type}/filename.ts
Generate complete working code — no placeholders."""


@router.post("/", response_model=SimpleGenerateResponse)
async def generate(req: SimpleGenerateRequest) -> SimpleGenerateResponse:
    """
    Direct Groq-powered code generator per block.
    """
    prompt = req.shared_context.get("prompt", "")
    title = req.block_json.get("title", req.block_name)
    stack = req.block_json.get("stack", "HTML + CSS + JavaScript")
    description = req.block_json.get("description", "")

    system_prompt = """You are a senior software engineer generating production-ready code.
RULES:
1. Prefix every file with: // FILE: path/to/filename.ext
2. Generate complete, working code — NO placeholders, NO TODO comments
3. For HTML files: include all CSS in <style> and JS in <script> tags
4. Use modern best practices
5. Code must be immediately runnable"""

    instruction = build_instruction(
        block_type=req.block_type,
        block_name=title,
        stack=stack,
        description=description,
        project_prompt=prompt
    )

    try:
        response = groq_client.generate_code(
            system_prompt=system_prompt,
            user_message=instruction
        )
        output = response["text"]
        tokens = response.get("input_tokens", 0) + response.get("output_tokens", 0)

        print(f"✅ [generate] {req.block_type}/{title} → {len(output)} chars, {tokens} tokens")

        return SimpleGenerateResponse(
            run_id=req.run_id,
            block_id=req.block_id,
            block_type=req.block_type,
            output_code=output,
            tokens_used=tokens
        )

    except Exception as e:
        print(f"❌ [generate] {req.block_id} failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")