import { useState, useEffect, useCallback } from 'react';
import { tasksAPI, projectsAPI } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

const STATUS_OPTIONS = ['todo', 'in-progress', 'review', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

const statusLabel = (s) => ({ todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' }[s] || s);
const priorityLabel = (p) => ({ low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }[p] || p);

const statusBadge = (s) => {
  const cls = { todo: 'badge-todo', 'in-progress': 'badge-inprogress', review: 'badge-review', done: 'badge-done' };
  return <span className={`badge ${cls[s]}`}>{statusLabel(s)}</span>;
};

const priorityBadge = (p) => {
  const cls = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high', critical: 'badge-critical' };
  return <span className={`badge ${cls[p]}`}>{priorityLabel(p)}</span>;
};

function TaskModal({ task, projects, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    project: task?.project?._id || task?.project || (projects[0]?._id || ''),
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 2) e.title = 'Title must be at least 2 characters';
    if (!form.project) e.project = 'Please select a project';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSave({ ...form, dueDate: form.dueDate || null });
      onClose();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        setErrors({ general: serverErrors.map((e) => e.msg).join(', ') });
      } else {
        setErrors({ general: err.response?.data?.error || 'Something went wrong' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.general && (
              <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 'var(--radius-md)', color: 'var(--color-rose)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="task-title">Task Title *</label>
              <input id="task-title" className={`form-input ${errors.title ? 'error' : ''}`} value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What needs to be done?" />
              {errors.title && <p className="form-error">{errors.title}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-desc">Description</label>
              <textarea id="task-desc" className="form-textarea" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Add more details..." rows={3} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="task-project">Project *</label>
                <select id="task-project" className={`form-select ${errors.project ? 'error' : ''}`} value={form.project}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}>
                  <option value="">Select project...</option>
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                {errors.project && <p className="form-error">{errors.project}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-status">Status</label>
                <select id="task-status" className="form-select" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-priority">Priority</label>
                <select id="task-priority" className="form-select" value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{priorityLabel(p)}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-due">Due Date</label>
                <input id="task-due" type="date" className="form-input" value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  style={{ colorScheme: 'dark' }} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</> : (task ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [view, setView] = useState('list'); // 'list' | 'board'
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, projsRes] = await Promise.all([
        tasksAPI.getAll(),
        projectsAPI.getAll(),
      ]);
      setTasks(tasksRes.data.tasks);
      setProjects(projsRes.data.projects);
    } catch {
      addToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (form) => {
    await tasksAPI.create(form);
    addToast('Task created!', 'success');
    fetchData();
  };

  const handleEdit = async (form) => {
    await tasksAPI.update(editing._id, form);
    addToast('Task updated!', 'success');
    fetchData();
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    await tasksAPI.delete(task._id);
    addToast('Task deleted.', 'info');
    fetchData();
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await tasksAPI.update(task._id, { status: newStatus });
      setTasks((prev) => prev.map((t) => t._id === task._id ? { ...t, status: newStatus } : t));
      addToast(`Moved to ${statusLabel(newStatus)}`, 'success');
    } catch {
      addToast('Failed to update status', 'error');
    }
  };

  const filtered = tasks.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterProject !== 'all' && t.project?._id !== filterProject) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const boardColumns = STATUS_OPTIONS.map((s) => ({
    status: s,
    tasks: filtered.filter((t) => t.status === s),
  }));

  const columnColors = {
    todo: 'var(--status-todo)',
    'in-progress': 'var(--status-inprogress)',
    review: 'var(--status-review)',
    done: 'var(--status-done)',
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{filtered.length} task{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button
              className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 0 }}
              onClick={() => setView('list')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              List
            </button>
            <button
              className={`btn btn-sm ${view === 'board' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 0 }}
              onClick={() => setView('board')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="18" rx="1" />
              </svg>
              Board
            </button>
          </div>

          <button id="new-task-btn" className="btn btn-primary" onClick={() => setShowCreate(true)} disabled={projects.length === 0}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Task
          </button>
        </div>
      </div>

      {projects.length === 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-md)', color: 'var(--color-amber)', fontSize: '0.875rem', marginBottom: 'var(--space-5)' }}>
          You need to create a project first before adding tasks.
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input id="task-search" className="search-input" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>

        <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="all">All Priority</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{priorityLabel(p)}</option>)}
        </select>

        <select className="form-select" style={{ width: 'auto', minWidth: 150 }} value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
          <option value="all">All Projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-center"><div className="loading-spinner" /><span>Loading tasks...</span></div>
      ) : filtered.length === 0 && tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="empty-state-title">No tasks yet</p>
          <p className="empty-state-text">Create your first task to start tracking work.</p>
          {projects.length > 0 && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create First Task</button>
          )}
        </div>
      ) : view === 'list' ? (
        /* ─── List View ──────────────────────────── */
        <div className="tasks-list">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
              No tasks match your filters.
            </div>
          ) : filtered.map((task) => (
            <div key={task._id} className="task-card">
              <div className="task-card-header">
                {/* Status quick toggle */}
                <button
                  title="Toggle done"
                  onClick={() => handleStatusChange(task, task.status === 'done' ? 'todo' : 'done')}
                  style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${task.status === 'done' ? 'var(--color-emerald)' : 'var(--color-surface-3)'}`,
                    background: task.status === 'done' ? 'var(--color-emerald)' : 'transparent',
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all var(--transition-fast)', cursor: 'pointer',
                  }}
                >
                  {task.status === 'done' && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <span className={`task-title ${task.status === 'done' ? 'done' : ''}`}>{task.title}</span>

                <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                  {statusBadge(task.status)}
                  {priorityBadge(task.priority)}
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
                  <button className="btn btn-icon btn-ghost btn-sm" title="Edit" onClick={() => setEditing(task)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="14" height="14">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button className="btn btn-icon btn-ghost btn-sm" title="Delete" style={{ color: 'var(--color-rose)' }} onClick={() => handleDelete(task)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="14" height="14">
                      <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {task.description && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', paddingLeft: '2rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {task.description}
                </p>
              )}

              <div className="task-card-footer" style={{ paddingLeft: '2rem' }}>
                {task.project && (
                  <span className="task-project-chip">
                    <span className="task-project-dot" style={{ background: task.project.color || 'var(--color-accent)' }} />
                    {task.project.name}
                  </span>
                )}
                {task.dueDate && (
                  <span style={{ fontSize: '0.75rem', color: new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'var(--color-rose)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ─── Board View ─────────────────────────── */
        <div className="board-grid">
          {boardColumns.map(({ status, tasks: colTasks }) => (
            <div key={status} className="board-column">
              <div className="board-column-header">
                <div className="board-column-title">
                  <span className="column-dot" style={{ background: columnColors[status] }} />
                  {statusLabel(status)}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>{colTasks.length}</span>
              </div>
              <div className="board-column-body">
                {colTasks.map((task) => (
                  <div key={task._id} className="task-card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 'var(--space-2)', lineHeight: 1.4 }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                      {priorityBadge(task.priority)}
                      {task.project && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          <span style={{ width: 6, height: 6, background: task.project.color || 'var(--color-accent)', borderRadius: '50%', display: 'inline-block', marginRight: 4 }} />
                          {task.project.name}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setEditing(task)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="13" height="13">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button className="btn btn-icon btn-ghost btn-sm" style={{ color: 'var(--color-rose)' }} onClick={() => handleDelete(task)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="13" height="13">
                          <polyline points="3 6 5 6 21 6" strokeLinecap="round" /><path d="M19 6l-1 14H6L5 6" strokeLinecap="round" /><path d="M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--color-text-subtle)', fontSize: '0.8rem' }}>
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <TaskModal projects={projects} onClose={() => setShowCreate(false)} onSave={handleCreate} />}
      {editing && <TaskModal task={editing} projects={projects} onClose={() => setEditing(null)} onSave={handleEdit} />}
    </div>
  );
}
