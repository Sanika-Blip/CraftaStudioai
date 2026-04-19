from typing import Dict, Any
from agents.types_.context import TechStack, Conventions, EntityDefinition, EntityField

def parse_planner_output(raw_data: Dict[str, Any]):
    """
    Strictly parses raw LLM dictionary into Pydantic models.
    Provides fallbacks to prevent pipeline crashes.
    """
    
    # 1. Parse Tech Stack
    tech_data = raw_data.get("tech_stack", {})
    tech_stack = TechStack(
        backend=tech_data.get("backend", "Not Specified"),
        frontend=tech_data.get("frontend", "Not Specified"),
        db=tech_data.get("db", "Not Specified"),
        auth=tech_data.get("auth", "Not Specified")
    )

    # 2. Parse Conventions
    conv_data = raw_data.get("conventions", {})
    conventions = Conventions(
        casing=conv_data.get("casing", "camelCase"),
        auth=conv_data.get("auth", "Standard Middleware"),
        errors=conv_data.get("errors", "Standard JSON"),
        responses=conv_data.get("responses", "Standard Wrapper")
    )

    # 3. Parse Entities
    entities = {}
    raw_entities = raw_data.get("entities", {})
    
    for entity_name, entity_body in raw_entities.items():
        fields = []
        for f in entity_body.get("fields", []):
            fields.append(EntityField(
                name=f.get("name"),
                type=f.get("type", "string"),
                primary=f.get("primary", False),
                unique=f.get("unique", False),
                nullable=f.get("nullable", False)
            ))
        entities[entity_name] = EntityDefinition(fields=fields)

    return {
        "tech_stack": tech_stack,
        "conventions": conventions,
        "entities": entities
    }