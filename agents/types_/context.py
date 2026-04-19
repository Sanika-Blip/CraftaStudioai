from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional

# --- CONFIGURATION ---
class RelaxedBase(BaseModel):
    model_config = ConfigDict(
        extra='allow',
        arbitrary_types_allowed=True, 
        validate_assignment=False 
    )

# --- SUB-MODELS ---
class TechStack(RelaxedBase):
    backend: str = "Not Specified"
    frontend: str = "Not Specified"
    db: str = "Not Specified"
    auth: str = "Not Specified"

class Conventions(RelaxedBase):
    casing: str = "camelCase"
    auth: str = "Standard"
    errors: str = "JSON"
    responses: str = "Standard"

class EntityField(RelaxedBase):
    name: str
    type: str = "string"
    primary: bool = False
    unique: bool = False
    nullable: bool = True

class EntityDefinition(RelaxedBase):
    fields: List[EntityField] = Field(default_factory=list)

class MemoryItem(RelaxedBase):
    type: str  
    key: str
    value: Any
    priority: str = "medium"
    source: str = "system"
    confidence: float = 1.0

class MemoryState(RelaxedBase):
    deterministic: List[MemoryItem] = Field(default_factory=list)
    observational: List[MemoryItem] = Field(default_factory=list)
    episodic: List[MemoryItem] = Field(default_factory=list)

# --- MAIN CONTEXT ---
class SharedContext(RelaxedBase):
    project: str
    trace_id: str
    version: int = 1
    
    memory: MemoryState = Field(default_factory=MemoryState)
    tech_stack: TechStack = Field(default_factory=TechStack)
    conventions: Conventions = Field(default_factory=Conventions)
    entities: Dict[str, EntityDefinition] = Field(default_factory=dict)
    api_routes: Dict[str, Any] = Field(default_factory=dict)
    
    generated_code: str = ""
    status: str = "pending"
    risk_level: str = "low"
    loop_count: int = 0
    agent_feedback: List[str] = Field(default_factory=list)
    token_usage: Dict[str, int] = Field(default_factory=lambda: {"input": 0, "output": 0})
    user_edit_request: Optional[str] = None