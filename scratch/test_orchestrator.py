import asyncio
import os
import json
from agents.db.db_client import db, connect_db, log_event
from agents.orchestrator.event_listener import handle_event

async def test():
    project_id = "test-project-123"
    
    await connect_db()
    
    print("\n--- SIMULATING EXTERNAL EVENT ---")
    await log_event(project_id, "BLOCK_UPDATED", {"blockId": "user-model"})
    print("Inserted 'BLOCK_UPDATED' event into EventLog.")

    print("\n--- RUNNING EVENT HANDLER ---")
    events = await db.eventlog.find_many(
        where={"processed": False},
        take=1
    )
    
    if events:
        event = events[0]
        await handle_event(event)
        
        # Verify it was processed
        processed_event = await db.eventlog.find_unique(where={"id": event.id})
        print(f"\nEvent {event.id} processed status: {processed_event.processed}")
    else:
        print("No events found!")

if __name__ == "__main__":
    asyncio.run(test())
