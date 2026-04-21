from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class OrchestratorState(BaseModel):
    """
    Implements Section 4.8: State Engine [cite: 178]
    Maintains real-time and durable execution records.
    """
    execution_id: str = Field(..., description="Globally unique ID for tracing [cite: 57]")
    project_id: str
    current_step: str = "input_gateway"
    status: str = "PENDING"  # PENDING | RUNNING | PAUSED | DONE | FAILED [cite: 186]
    progress: int = 0         # percentage [cite: 188]
    completed: List[str] = []
    failed: List[str] = []
    
    # Metadata for auditing [cite: 191, 192]
    started_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Section 4.2 & 4.3: Intent and Mode [cite: 60, 79]
    intent: Optional[str] = None
    mode: Optional[str] = None  # Strategy from Mode Engine [cite: 81]