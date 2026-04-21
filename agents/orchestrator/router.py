import re
from agents.types_.state import OrchestratorState

class OrchestratorRouter:
    """
    Combines Input Gateway , Intent Engine, 
    and Mode Engine.
    """
    
    def detect_intent(self, user_input: str) -> dict:
        """Section 4.2: Rule-based Intent Detection [cite: 66]"""
        # Layer 1: Rule-based matching (fast path) [cite: 66]
        if re.search(r"create|build|start", user_input, re.I):
            return {"intent": "CREATE", "confidence": 1.0}
        if re.search(r"fix|bug|error", user_input, re.I):
            return {"intent": "DEBUG", "confidence": 1.0}
        # Fallback to LLM would happen here if confidence < 0.7 [cite: 78]
        return {"intent": "MODIFY", "confidence": 0.8}

    def get_strategy(self, intent: str) -> dict:
        """Section 4.3: Mode Engine Strategy Map [cite: 82, 83]"""
        strategies = {
            "CREATE": {"mode": "FULL_PIPELINE", "stages": ["plan", "build", "review", "deploy"]},
            "MODIFY": {"mode": "PARTIAL_PIPELINE", "stages": ["scope", "codegen", "review", "merge"]},
            "DEBUG":  {"mode": "DIAGNOSTIC_PIPELINE", "stages": ["root_cause", "patch", "validate"]}
        }
        return strategies.get(intent, strategies["MODIFY"])

    def route(self, state: OrchestratorState, raw_input: str):
        """Processes input and sets the execution strategy [cite: 81]"""
        intent_data = self.detect_intent(raw_input)
        state.intent = intent_data["intent"]
        
        strategy = self.get_strategy(state.intent)
        state.mode = strategy["mode"]
        return strategy["stages"]