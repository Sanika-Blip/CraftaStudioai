import os
import sqlite3
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver 
from agents.types_.context import SharedContext

# 🔥 FIXED: Import the specific functions, not the modules
from agents.nodes.planner_node import planner_node
from agents.nodes.backend_node import backend_node
from agents.nodes.reviewer_node import reviewer_node
from agents.nodes.merge_node import merge_node
from agents.nodes.refactor_node import refactor_node

load_dotenv()

# 1. Setup Persistent Checkpointer
db_path = "checkpoints.sqlite"
conn = sqlite3.connect(db_path, check_same_thread=False)
memory = SqliteSaver(conn)

# 2. Initialize Graph
workflow = StateGraph(SharedContext)

# 3. Enhanced Router Logic
def router_logic(state: SharedContext):
    if getattr(state, "user_edit_request", None) and state.status != "refactoring":
        print("[ROUTER] 🛠️ Switching to Refactor mode.")
        return "refactor"

    if state.risk_level == "high" and state.loop_count < 3:
        print(f"[ROUTER] 🔄 Quality check failed. Retrying (Loop {state.loop_count}/3)")
        return "recode"
    
    print("[ROUTER] ✅ Moving to Final Merge.")
    return "finalize"

# 4. Building the Assembly Line
# Now these variables refer to FUNCTIONS, not modules.
workflow.add_node("planner", planner_node)
workflow.add_node("generator", backend_node)
workflow.add_node("reviewer", reviewer_node)
workflow.add_node("merger", merge_node)
workflow.add_node("refactor", refactor_node)

# 5. Defining the Connections
workflow.set_entry_point("planner")
workflow.add_edge("planner", "generator")
workflow.add_edge("generator", "reviewer")

workflow.add_conditional_edges(
    "reviewer",
    router_logic,
    {
        "recode": "generator",
        "refactor": "refactor",
        "finalize": "merger"
    }
)

workflow.add_edge("refactor", "reviewer")
workflow.add_edge("merger", END)

# 6. Compile
app_graph = workflow.compile(checkpointer=memory)