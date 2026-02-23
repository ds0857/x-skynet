"""XSkynetClient — main entry point for the X-Skynet Python SDK."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .models import Agent, Mission, Proposal, ProposalStep

logger = logging.getLogger(__name__)

_DEFAULT_TIMEOUT = 30  # seconds
_DEFAULT_RETRIES = 3


class XSkynetError(Exception):
    """Base exception for all X-Skynet SDK errors."""


class XSkynetAPIError(XSkynetError):
    """Raised when the API returns a non-2xx status code.

    Attributes:
        status_code: HTTP status code returned by the server.
        response_body: Raw response text for debugging.
    """

    def __init__(self, status_code: int, response_body: str) -> None:
        self.status_code = status_code
        self.response_body = response_body
        super().__init__(f"API error {status_code}: {response_body[:200]}")


class XSkynetClient:
    """Synchronous client for the X-Skynet orchestration platform API.

    Args:
        base_url: Root URL of your X-Skynet deployment (no trailing slash).
        api_key: Bearer token / API key for authenticated endpoints.
        timeout: Request timeout in seconds (default 30).
        max_retries: Number of automatic retries on transient failures (default 3).

    Example::

        from xskynet import XSkynetClient

        client = XSkynetClient(
            base_url="https://dashboard-ruby-nine-30.vercel.app",
            api_key="your-api-key",
        )

        agents = client.list_agents()
        for agent in agents:
            print(agent.id, agent.status)
    """

    def __init__(
        self,
        base_url: str,
        api_key: str,
        timeout: int = _DEFAULT_TIMEOUT,
        max_retries: int = _DEFAULT_RETRIES,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

        self._session = requests.Session()
        self._session.headers.update(
            {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "xskynet-sdk-python/0.1.0",
            }
        )

        retry_strategy = Retry(
            total=max_retries,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self._session.mount("https://", adapter)
        self._session.mount("http://", adapter)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _url(self, path: str) -> str:
        return f"{self.base_url}/{path.lstrip('/')}"

    def _request(
        self,
        method: str,
        path: str,
        *,
        json: Optional[Any] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Any:
        url = self._url(path)
        logger.debug("%s %s", method.upper(), url)
        resp = self._session.request(
            method,
            url,
            json=json,
            params=params,
            timeout=self.timeout,
        )
        if not resp.ok:
            raise XSkynetAPIError(resp.status_code, resp.text)
        if resp.status_code == 204 or not resp.content:
            return None
        return resp.json()

    # ------------------------------------------------------------------
    # Agents
    # ------------------------------------------------------------------

    def list_agents(self) -> List[Agent]:
        """Return all registered agents visible to the caller.

        Returns:
            A list of :class:`~xskynet.models.Agent` objects.

        Example::

            agents = client.list_agents()
            healthy = [a for a in agents if a.status == "healthy"]
        """
        data = self._request("GET", "/api/ops/agents")
        raw_agents: List[Dict[str, Any]] = []

        # API may return {"agents": [...]} or a bare list
        if isinstance(data, dict):
            raw_agents = data.get("agents", data.get("data", []))
        elif isinstance(data, list):
            raw_agents = data

        return [Agent.from_dict(item) for item in raw_agents]

    def get_agent(self, agent_id: str) -> Agent:
        """Fetch a single agent by its ID.

        Args:
            agent_id: The agent's unique identifier (e.g. "scout").

        Returns:
            An :class:`~xskynet.models.Agent` object.
        """
        data = self._request("GET", f"/api/ops/agents/{agent_id}")
        if isinstance(data, dict) and "agent" in data:
            data = data["agent"]
        return Agent.from_dict(data)

    def send_heartbeat(self, agent_id: str, status: str = "healthy") -> Dict[str, Any]:
        """Send a heartbeat ping on behalf of an agent.

        Args:
            agent_id: The agent's unique identifier.
            status: Reported health status (default "healthy").

        Returns:
            Raw API response dict.
        """
        return self._request(
            "POST",
            f"/api/ops/agents/{agent_id}/heartbeat",
            json={"status": status},
        )

    # ------------------------------------------------------------------
    # Proposals
    # ------------------------------------------------------------------

    def create_proposal(
        self,
        title: str,
        description: str,
        proposed_by: str = "sdk",
        priority: str = "medium",
        steps: Optional[List[Union[Dict[str, Any], ProposalStep]]] = None,
    ) -> Proposal:
        """Create a new multi-step proposal.

        Args:
            title: Short title for the proposal.
            description: Detailed description of what needs to be done.
            proposed_by: Identifier of the creator (agent id or username).
            priority: One of "low", "medium", "high", "critical".
            steps: Ordered list of steps. Each step is either a
                :class:`~xskynet.models.ProposalStep` or a plain dict with
                keys ``title``, ``assigned_to``, and ``prompt``.

        Returns:
            The newly created :class:`~xskynet.models.Proposal`.

        Example::

            proposal = client.create_proposal(
                title="Research Competitors",
                description="Perform competitive analysis for Q2",
                proposed_by="nova",
                priority="high",
                steps=[
                    {"title": "Gather data", "assigned_to": "scout", "prompt": "Search for ..."},
                    {"title": "Write report", "assigned_to": "quill", "prompt": "Summarise ..."},
                ],
            )
            print(proposal.id, proposal.status)
        """
        serialised_steps: List[Dict[str, Any]] = []
        for step in steps or []:
            if isinstance(step, ProposalStep):
                serialised_steps.append(step.to_dict())
            else:
                serialised_steps.append(dict(step))

        payload: Dict[str, Any] = {
            "title": title,
            "description": description,
            "proposed_by": proposed_by,
            "priority": priority,
            "steps": serialised_steps,
        }
        data = self._request("POST", "/api/ops/proposals", json=payload)
        if isinstance(data, dict) and "proposal" in data:
            data = data["proposal"]
        return Proposal.from_dict(data)

    def list_proposals(
        self,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> List[Proposal]:
        """Retrieve a list of proposals.

        Args:
            status: Optional filter by status (e.g. "pending", "in_progress", "done").
            limit: Maximum number of results to return.

        Returns:
            A list of :class:`~xskynet.models.Proposal` objects.
        """
        params: Dict[str, Any] = {"limit": limit}
        if status:
            params["status"] = status
        data = self._request("GET", "/api/ops/proposals", params=params)
        raw: List[Dict[str, Any]] = []
        if isinstance(data, dict):
            raw = data.get("proposals", data.get("data", []))
        elif isinstance(data, list):
            raw = data
        return [Proposal.from_dict(item) for item in raw]

    def get_proposal(self, proposal_id: str) -> Proposal:
        """Fetch a single proposal by its UUID.

        Args:
            proposal_id: The proposal's unique identifier.

        Returns:
            A :class:`~xskynet.models.Proposal` object.
        """
        data = self._request("GET", f"/api/ops/proposals/{proposal_id}")
        if isinstance(data, dict) and "proposal" in data:
            data = data["proposal"]
        return Proposal.from_dict(data)

    # ------------------------------------------------------------------
    # Missions
    # ------------------------------------------------------------------

    def get_mission(self, mission_id: str) -> Mission:
        """Fetch a mission (high-level goal grouping proposals) by its ID.

        Args:
            mission_id: The mission's unique identifier.

        Returns:
            A :class:`~xskynet.models.Mission` object.

        Example::

            mission = client.get_mission("abc-123")
            print(mission.title, mission.status)
            for proposal in mission.proposals:
                print("  ->", proposal.title)
        """
        data = self._request("GET", f"/api/ops/missions/{mission_id}")
        if isinstance(data, dict) and "mission" in data:
            data = data["mission"]
        return Mission.from_dict(data)

    def list_missions(self, limit: int = 20) -> List[Mission]:
        """Retrieve a list of missions.

        Args:
            limit: Maximum number of results to return.

        Returns:
            A list of :class:`~xskynet.models.Mission` objects.
        """
        data = self._request("GET", "/api/ops/missions", params={"limit": limit})
        raw: List[Dict[str, Any]] = []
        if isinstance(data, dict):
            raw = data.get("missions", data.get("data", []))
        elif isinstance(data, list):
            raw = data
        return [Mission.from_dict(item) for item in raw]

    # ------------------------------------------------------------------
    # Dunder
    # ------------------------------------------------------------------

    def close(self) -> None:
        """Close the underlying HTTP session."""
        self._session.close()

    def __enter__(self) -> "XSkynetClient":
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()

    def __repr__(self) -> str:
        return f"XSkynetClient(base_url={self.base_url!r})"
