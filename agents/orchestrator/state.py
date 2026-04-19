from typing import TypedDict, Annotated
from agents.types_.context import SharedContext

# We use a TypedDict for LangGraph compatibility. 
# This ensures that every node receives and returns the full SharedContext.
class AgentState(TypedDict):
    context: SharedContext