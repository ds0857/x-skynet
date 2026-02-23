"""Data models for X-Skynet SDK responses."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class Agent:
    """Represents a registered X-Skynet agent.

    Attributes:
        id: Unique agent identifier (e.g. "scout", "minion").
        name: Human-readable display name.
        status: Current agent status ("healthy", "idle", "busy", "offline").
        role: Agent role / specialty description.
        model: Underlying LLM model name.
        last_heartbeat: ISO-8601 timestamp of the last heartbeat, or None.
        metadata: Any additional provider-specific fields.
    """

    id: str
    name: str
    status: str
    role: str = ""
    model: str = ""
    last_heartbeat: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Agent":
        """Deserialize an Agent from a raw API response dict."""
        return cls(
            id=data["id"],
            name=data.get("name", data["id"]),
            status=data.get("status", "unknown"),
            role=data.get("role", ""),
            model=data.get("model", ""),
            last_heartbeat=data.get("last_heartbeat") or data.get("lastHeartbeat"),
            metadata={
                k: v
                for k, v in data.items()
                if k not in {"id", "name", "status", "role", "model", "last_heartbeat", "lastHeartbeat"}
            },
        )


@dataclass
class ProposalStep:
    """A single step within a Proposal.

    Attributes:
        title: Short step label.
        assigned_to: Agent ID responsible for this step.
        prompt: Instruction / prompt passed to the agent.
        status: Step lifecycle status.
        result: Output produced by the agent once complete.
    """

    title: str
    assigned_to: str
    prompt: str
    status: str = "pending"
    result: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dict for API requests."""
        return {
            "title": self.title,
            "assigned_to": self.assigned_to,
            "prompt": self.prompt,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ProposalStep":
        """Deserialize a ProposalStep from an API response dict."""
        return cls(
            title=data.get("title", ""),
            assigned_to=data.get("assigned_to", data.get("assignedTo", "")),
            prompt=data.get("prompt", ""),
            status=data.get("status", "pending"),
            result=data.get("result"),
        )


@dataclass
class Proposal:
    """Represents an X-Skynet proposal (orchestrated multi-step task).

    Attributes:
        id: Server-assigned proposal UUID.
        title: Short title describing the task.
        description: Full description of the proposal.
        proposed_by: Agent or user who created the proposal.
        priority: "low" | "medium" | "high" | "critical".
        status: Proposal lifecycle status.
        steps: Ordered list of :class:`ProposalStep`.
        created_at: ISO-8601 creation timestamp.
        updated_at: ISO-8601 last-update timestamp.
        metadata: Any additional provider-specific fields.
    """

    id: str
    title: str
    description: str
    proposed_by: str
    priority: str = "medium"
    status: str = "pending"
    steps: List[ProposalStep] = field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Proposal":
        """Deserialize a Proposal from an API response dict."""
        raw_steps = data.get("steps") or []
        steps = [ProposalStep.from_dict(s) for s in raw_steps]
        return cls(
            id=data.get("id", ""),
            title=data.get("title", ""),
            description=data.get("description", ""),
            proposed_by=data.get("proposed_by", data.get("proposedBy", "")),
            priority=data.get("priority", "medium"),
            status=data.get("status", "pending"),
            steps=steps,
            created_at=data.get("created_at") or data.get("createdAt"),
            updated_at=data.get("updated_at") or data.get("updatedAt"),
            metadata={
                k: v
                for k, v in data.items()
                if k
                not in {
                    "id", "title", "description", "proposed_by", "proposedBy",
                    "priority", "status", "steps", "created_at", "createdAt",
                    "updated_at", "updatedAt",
                }
            },
        )


@dataclass
class Mission:
    """Represents a high-level X-Skynet mission (collection of proposals).

    Attributes:
        id: Server-assigned mission UUID.
        title: Short mission title.
        description: Detailed mission description.
        status: Mission lifecycle status.
        proposals: Related :class:`Proposal` objects, if expanded.
        created_at: ISO-8601 creation timestamp.
        metadata: Any additional provider-specific fields.
    """

    id: str
    title: str
    description: str = ""
    status: str = "active"
    proposals: List[Proposal] = field(default_factory=list)
    created_at: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Mission":
        """Deserialize a Mission from an API response dict."""
        raw_proposals = data.get("proposals") or []
        proposals = [Proposal.from_dict(p) for p in raw_proposals]
        return cls(
            id=data.get("id", ""),
            title=data.get("title", ""),
            description=data.get("description", ""),
            status=data.get("status", "active"),
            proposals=proposals,
            created_at=data.get("created_at") or data.get("createdAt"),
            metadata={
                k: v
                for k, v in data.items()
                if k
                not in {
                    "id", "title", "description", "status", "proposals",
                    "created_at", "createdAt",
                }
            },
        )
