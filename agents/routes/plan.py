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

# ── Graph Extraction & Validation ──────────────────────────────────────────────
def extract_graph(raw_text: str) -> dict:
    """Extracts the JSON graph from the markdown output."""
    json_blocks = re.findall(r"```json\s*([\s\S]*?)\s*```", raw_text)
    if json_blocks:
        try:
            return json.loads(json_blocks[-1])
        except json.JSONDecodeError:
            pass
    return {"nodes": [], "edges": []}

def validate_graph(graph: dict):
    """Validates the structure of the graph."""
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    
    node_ids = {n.get("node_id") for n in nodes if n.get("node_id")}
    
    for edge in edges:
        if edge.get("from") not in node_ids:
            raise ValueError(f"Invalid edge: 'from' node '{edge.get('from')}' does not exist.")
        if edge.get("to") not in node_ids:
            raise ValueError(f"Invalid edge: 'to' node '{edge.get('to')}' does not exist.")
            
    # Simple cycle detection (DFS)
    adj = {n: [] for n in node_ids}
    for edge in edges:
        from_node = edge.get("from")
        to_node = edge.get("to")
        if from_node in adj and to_node in adj:
            adj[from_node].append(to_node)
            
    visited = set()
    rec_stack = set()
    
    def dfs(node):
        visited.add(node)
        rec_stack.add(node)
        for neighbor in adj.get(node, []):
            if neighbor not in visited:
                if dfs(neighbor):
                    return True
            elif neighbor in rec_stack:
                return True
        rec_stack.remove(node)
        return False
        
    for node in node_ids:
        if node not in visited:
            if dfs(node):
                raise ValueError("Graph contains a cycle.")

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
    graph: Optional[dict] = None

@router.post("/doc", response_model=PlanDocResponse)
async def plan_doc(req: PlanDocRequest) -> PlanDocResponse:
    """
    Calls Sarvam LLM to generate a rich Architecture Plan Document.
    Returns structured markdown + canvas-ready block list parsed from the markdown table.
    """
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "plan_doc.txt")

    if not os.path.exists(prompt_path):
        raise HTTPException(status_code=500, detail="System prompt 'plan_doc.txt' missing.")

    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    user_message = (
        f"Project Name: {req.project_name}\n"
        f"User Request: {req.prompt}\n\n"
        "Generate the Architecture Plan in strict Markdown format now."
    )

    try:
        response = ai.call(system_prompt=system_prompt, user_message=user_message)
        raw_text = response["text"].strip()

        title = req.project_name or "Architecture Plan"
        summary = "Architecture plan generated from prompt."
        is_chat = False
        blocks = []

        if "## Blocks" not in raw_text and "### " not in raw_text:
            is_chat = True
        else:
            lines = raw_text.split("\n")
            for line in lines:
                line = line.strip()
                if line.startswith("### "):
                    # More lenient block matching: `### Block Name (type)`
                    match = re.search(r"^###\s+(.+?)(?:\s*\((.+?)\))?$", line)
                    if match:
                        block_title = match.group(1).strip("*_ \t")
                        block_type = match.group(2).strip("*_ \t").lower() if match.group(2) else "service"
                        
                        # Filter out common markdown headers that aren't blocks
                        if block_title.lower() in ["description", "responsibilities", "inputs", "outputs", "dependencies", "tech", "overview", "architecture"]:
                            continue
                            
                        # Extract clean ID
                        clean_id = re.sub(r'[^a-zA-Z0-9-]', '', block_type.replace(' ', '-'))
                        if not clean_id:
                            clean_id = "service"
                            
                        blocks.append({
                            "id": f"blk-{clean_id}-{len(blocks)}", # Ensure unique ID
                            "title": block_title,
                            "blockType": block_type,
                            "type": "block",
                            "stack": "Default Stack",
                            "description": "",
                            "status": "idle",
                            "subBlocks": []
                        })

        graph_data = extract_graph(raw_text)
        try:
            validate_graph(graph_data)
        except ValueError as ve:
            print(f"[plan-doc] Graph validation warning: {ve}")

        return PlanDocResponse(
            title=title,
            summary=summary,
            markdown=raw_text,
            blocks=blocks,
            is_chat=is_chat,
            graph=graph_data
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[plan-doc] ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)}")