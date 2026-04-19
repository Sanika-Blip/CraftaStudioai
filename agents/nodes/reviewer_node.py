from agents.types_.context import SharedContext
from agents.utils.llm_client import ai
from agents.utils.prompt_engine import build_prompt
import json
import re

def reviewer_node(state: SharedContext) -> SharedContext:
    print(f"\n[NODE: REVIEWER] 🔍 Auditing code & compliance: {state.project}")

    system_prompt = build_prompt("reviewer_agent", state)

    # 🔥 FIX: Specifically ask the AI to check compliance against the Plan and Memory
    user_message = (
        f"PLAN REQUIREMENTS:\nTech Stack: {state.tech_stack}\nConventions: {state.conventions}\n\n"
        f"GENERATED CODE:\n{state.generated_code}\n\n"
        "TASK: Check if the code matches the Tech Stack and Conventions exactly. "
        "If the plan said 'Use PostgreSQL' but the code uses 'MongoDB', set risk_level to 'high'. "
        "Return ONLY a JSON: { 'risk_level': 'low|medium|high', 'feedback': [] }"
    )

    try:
        response = ai.call(
            system_prompt=system_prompt,
            user_message=user_message,
            current_usage=state.token_usage["input"] + state.token_usage["output"]
        )

        json_match = re.search(r"({[\s\S]*})", response["text"])
        
        if json_match:
            verdict = json.loads(json_match.group(1))
            state.risk_level = verdict.get("risk_level", "high")
            state.agent_feedback = verdict.get("feedback", [])
            
            # 🔥 FIX: Always increment loop_count here to drive the Orchestrator
            if state.risk_level != "low":
                state.loop_count += 1
                print(f"[NODE: REVIEWER] ⚠️ Issues Found! Attempt {state.loop_count}/3")
            else:
                print(f"[NODE: REVIEWER] ✅ Code is compliant and safe.")

        state.token_usage["input"] += response.get("input_tokens", 0)
        state.token_usage["output"] += response.get("output_tokens", 0)

    except Exception as e:
        print(f"[NODE: REVIEWER] ❌ Audit Failure: {str(e)}")
        state.risk_level = "high"
        state.loop_count += 1

    return state