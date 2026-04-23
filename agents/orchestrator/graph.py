from agents.types_.state import OrchestratorState

class ExecutionGraphBuilder:
    """
    Section 4.6: Converts strategy into an executable DAG.
    """
    
    def build_dag(self, stages: list) -> dict:
        """
        Dynamically builds the DAG representation [cite: 147-157].
        """
        nodes = stages
        edges = []
        
        # Linear dependency for simple stages [cite: 150-155]
        for i in range(len(stages) - 1):
            edges.append([stages[i], stages[i+1]])
            
        return {
            "nodes": nodes,
            "edges": edges,
            "parallel_groups": [] # Independent nodes grouped for parallel execution [cite: 160]
        }

    def initialize_flow(self, state: OrchestratorState, stages: list):
        """Prepares the DAG for the Flow Engine [cite: 162]"""
        dag = self.build_dag(stages)
        print(f"[GRAPH BUILDER] Unique DAG built for {state.mode}: {dag['nodes']}")
        return dag