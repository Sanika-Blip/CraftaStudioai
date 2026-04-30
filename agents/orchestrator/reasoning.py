import json
import logging
import asyncio

logger = logging.getLogger(__name__)

reasoning_cache = {}

def get_cache_key(project_id: str, mode: str, user_input: str) -> str:
    return f"{project_id}:{mode}:{hash(user_input)}"

def classify_mode(user_input: str) -> str:
    """Classifies reasoning mode using keyword matching."""
    user_input = user_input.lower()

    if "why" in user_input or "cause" in user_input:
        return "root_cause_analysis"
    if "optimize" in user_input or "improve" in user_input:
        return "optimization"
    if "what if" in user_input or "simulate" in user_input:
        return "simulation"
    if "conflict" in user_input:
        return "conflict_resolution"

    return "impact_analysis"

def serialize_graph(subgraph: dict) -> str:
    edges = subgraph.get("edges", [])
    lines = []
    
    if isinstance(edges, dict):
        for src, targets in edges.items():
            for tgt in targets:
                lines.append(f"{src} -> {tgt}")
    elif isinstance(edges, list):
        for edge in edges:
            if len(edge) == 2:
                lines.append(f"{edge[0]} -> {edge[1]}")
                
    return " | ".join(lines)

def extract_depth_map(subgraph: dict) -> str:
    return json.dumps(subgraph.get("levels", {}))

def build_context(project_id: str, block_id: str, subgraph: dict, memory_context: str, user_input: str = "", conflict: str = "") -> dict:
    graph_summary = serialize_graph(subgraph)
    depth_map = extract_depth_map(subgraph)

    return {
        "project_id": project_id,
        "target_block": block_id,
        "graph": graph_summary,
        "depth_map": depth_map,
        "affected_count": len(subgraph.get("nodes", [])),
        "memory": memory_context[:300],
        "user_input": user_input,
        "conflict": conflict
    }

async def llm_call(prompt: str) -> str:
    try:
        from agents.utils.llm_client import ai
        response = await asyncio.to_thread(
            ai.call,
            system_prompt="You are a senior software architect.",
            user_message=prompt
        )
        return response.get("text", "")
    except Exception as e:
        logger.warning(f"Using mock LLM response due to error: {e}")
        return '{"risk_level": "medium", "reason": "mocked response", "recommended_action": "review", "confidence": 0.8}'

def validate_output(result: dict) -> dict:
    if not result:
        return {"error": "invalid"}
    if result.get("confidence", 0) < 0.5:
        return {"error": "low_confidence", "data": result}
    return result

IMPACT_PROMPT = """You are a senior software architect.

Analyze the impact of a system change.
Use graph relationships and depth levels to reason about impact and dependencies.

Return ONLY valid JSON.

Target:
{target_block}

Graph Summary:
{graph}

Depth Map:
{depth_map}

Memory:
{memory}

Return:
{{
"risk_level": "low | medium | high",
"reason": "",
"recommended_action": "ignore | review | regenerate",
"confidence": 0.0
}}"""

ROOT_CAUSE_PROMPT = """You are a senior software architect.

Find the root cause of issues in the system.
Use graph relationships and depth levels to reason about impact and dependencies.

Return ONLY valid JSON.

Target:
{target_block}

Graph Summary:
{graph}

Depth Map:
{depth_map}

Memory:
{memory}

Return:
{{
"root_cause": "",
"explanation": "",
"confidence": 0.0
}}"""

OPTIMIZATION_PROMPT = """You are a senior software architect.

Analyze the system graph and detect architectural issues.

Return ONLY JSON.

Target:
{target_block}

Graph Summary:
{graph}

Depth Map:
{depth_map}

Memory:
{memory}

Return:
{{
"issues": [],
"suggestions": [],
"risk_level": "low|medium|high",
"confidence": 0.0
}}"""

SIMULATION_PROMPT = """You are a senior software architect.

Simulate a structural change in a system graph WITHOUT modifying the real system.

---

Target:
{target_block}

Graph Summary:
{graph}

Depth Map:
{depth_map}

Memory:
{memory}

Proposed Change:
{user_input}

---

Instructions:

Simulate structural changes logically:
* consider node split (1 -> many)
* consider node merge (many -> 1)
* consider edge rewiring (dependencies changing)
* consider dependency shifts
* consider propagation depth

Analyze:
* affected blocks
* breaking changes
* new dependencies
* removed dependencies
* risks and benefits

---

Rules:
* Use ONLY given graph
* Do NOT hallucinate unknown nodes
* Do NOT execute anything

---

Return ONLY JSON:

{{
"simulation_result": "feasible | risky | invalid",
"affected_blocks": [],
"breaking_changes": [],
"new_dependencies": [],
"removed_dependencies": [],
"risks": [],
"benefits": [],
"effort_estimate": "low | medium | high",
"confidence": 0.0
}}"""

CONFLICT_PROMPT = """You are a senior system architect.

Resolve a conflict between AI-generated changes and existing system behavior.

---

Conflict:
{conflict}

Target:
{target_block}

Graph Summary:
{graph}

Depth Map:
{depth_map}

Memory:
{memory}

---

Analyze:
* which change is safer
* which aligns with system architecture
* impact on dependencies
* long-term maintainability

---

Return ONLY JSON:

{{
"resolution": "accept_ai | keep_existing | merge | manual_review",
"reason": "",
"affected_blocks": [],
"risk_level": "low | medium | high",
"confidence": 0.0
}}"""

def get_prompt_for_mode(mode: str) -> str:
    if mode == "impact_analysis":
        return IMPACT_PROMPT
    elif mode == "root_cause_analysis":
        return ROOT_CAUSE_PROMPT
    elif mode == "optimization":
        return OPTIMIZATION_PROMPT
    elif mode == "simulation":
        return SIMULATION_PROMPT
    elif mode == "conflict_resolution":
        return CONFLICT_PROMPT
    return IMPACT_PROMPT

def get_fallback_for_mode(mode: str) -> dict:
    if mode == "impact_analysis":
        return {"risk_level": "medium", "reason": "fallback impact", "recommended_action": "review", "confidence": 0.5}
    elif mode == "root_cause_analysis":
        return {"root_cause": "fallback root cause", "explanation": "fallback explanation", "confidence": 0.5}
    elif mode == "optimization":
        return {"issues": ["fallback optimization issue"], "suggestions": ["fallback suggestion"], "risk_level": "medium", "confidence": 0.5}
    elif mode == "simulation":
        return {"simulation_result": "risky", "affected_blocks": ["fallback block"], "breaking_changes": ["fallback breaking change"], "new_dependencies": [], "removed_dependencies": [], "risks": ["fallback risk"], "benefits": ["fallback benefit"], "effort_estimate": "medium", "confidence": 0.5}
    elif mode == "conflict_resolution":
        return {"resolution": "manual_review", "reason": "fallback conflict resolution", "affected_blocks": [], "risk_level": "high", "confidence": 0.5}
    return {"risk_level": "medium", "reason": "fallback default", "recommended_action": "review", "confidence": 0.5}

async def _do_reasoning(context: dict, mode: str) -> dict:
    prompt_template = get_prompt_for_mode(mode)
    fallback = get_fallback_for_mode(mode)

    # PASS 1 (hidden reasoning)
    hidden_prompt = f"Think step by step about the graph structure and dependencies.\nDo NOT output final JSON.\nContext:\n{context}"
    reasoning = await llm_call(hidden_prompt)

    # PASS 2 (final structured output)
    final_prompt = prompt_template.format(**context) + f"\n\nInternal reasoning:\n{reasoning}"
    
    try:
        response_text = await llm_call(final_prompt)
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].strip()
            
        parsed = json.loads(response_text)
        return parsed
    except Exception as e:
        logger.error(f"Reasoning engine failed to parse response: {e}. Using fallback.")
        return fallback

async def reasoning_engine(context: dict, mode: str) -> dict:
    """
    Analyzes the context using the dynamically selected reasoning mode with caching and validation.
    """
    project_id = context.get("project_id", "default")
    user_input = context.get("user_input", "")
    conflict = context.get("conflict", "")
    
    # Simple cache key
    key_input = user_input if mode != "conflict_resolution" else conflict
    key = get_cache_key(project_id, mode, key_input)

    if key in reasoning_cache:
        logger.info(f"Reasoning Cache hit for {mode}")
        return reasoning_cache[key]

    result = await _do_reasoning(context, mode)
    
    # Strict validation
    result = validate_output(result)
    if "error" in result:
        logger.warning(f"Validation failed: {result['error']}. Falling back.")
        result = get_fallback_for_mode(mode)

    reasoning_cache[key] = result
    return result
