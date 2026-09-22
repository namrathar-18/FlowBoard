import { useState, useEffect, useCallback } from 'react';
import { projectsAPI } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#10b981', '#14b8a6',
  '#0ea5e9', '#3b82f6',
];

const statusLabel = (s) => ({ active: 'Active', 'on-hold': 'On Hold', completed: 'Completed', archived: 'Archived' }[s] || s);

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    color: project?.color || '#6366f1',
    status: project?.status || 'active',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.error || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{project ? 'Edit Project' : 'New Project'}</h2>
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
              <label className="form-label" htmlFor="proj-name">Project Name *</label>
              <input id="proj-name" className={`form-input ${errors.name ? 'error' : ''}`} value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Marketing Campaign Q4" />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="proj-desc">Description</label>
              <textarea id="proj-desc" className="form-textarea" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What is this project about?" rows={3} />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Project Color</label>
              <div className="color-picker">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</> : (project ? 'Save Changes' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ project, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2 className="modal-title">Delete Project</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Are you sure you want to delete <strong style={{ color: 'var(--color-text)' }}>"{project.name}"</strong>?
            This will also delete all tasks in this project. <strong style={{ color: 'var(--color-rose)' }}>This action cannot be undone.</strong>
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" disabled={loading} onClick={async () => {
            setLoading(true);
            try { await onConfirm(); onClose(); } finally { setLoading(false); }
          }}>
            {loading ? <><div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Deleting...</> : 'Delete Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await projectsAPI.getAll();
      setProjects(res.data.projects);
    } catch {
      addToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreate = async (form) => {
    await projectsAPI.create(form);
    addToast('Project created successfully!', 'success');
    fetchProjects();
  };

  const handleEdit = async (form) => {
    await projectsAPI.update(editing._id, form);
    addToast('Project updated!', 'success');
    fetchProjects();
  };

  const handleDelete = async () => {
    await projectsAPI.delete(deleting._id);
    addToast('Project deleted.', 'info');
    fetchProjects();
  };

  const filtered = projects.filter((p) => {
    const matchStatus = filter === 'all' || p.status === filter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        <button id="new-project-btn" className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input id="project-search" className="search-input" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {['all', 'active', 'on-hold', 'completed', 'archived'].map((s) => (
          <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : statusLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="loading-spinner" /><span>Loading projects...</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
          </div>
          <p className="empty-state-title">{search || filter !== 'all' ? 'No matching projects' : 'No projects yet'}</p>
          <p className="empty-state-text">
            {search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Create your first project to start organizing your work.'}
          </p>
          {!search && filter === 'all' && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create First Project</button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map((proj) => {
            const done = proj.taskCounts?.done || 0;
            const total = proj.taskCounts?.total || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div key={proj._id} className="project-card">
                <div className="project-card-accent" style={{ background: proj.color || 'var(--color-accent)' }} />
                <div className="project-card-body">
                  <div className="project-card-header">
                    <div>
                      <h3 className="project-name">{proj.name}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button
                        className="btn btn-icon btn-ghost btn-sm"
                        title="Edit project"
                        onClick={() => setEditing(proj)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="15" height="15">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        className="btn btn-icon btn-ghost btn-sm"
                        title="Delete project"
                        onClick={() => setDeleting(proj)}
                        style={{ color: 'var(--color-rose)' }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="15" height="15">
                          <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {proj.description && (
                    <p className="project-description">{proj.description}</p>
                  )}

                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: proj.color || 'var(--color-accent)' }} />
                  </div>

                  <div className="project-card-footer">
                    <div className="project-stat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="project-stat-number">{total}</span>
                      <span>tasks</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span className={`badge badge-${proj.status}`}>{statusLabel(proj.status)}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{pct}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <ProjectModal onClose={() => setShowCreate(false)} onSave={handleCreate} />}
      {editing && <ProjectModal project={editing} onClose={() => setEditing(null)} onSave={handleEdit} />}
      {deleting && <DeleteModal project={deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />}
    </div>
  );
}
