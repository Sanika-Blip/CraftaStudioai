import json
import logging
import asyncio
from agents.db.db_client import db, connect_db

logger = logging.getLogger(__name__)

async def generate_plan(user_input: str) -> dict:
    """
    Uses the reasoning engine to convert the user request into a graph system plan.
    """
    prompt = f"""You are a software architect.

Convert the user request into a system graph.

Return ONLY JSON.

User Request:
{user_input}

Return format:
{{
"blocks": [
{{"name": "auth-api", "type": "backend"}},
{{"name": "auth-db", "type": "database"}},
{{"name": "auth-ui", "type": "frontend"}}
],
"connections": [
["auth-api", "auth-db"],
["auth-ui", "auth-api"]
]
}}
"""

    fallback = {
        "blocks": [
            {"name": "default-ui", "type": "frontend"},
            {"name": "default-api", "type": "backend"}
        ],
        "connections": [
            ["default-ui", "default-api"]
        ]
    }

    try:
        from agents.utils.llm_client import ai
        response_text = await asyncio.to_thread(
            ai.call,
            system_prompt="You are a senior software architect.",
            user_message=prompt
        )

        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].strip()
            
        parsed = json.loads(response_text)
        
        if "blocks" not in parsed or "connections" not in parsed:
            logger.warning("Planner LLM response missing required keys, using fallback")
            return fallback
            
        return parsed
    except Exception as e:
        logger.error(f"Planner failed to parse response: {e}. Using fallback.")
        return fallback

async def save_plan(project_id: str, plan: dict):
    """
    Saves the generated blocks and connections to the database.
    """
    await connect_db()
    
    block_id_map = {}
    
    # Insert Blocks
    for block_data in plan.get("blocks", []):
        block_name = block_data.get("name")
        block_type = block_data.get("type", "backend")
        
        if not block_name:
            continue
            
        created_block = await db.block.create(
            data={
                "projectId": project_id,
                "blockType": block_name,
                "blockJson": json.dumps({"type": block_type}),
                "uiMeta": json.dumps({"label": block_name})
            }
        )
        block_id_map[block_name] = created_block.id

    # Insert Connections
    for connection in plan.get("connections", []):
        if len(connection) != 2:
            continue
            
        from_name = connection[0]
        to_name = connection[1]
        
        from_id = block_id_map.get(from_name)
        to_id = block_id_map.get(to_name)
        
        if from_id and to_id:
            await db.connection.create(
                data={
                    "projectId": project_id,
                    "fromBlockId": from_id,
                    "toBlockId": to_id,
                    "connectionType": "dependency"
                }
            )
