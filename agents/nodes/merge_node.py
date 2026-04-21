from agents.types_.context import SharedContext
from agents.utils.parser import parse_and_write_files
from agents.utils.llm_client import langfuse
from agents.memory_layer.extractor import run_full_extraction # 🔥 Added
from agents.memory_layer import store_memory # 🔥 Added

def merge_node(state: SharedContext) -> SharedContext:
    # Section 4.13: Observability Engine - Start Span for tracking latency [cite: 250, 396]
    span = langfuse.span(
        name="File System Merge",
        trace_id=state.trace_id,
        input={"project": state.project}
    )

    print(f"\n[NODE: MERGE] Attempting to write project files to disk for: {state.project}")
    success = parse_and_write_files(state.generated_code)
    
    # Section 4.4: Context Engine - Extracting episodic memory [cite: 91, 100]
    execution_summary = f"Status: {state.status}. Project: {state.project}"
    new_memory = run_full_extraction(execution_summary, state.trace_id)

    # Section 4.8: State Engine Mapping
    # Aligning internal agent state with deterministic DB schema [cite: 181]
    persistence_payload = {
        **new_memory.model_dump(),
        "outputCode": state.generated_code,         # Map per Backend Request
        "severity": getattr(state, 'risk_level', 'low'), # Section 4.12: Risk assessment
        "editRequest": getattr(state, 'user_edit_request', None) # Support for Bug Fix Flow [cite: 297]
    }

    if success:
        state.status = "done" # Section 4.8: Finalizing status [cite: 186]
        print("[NODE: MERGE] ✅ Project files successfully written to the file system.")
        
        # Store new knowledge + mapped DB fields in Durable Store
        store_memory(state.trace_id, persistence_payload)
        
        span.end(output={"status": "success", "files_written": True})
    else:
        state.status = "failed" # Section 4.10: Failure escalation [cite: 216]
        print("[NODE: MERGE] ❌ Merge failed: No valid file blocks were detected.")
        
        # Store failure event metadata for diagnostic pipelines [cite: 83, 304]
        store_memory(state.trace_id, persistence_payload)
        
        span.end(output={"status": "failed"}, level="WARNING")
        
    return state