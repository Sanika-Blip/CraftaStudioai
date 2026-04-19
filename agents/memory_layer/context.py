from pydantic import BaseModel, Field
from typing import List, Any

class MemoryItem(BaseModel):
    type: str  # deterministic, observational, episodic
    key: str
    value: Any
    priority: str = "medium"
    source: str = "system"
    confidence: float = 1.0

class MemoryState(BaseModel):
    deterministic: List[MemoryItem] = Field(default_factory=list)
    observational: List[MemoryItem] = Field(default_factory=list)
    episodic: List[MemoryItem] = Field(default_factory=list)