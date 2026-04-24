from agents.nodes import backend_node, merge_node, planner_node, reviewer_node
from agents.types_.context import SharedContext

MAX_REVIEW_ATTEMPTS = 3


class AppGraph:
    """Minimal executable graph wrapper for the agents pipeline."""

    def invoke(self, state: SharedContext, config: dict | None = None) -> SharedContext:
        current_state = state
        thread_id = ((config or {}).get("configurable") or {}).get("thread_id")

        if thread_id and not getattr(current_state, "trace_id", None):
            current_state.trace_id = thread_id

        current_state = planner_node(current_state)

        while True:
            current_state = backend_node(current_state)
            current_state = reviewer_node(current_state)

            if current_state.risk_level == "low":
                return merge_node(current_state)

            if current_state.loop_count >= MAX_REVIEW_ATTEMPTS:
                current_state.status = "failed"
                return current_state


app_graph = AppGraph()
