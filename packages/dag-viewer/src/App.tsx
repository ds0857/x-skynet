/**
 * App.tsx — X-Skynet DAG Run Viewer
 *
 * Displays multiple mission DAGs side-by-side using mock data.
 * In production, replace `allMissions` with data fetched from Supabase:
 *
 *   const { data } = await supabase.from('missions').select('*, steps(*)')
 */

import React, { useState } from 'react';
import DagViewer from './DagViewer';
import { allMissions } from './mockData';
import type { Mission } from './types';
import './app.css';

// ── Status badge ─────────────────────────────────────────────────────────────

function missionStatus(mission: Mission): { label: string; color: string } {
  const statuses = mission.steps.map((s) => s.status);
  if (statuses.some((s) => s === 'failed'))   return { label: 'FAILED',     color: '#ef4444' };
  if (statuses.some((s) => s === 'running'))  return { label: 'RUNNING',    color: '#3b82f6' };
  if (statuses.every((s) => s === 'succeeded')) return { label: 'DONE',     color: '#22c55e' };
  return { label: 'QUEUED', color: '#94a3b8' };
}

// ── Component ─────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [selected, setSelected] = useState<string>(allMissions[0].id);
  const mission = allMissions.find((m) => m.id === selected) ?? allMissions[0];

  return (
    <div className="app-root">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-header-brand">
          <span className="app-logo">✦</span>
          <span>X-Skynet</span>
          <span className="app-header-sub">DAG Run Viewer</span>
        </div>
        <span className="app-version">v0.1.0 · P2-07</span>
      </header>

      <div className="app-body">
        {/* ── Sidebar — mission list ── */}
        <aside className="app-sidebar">
          <p className="sidebar-label">Missions</p>
          <ul className="mission-list">
            {allMissions.map((m) => {
              const badge = missionStatus(m);
              return (
                <li
                  key={m.id}
                  className={`mission-item ${m.id === selected ? 'mission-item--active' : ''}`}
                  onClick={() => setSelected(m.id)}
                >
                  <span className="mission-item-title">{m.title}</span>
                  <span
                    className="mission-item-badge"
                    style={{ color: badge.color, borderColor: badge.color }}
                  >
                    {badge.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ── Main — DAG diagram ── */}
        <main className="app-main">
          <div className="mission-meta">
            <h2 className="mission-title">{mission.title}</h2>
            <div className="mission-info">
              <span>Proposed by <strong>{mission.proposed_by}</strong></span>
              <span>·</span>
              <span>{new Date(mission.created_at).toLocaleString()}</span>
              <span>·</span>
              <span>{mission.steps.length} step{mission.steps.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <DagViewer steps={mission.steps} title={`DAG: ${mission.title}`} />

          {/* ── Step table ── */}
          <div className="step-table-wrapper">
            <table className="step-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Assigned to</th>
                  <th>Status</th>
                  <th>Depends on</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {mission.steps.map((step) => (
                  <tr key={step.id} className={`step-row step-row--${step.status}`}>
                    <td className="step-id">{step.id}</td>
                    <td>{step.title}</td>
                    <td>{step.assigned_to}</td>
                    <td>
                      <span className={`status-chip status-chip--${step.status}`}>
                        {step.status}
                      </span>
                    </td>
                    <td className="step-deps">
                      {step.depends_on.length === 0
                        ? <span className="step-dep-none">—</span>
                        : step.depends_on.join(', ')}
                    </td>
                    <td className="step-result">{step.result ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
