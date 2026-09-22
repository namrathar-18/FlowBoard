process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://namrp18_db_user:YdAK8YjOHaCdlBuJ@cluster0.mpubqxe.mongodb.net/flowboard_test';
process.env.JWT_SECRET = 'test_secret_key_for_ci';

const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectDB } = require('../src/app');

let token = '';
let projectId = '';

const testUser = {
  name: 'Project Tester',
  email: `projtester_${Date.now()}@flowboard.test`,
  password: 'password123',
};

beforeAll(async () => {
  await connectDB();

  // Register and login
  const reg = await request(app).post('/api/auth/register').send(testUser);
  token = reg.body.token;
}, 15000);

afterAll(async () => {
  await mongoose.connection.collection('users').deleteMany({ email: testUser.email });
  await mongoose.connection.collection('projects').deleteMany({ name: /^Test Project/ });
  await mongoose.connection.close();
});

describe('POST /api/projects', () => {
  it('creates a project when authenticated', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project Alpha', description: 'A test project', color: '#6366f1' });

    expect(res.status).toBe(201);
    expect(res.body.project.name).toBe('Test Project Alpha');
    expect(res.body.project.owner).toBeDefined();
    projectId = res.body.project._id;
  });

  it('rejects project creation without auth', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Test Project Beta' });
    expect(res.status).toBe(401);
  });

  it('rejects invalid project name (too short)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A' });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/projects', () => {
  it('returns user projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.projects)).toBe(true);
    expect(res.body.projects.length).toBeGreaterThan(0);
  });

  it('each project has taskCounts', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);
    const project = res.body.projects[0];
    expect(project.taskCounts).toBeDefined();
    expect(project.taskCounts.total).toBeGreaterThanOrEqual(0);
  });
});

describe('GET /api/projects/:id', () => {
  it('returns a specific project', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.project._id).toBe(projectId);
  });

  it('returns 404 for non-existent project', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/projects/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/projects/:id', () => {
  it('updates a project', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'on-hold', description: 'Updated description' });
    expect(res.status).toBe(200);
    expect(res.body.project.status).toBe('on-hold');
  });
});

describe('DELETE /api/projects/:id', () => {
  it('deletes a project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('returns 404 after deletion', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
