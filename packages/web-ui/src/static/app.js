/**
 * app.js — Frontend WebSocket client + DOM update logic.
 * Connects to ws://<host>/ws and processes real-time snapshots.
 */

(function () {
  'use strict';

  // ── WebSocket connection ──────────────────────────────────────────────────

  const wsDot   = document.getElementById('ws-dot');
  const wsLabel = document.getElementById('ws-label');
  const lastUpd = document.getElementById('last-update');

  let ws = null;
  let reconnectTimer = null;
  let reconnectDelay = 2000;

  function setConnected(connected) {
    if (wsDot)   { wsDot.classList.toggle('connected', connected); }
    if (wsLabel) { wsLabel.textContent = connected ? 'Live' : 'Disconnected'; }
  }

  function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const url   = `${proto}://${location.host}/ws`;

    try {
      ws = new WebSocket(url);
    } catch (e) {
      scheduleReconnect();
      return;
    }

    ws.addEventListener('open', () => {
      setConnected(true);
      reconnectDelay = 2000;
    });

    ws.addEventListener('message', (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === 'snapshot') renderSnapshot(data);
      } catch { /* ignore malformed frames */ }
    });

    ws.addEventListener('close', () => {
      setConnected(false);
      scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      ws.close();
    });
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 1.5, 30_000);
      connect();
    }, reconnectDelay);
  }

  // ── Polling fallback (REST) ───────────────────────────────────────────────
  // If WebSocket cannot be used (old browser), fall back to polling /api/*

  async function fetchAndRender() {
    try {
      const [agents, runs, tasks] = await Promise.all([
        fetch('/api/agents').then(r => r.json()),
        fetch('/api/runs').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json()),
      ]);
      renderSnapshot({ agents, runs, tasks, ts: new Date().toISOString() });
    } catch { /* network error, try again later */ }
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  function badge(status) {
    const cls = {
      success: 'badge-success',
      running: 'badge-running',
      failed:  'badge-failed',
      pending: 'badge-pending',
      done:    'badge-done',
      'in-progress': 'badge-in-progress',
      healthy:  'badge-success',
      degraded: 'badge-pending',
      offline:  'badge-failed',
    }[status] ?? 'badge-pending';
    return `<span class="badge ${cls}">${status}</span>`;
  }

  function renderAgents(agents) {
    const grid = document.getElementById('agent-grid');
    if (!grid || !Array.isArray(agents)) return;

    grid.innerHTML = agents.map(a => {
      const dotCls = {
        healthy: 'dot-healthy',
        degraded: 'dot-degraded',
        offline:  'dot-offline',
      }[a.status] ?? 'dot-offline';

      const ago = timeSince(a.lastHeartbeat);

      return `
        <div class="agent-card">
          <div class="agent-header">
            <div class="status-dot ${dotCls}"></div>
            <span>${escHtml(a.id)}</span>
          </div>
          ${badge(a.status)}
          <div class="agent-meta">Last heartbeat: ${ago}</div>
        </div>`;
    }).join('');
  }

  function renderRuns(runs) {
    const tbody = document.getElementById('runs-body');
    if (!tbody || !Array.isArray(runs)) return;

    tbody.innerHTML = runs.map(r => `
      <tr>
        <td style="font-family:monospace">${escHtml(r.id)}</td>
        <td>${badge(r.status)}</td>
        <td>${r.steps}</td>
        <td style="color:var(--muted)">${fmtDate(r.startedAt)}</td>
      </tr>`).join('');
  }

  function renderTasks(tasks) {
    const list = document.getElementById('task-list');
    if (!list || !Array.isArray(tasks)) return;

    list.innerHTML = tasks.map(t => `
      <div class="task-row">
        <div>
          <div class="task-title">${escHtml(t.title)}</div>
          <div class="task-assignee">${escHtml(t.id)} · ${escHtml(t.assignee)}</div>
        </div>
        ${badge(t.status)}
      </div>`).join('');
  }

  function renderSnapshot(data) {
    renderAgents(data.agents);
    renderRuns(data.runs);
    renderTasks(data.tasks);
    if (lastUpd) lastUpd.textContent = `Updated ${timeSince(data.ts)} ago`;
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function timeSince(iso) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)  return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  }

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  if ('WebSocket' in window) {
    connect();
  } else {
    // No WebSocket support → REST polling every 5 s
    fetchAndRender();
    setInterval(fetchAndRender, 5000);
  }

})();
