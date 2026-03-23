# CraftaStudio — agents/types_/context.py
"""
Shared Python type definitions for CraftaStudio agent service.

These mirror the TypeScript SharedContext interface defined in
shared/types/blocks.ts — keep both in sync.
"""

from typing import Literal
from pydantic import BaseModel, Field


class TechStack(BaseModel):
    """Technology choices for this project."""

    backend: str = Field(..., description="e.g. 'Fastify + TypeScript'")
    frontend: str = Field(..., description="e.g. 'Next.js 14 + React'")
    db: str = Field(..., description="e.g. 'PostgreSQL via Prisma'")
    auth: str = Field(..., description="e.g. 'Clerk'")


class Conventions(BaseModel):
    """Coding conventions shared across all generated code."""

    casing: Literal["camelCase", "snake_case"] = "camelCase"
    auth: str = Field(..., description="e.g. 'Clerk JWT middleware'")
    errors: str = Field(..., description="e.g. 'RFC 7807 Problem Detail'")
    responses: str = Field(..., description="e.g. '{ data, error, meta }'")


class EntityField(BaseModel):
    """Schema field for a data entity."""

    name: str
    type: Literal["uuid", "string", "int", "boolean", "datetime", "float"]
    primary: bool = False
    unique: bool = False
    nullable: bool = False


class EntityDefinition(BaseModel):
    """Definition of a single data entity (table / Prisma model)."""

    fields: list[EntityField]


class SharedContext(BaseModel):
    """
    Structured architectural context produced by the Planner agent.

    Broadcast to all parallel generator agents so they produce
    mutually consistent code that knows about each other's entities,
    routes, and conventions.
    """

    project: str = Field(..., description="Human-readable project name")
    entities: dict[str, EntityDefinition] = Field(
        default_factory=dict,
        description="All data entities keyed by entity name (PascalCase)",
    )
    api_routes: dict[str, str] = Field(
        default_factory=dict,
        description="API routes map: route path → description",
    )
    tech_stack: TechStack
    conventions: Conventions
