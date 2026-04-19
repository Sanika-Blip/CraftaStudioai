from agents.types_.context import SharedContext
from agents.utils.parser import parse_and_write_files
from agents.utils.llm_client import langfuse
from agents.memory_layer.extractor import run_full_extraction # 🔥 Added
from agents.memory_layer import store_memory # 🔥 Added

def merge_node(state: SharedContext) -> SharedContext:
    span = langfuse.span(
        name="File System Merge",
        trace_id=state.trace_id,
        input={"project": state.project}
    )

    print(f"\n[NODE: MERGE] Attempting to write project files to disk for: {state.project}")
    success = parse_and_write_files(state.generated_code)
    
    # 🔥 AI-12: Intelligence Extraction (Captures what happened in this run)
    # We use the generated_code and current status as the "input" for episodic memory
    execution_summary = f"Status: {state.status}. Project: {state.project}"
    new_memory = run_full_extraction(execution_summary, state.trace_id)

    if success:
        state.status = "done"
        print("[NODE: MERGE] ✅ Project files successfully written to the file system.")
        
        # 🔥 Store new knowledge in DB
        store_memory(state.trace_id, new_memory.model_dump())
        
        span.end(output={"status": "success", "files_written": True})
    else:
        state.status = "failed"
        print("[NODE: MERGE] ❌ Merge failed: No valid file blocks were detected.")
        
        # 🔥 Store failure event in episodic memory
        store_memory(state.trace_id, new_memory.model_dump())
        
        span.end(output={"status": "failed"}, level="WARNING")
        
    return state