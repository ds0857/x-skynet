"""
xskynet — Python SDK for the X-Skynet multi-agent orchestration platform.

Quick start::

    from xskynet import XSkynetClient

    client = XSkynetClient(
        base_url="https://your-deployment.vercel.app",
        api_key="your-api-key",
    )

    # List all registered agents
    agents = client.list_agents()

    # Create a new proposal / task
    proposal = client.create_proposal(
        title="My Task",
        description="Do something useful",
        proposed_by="nova",
        steps=[{"title": "Step 1", "assigned_to": "scout", "prompt": "Research X"}],
    )

    # Fetch a mission by ID
    mission = client.get_mission("mission-id")
"""

from .client import XSkynetClient
from .models import Agent, Mission, Proposal, ProposalStep

__all__ = [
    "XSkynetClient",
    "Agent",
    "Mission",
    "Proposal",
    "ProposalStep",
]

__version__ = "0.1.0"
__author__ = "X-Skynet Project"
