import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { projectsAPI, tasksAPI } from '../api/client.js';

const statusColors = {
  todo: 'var(--status-todo)',
  'in-progress': 'var(--status-inprogress)',
  review: 'var(--status-review)',
  done: 'var(--status-done)',
};

const priorityColors = {
  low: 'var(--priority-low)',
  medium: 'var(--priority-medium)',
  high: 'var(--priority-high)',
  critical: 'var(--priority-critical)',
};

const priorityDot = (p) => (
  <span style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColors[p], display: 'inline-block', flexShrink: 0 }} />
);

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [taskSummary, setTaskSummary] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, summaryRes] = await Promise.all([
          projectsAPI.getAll(),
          tasksAPI.getSummary(),
        ]);
        setProjects(projRes.data.projects.slice(0, 4));
        setTaskSummary(summaryRes.data);
        setRecentTasks(summaryRes.data.recentTasks || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusCount = (status) =>
    taskSummary?.statusStats?.find((s) => s._id === status)?.count || 0;

  const totalTasks = taskSummary?.statusStats?.reduce((a, s) => a + s.count, 0) || 0;
  const totalProjects = projects.length;
  const doneCount = getStatusCount('done');
  const inProgressCount = getStatusCount('in-progress');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-center">
          <div className="loading-spinner" />
          <span>Loading your workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 className="page-title" style={{ fontSize: '2rem' }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="page-subtitle">Here's what's happening across your workspace today.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-icon accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
          </div>
          <div>
            <div className="stat-value">{totalProjects}</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-icon emerald">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <div>
            <div className="stat-value">{doneCount}</div>
            <div className="stat-label">Tasks Completed</div>
          </div>
        </div>

        <div className="stat-card amber">
          <div className="stat-icon amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div className="stat-value">{inProgressCount}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div className="stat-card rose">
          <div className="stat-icon sky">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </div>
          <div>
            <div className="stat-value">{totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>
      </div>

      {/* Body Grid: Recent Projects + Recent Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>

        {/* Recent Projects */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Projects</h2>
            <Link to="/projects" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
              </div>
              <p className="empty-state-title">No projects yet</p>
              <p className="empty-state-text">Create your first project to get started.</p>
              <Link to="/projects" className="btn btn-primary btn-sm">New Project</Link>
            </div>
          ) : (
            <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
              {projects.map((proj) => {
                const done = proj.taskCounts?.done || 0;
                const total = proj.taskCounts?.total || 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={proj._id} style={{ padding: 'var(--space-4) var(--space-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: proj.color || 'var(--color-accent)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.name}</div>
                      <div className="progress-bar" style={{ margin: 0, marginTop: 4 }}>
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{done}/{total} done</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Tasks</h2>
            <Link to="/tasks" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              <p className="empty-state-title">No tasks yet</p>
              <p className="empty-state-text">Tasks from your projects will appear here.</p>
              <Link to="/tasks" className="btn btn-primary btn-sm">Create Task</Link>
            </div>
          ) : (
            <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
              {recentTasks.map((task) => (
                <div key={task._id} style={{ padding: 'var(--space-3) var(--space-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  {priorityDot(task.priority)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                    {task.project && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{task.project.name}</div>
                    )}
                  </div>
                  <span
                    className={`badge badge-${task.status === 'in-progress' ? 'inprogress' : task.status}`}
                    style={{ flexShrink: 0 }}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status breakdown */}
      {totalTasks > 0 && (
        <div className="card" style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-8)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>Task Status Breakdown</div>
            <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
              {[
                { key: 'todo', label: 'To Do', color: 'var(--status-todo)' },
                { key: 'in-progress', label: 'In Progress', color: 'var(--status-inprogress)' },
                { key: 'review', label: 'Review', color: 'var(--status-review)' },
                { key: 'done', label: 'Done', color: 'var(--status-done)' },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{label}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color }}>{getStatusCount(key)}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Visual bar */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', height: 12, borderRadius: 'var(--radius-full)', overflow: 'hidden', gap: 2 }}>
              {[
                { key: 'todo', color: 'var(--status-todo)' },
                { key: 'in-progress', color: 'var(--status-inprogress)' },
                { key: 'review', color: 'var(--status-review)' },
                { key: 'done', color: 'var(--status-done)' },
              ].map(({ key, color }) => {
                const cnt = getStatusCount(key);
                const pct = totalTasks > 0 ? (cnt / totalTasks) * 100 : 0;
                return pct > 0 ? (
                  <div key={key} style={{ width: `${pct}%`, background: color, transition: 'width 0.5s ease' }} />
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
