const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// ─── GET /api/tasks?project=:projectId ────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { project, status, priority, assignee, search } = req.query;

    // Build filter — user must own or be a member of the project
    const accessibleProjects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).select('_id');

    const accessibleIds = accessibleProjects.map((p) => p._id);

    const filter = { project: { $in: accessibleIds } };
    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name color')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2–200 chars'),
    body('project').isMongoId().withMessage('Valid project ID is required'),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
      const { title, description, status, priority, project, assignee, dueDate, tags } = req.body;

      // Verify project access
      const proj = await Project.findOne({
        _id: project,
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      });
      if (!proj) return res.status(404).json({ error: 'Project not found or unauthorized' });

      const task = await Task.create({
        title,
        description,
        status,
        priority,
        project,
        assignee: assignee || null,
        createdBy: req.user._id,
        dueDate: dueDate || null,
        tags: tags || [],
      });

      await task.populate([
        { path: 'assignee', select: 'name email' },
        { path: 'createdBy', select: 'name email' },
        { path: 'project', select: 'name color' },
      ]);

      res.status(201).json({ message: 'Task created', task });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/tasks/:id ────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name color owner');

    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Check access
    const project = task.project;
    const hasAccess =
      project.owner.toString() === req.user._id.toString() ||
      (project.members || []).includes(req.user._id.toString());

    if (!hasAccess && task.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/tasks/:id ────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const proj = task.project;
    const isOwner = proj.owner.toString() === req.user._id.toString();
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    if (!isOwner && !isCreator) {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    const allowed = ['title', 'description', 'status', 'priority', 'assignee', 'dueDate', 'tags'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();
    await task.populate([
      { path: 'assignee', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'project', select: 'name color' },
    ]);

    res.json({ message: 'Task updated', task });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/tasks/:id ─────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isOwner = task.project.owner.toString() === req.user._id.toString();
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    if (!isOwner && !isCreator) {
      return res.status(403).json({ error: 'Not authorized to delete this task' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/tasks/stats/summary ─────────────────────────────────────────────
router.get('/stats/summary', async (req, res, next) => {
  try {
    const accessibleProjects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).select('_id');
    const ids = accessibleProjects.map((p) => p._id);

    const [statusStats, priorityStats, recentTasks] = await Promise.all([
      Task.aggregate([
        { $match: { project: { $in: ids } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { project: { $in: ids } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.find({ project: { $in: ids } })
        .populate('project', 'name color')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.json({ statusStats, priorityStats, recentTasks });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
