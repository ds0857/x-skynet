"""Unit tests for XSkynetClient using mocked HTTP responses."""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from xskynet import XSkynetClient
from xskynet.client import XSkynetAPIError
from xskynet.models import Agent, Mission, Proposal, ProposalStep


BASE_URL = "https://test.x-skynet.ai"
API_KEY = "test-api-key-12345"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def client() -> XSkynetClient:
    """Return a fresh XSkynetClient with retries disabled to speed up tests."""
    return XSkynetClient(base_url=BASE_URL, api_key=API_KEY, max_retries=0)


def _mock_response(json_data: object, status_code: int = 200) -> MagicMock:
    """Create a mock requests.Response."""
    mock = MagicMock()
    mock.ok = 200 <= status_code < 300
    mock.status_code = status_code
    mock.content = json.dumps(json_data).encode()
    mock.text = json.dumps(json_data)
    mock.json.return_value = json_data
    return mock


# ---------------------------------------------------------------------------
# Model tests
# ---------------------------------------------------------------------------


class TestAgentModel:
    def test_from_dict_basic(self):
        data = {"id": "scout", "name": "Scout", "status": "healthy", "role": "Researcher"}
        agent = Agent.from_dict(data)
        assert agent.id == "scout"
        assert agent.name == "Scout"
        assert agent.status == "healthy"
        assert agent.role == "Researcher"
        assert agent.last_heartbeat is None

    def test_from_dict_camel_case_heartbeat(self):
        data = {"id": "minion", "name": "Minion", "status": "idle", "lastHeartbeat": "2026-02-23T00:00:00Z"}
        agent = Agent.from_dict(data)
        assert agent.last_heartbeat == "2026-02-23T00:00:00Z"

    def test_from_dict_minimal(self):
        agent = Agent.from_dict({"id": "x"})
        assert agent.id == "x"
        assert agent.name == "x"
        assert agent.status == "unknown"


class TestProposalStepModel:
    def test_to_dict(self):
        step = ProposalStep(title="Step 1", assigned_to="scout", prompt="Do thing")
        d = step.to_dict()
        assert d == {"title": "Step 1", "assigned_to": "scout", "prompt": "Do thing"}

    def test_from_dict(self):
        data = {"title": "Step A", "assigned_to": "quill", "prompt": "Write it", "status": "done", "result": "OK"}
        step = ProposalStep.from_dict(data)
        assert step.status == "done"
        assert step.result == "OK"

    def test_from_dict_camel_assigned_to(self):
        data = {"title": "T", "assignedTo": "sage", "prompt": "P"}
        step = ProposalStep.from_dict(data)
        assert step.assigned_to == "sage"


class TestProposalModel:
    def test_from_dict(self):
        data = {
            "id": "prop-001",
            "title": "Test Proposal",
            "description": "Desc",
            "proposed_by": "nova",
            "priority": "high",
            "status": "pending",
            "steps": [{"title": "S1", "assigned_to": "scout", "prompt": "Do X"}],
        }
        proposal = Proposal.from_dict(data)
        assert proposal.id == "prop-001"
        assert len(proposal.steps) == 1
        assert proposal.steps[0].assigned_to == "scout"

    def test_from_dict_camel_case(self):
        data = {
            "id": "p2",
            "title": "T",
            "description": "D",
            "proposedBy": "nova",
            "createdAt": "2026-01-01T00:00:00Z",
        }
        proposal = Proposal.from_dict(data)
        assert proposal.proposed_by == "nova"
        assert proposal.created_at == "2026-01-01T00:00:00Z"


class TestMissionModel:
    def test_from_dict(self):
        data = {
            "id": "mission-42",
            "title": "World Domination",
            "description": "Step by step",
            "status": "active",
            "proposals": [],
        }
        mission = Mission.from_dict(data)
        assert mission.id == "mission-42"
        assert mission.proposals == []


# ---------------------------------------------------------------------------
# Client initialisation tests
# ---------------------------------------------------------------------------


class TestClientInit:
    def test_base_url_trailing_slash_stripped(self):
        c = XSkynetClient(base_url="https://example.com/", api_key="k")
        assert c.base_url == "https://example.com"
        c.close()

    def test_repr(self):
        c = XSkynetClient(base_url=BASE_URL, api_key=API_KEY)
        assert BASE_URL in repr(c)
        c.close()

    def test_context_manager(self):
        with XSkynetClient(base_url=BASE_URL, api_key=API_KEY) as c:
            assert c.base_url == BASE_URL


# ---------------------------------------------------------------------------
# list_agents
# ---------------------------------------------------------------------------


class TestListAgents:
    def test_list_agents_dict_wrapper(self, client):
        payload = {
            "agents": [
                {"id": "scout", "name": "Scout", "status": "healthy"},
                {"id": "minion", "name": "Minion", "status": "idle"},
            ]
        }
        with patch.object(client._session, "request", return_value=_mock_response(payload)):
            agents = client.list_agents()
        assert len(agents) == 2
        assert agents[0].id == "scout"
        assert agents[1].status == "idle"

    def test_list_agents_bare_list(self, client):
        payload = [{"id": "sage", "name": "Sage", "status": "healthy"}]
        with patch.object(client._session, "request", return_value=_mock_response(payload)):
            agents = client.list_agents()
        assert len(agents) == 1

    def test_list_agents_api_error(self, client):
        with patch.object(client._session, "request", return_value=_mock_response({"error": "Forbidden"}, 403)):
            with pytest.raises(XSkynetAPIError) as exc_info:
                client.list_agents()
        assert exc_info.value.status_code == 403


# ---------------------------------------------------------------------------
# create_proposal
# ---------------------------------------------------------------------------


class TestCreateProposal:
    _RESPONSE = {
        "proposal": {
            "id": "prop-new",
            "title": "My Task",
            "description": "Details",
            "proposed_by": "nova",
            "priority": "medium",
            "status": "pending",
            "steps": [{"title": "S1", "assigned_to": "scout", "prompt": "Go"}],
        }
    }

    def test_create_proposal_dict_steps(self, client):
        with patch.object(client._session, "request", return_value=_mock_response(self._RESPONSE)) as mock_req:
            proposal = client.create_proposal(
                title="My Task",
                description="Details",
                proposed_by="nova",
                steps=[{"title": "S1", "assigned_to": "scout", "prompt": "Go"}],
            )
        assert proposal.id == "prop-new"
        assert proposal.steps[0].assigned_to == "scout"
        # Verify the request payload
        _, kwargs = mock_req.call_args
        sent = kwargs["json"]
        assert sent["title"] == "My Task"
        assert sent["proposed_by"] == "nova"
        assert len(sent["steps"]) == 1

    def test_create_proposal_model_steps(self, client):
        step = ProposalStep(title="S1", assigned_to="quill", prompt="Write")
        with patch.object(client._session, "request", return_value=_mock_response(self._RESPONSE)):
            proposal = client.create_proposal(
                title="My Task",
                description="Details",
                steps=[step],
            )
        assert proposal.id == "prop-new"

    def test_create_proposal_no_steps(self, client):
        with patch.object(client._session, "request", return_value=_mock_response(self._RESPONSE)) as mock_req:
            client.create_proposal(title="T", description="D")
        _, kwargs = mock_req.call_args
        assert kwargs["json"]["steps"] == []


# ---------------------------------------------------------------------------
# get_mission
# ---------------------------------------------------------------------------


class TestGetMission:
    def test_get_mission(self, client):
        payload = {
            "mission": {
                "id": "m-007",
                "title": "Alpha",
                "description": "Secret mission",
                "status": "active",
                "proposals": [],
            }
        }
        with patch.object(client._session, "request", return_value=_mock_response(payload)):
            mission = client.get_mission("m-007")
        assert mission.id == "m-007"
        assert mission.title == "Alpha"

    def test_get_mission_not_found(self, client):
        with patch.object(client._session, "request", return_value=_mock_response({"error": "Not found"}, 404)):
            with pytest.raises(XSkynetAPIError) as exc_info:
                client.get_mission("nonexistent")
        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# send_heartbeat
# ---------------------------------------------------------------------------


class TestSendHeartbeat:
    def test_heartbeat(self, client):
        payload = {"ok": True, "agent_id": "minion"}
        with patch.object(client._session, "request", return_value=_mock_response(payload)) as mock_req:
            result = client.send_heartbeat("minion")
        assert result["ok"] is True
        _, kwargs = mock_req.call_args
        assert kwargs["json"] == {"status": "healthy"}

    def test_heartbeat_custom_status(self, client):
        payload = {"ok": True}
        with patch.object(client._session, "request", return_value=_mock_response(payload)) as mock_req:
            client.send_heartbeat("scout", status="idle")
        _, kwargs = mock_req.call_args
        assert kwargs["json"]["status"] == "idle"
