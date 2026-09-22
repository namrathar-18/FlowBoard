const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes protected
router.use(protect);

// ─── GET /api/projects ─────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    // Attach task counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskStats = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const counts = { total: 0, todo: 0, 'in-progress': 0, review: 0, done: 0 };
        taskStats.forEach(({ _id, count }) => {
          counts[_id] = count;
          counts.total += count;
        });

        return { ...project.toJSON(), taskCounts: counts };
      })
    );

    res.json({ projects: projectsWithCounts });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/projects ────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    body('status').optional().isIn(['active', 'on-hold', 'completed', 'archived']),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { name, description, color, status, dueDate } = req.body;
      const project = await Project.create({
        name,
        description,
        color,
        status,
        dueDate,
        owner: req.user._id,
      });

      await project.populate('owner', 'name email');
      res.status(201).json({ message: 'Project created', project });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/projects/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).populate('owner', 'name email');

    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/projects/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });

    const allowed = ['name', 'description', 'color', 'status', 'dueDate'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) project[field] = req.body[field];
    });

    await project.save();
    res.json({ message: 'Project updated', project });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/projects/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });

    // Cascade delete tasks
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: 'Project and all associated tasks deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/projects/:id/stats ──────────────────────────────────────────────
router.get('/:id/stats', async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const stats = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    res.json({ stats, priorityStats });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
