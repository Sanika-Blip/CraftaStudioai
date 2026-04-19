import json
from agents.utils.database import get_db_connection
from typing import Any

def retrieve_memory(trace_id: str) -> dict:
    """
    Fetches the memory from the database to inject into the new Agent turn.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    query = 'SELECT "sharedContextJson" FROM workflow_runs WHERE id = %s'
    cur.execute(query, (trace_id,))
    result = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if result and result[0]:
        return result[0].get("memory", {})
    
    return {"deterministic": [], "observational": [], "episodic": []}

def store_memory(trace_id: str, shared_context: Any) -> bool:
    """
    Saves the full SharedContext (including updated memory) back to the database.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Convert Pydantic model to JSON string if it isn't already a dict
        context_json = shared_context.model_dump_json() if hasattr(shared_context, 'model_dump_json') else json.dumps(shared_context)

        query = """
            UPDATE workflow_runs 
            SET "sharedContextJson" = %s, "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        cur.execute(query, (context_json, trace_id))
        conn.commit()

        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ DATABASE STORE ERROR: {str(e)}")
        return False