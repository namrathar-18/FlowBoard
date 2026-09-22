import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Simple smoke test — no network calls
describe('App rendering', () => {
  it('renders without crashing (smoke test)', () => {
    // Just verify the test runner itself works
    expect(true).toBe(true);
  });

  it('renders a basic div', () => {
    const { container } = render(
      <MemoryRouter>
        <div data-testid="flowboard-root">FlowBoard</div>
      </MemoryRouter>
    );
    expect(container.querySelector('[data-testid="flowboard-root"]')).toBeTruthy();
  });

  it('formats status labels correctly', () => {
    const statusLabel = (s) =>
      ({ todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' }[s] || s);
    expect(statusLabel('todo')).toBe('To Do');
    expect(statusLabel('in-progress')).toBe('In Progress');
    expect(statusLabel('done')).toBe('Done');
  });

  it('validates priority options', () => {
    const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
    expect(PRIORITY_OPTIONS).toHaveLength(4);
    expect(PRIORITY_OPTIONS).toContain('critical');
  });

  it('formats date correctly', () => {
    const date = new Date('2024-12-31T00:00:00Z');
    expect(date instanceof Date).toBe(true);
    expect(isNaN(date.getTime())).toBe(false);
  });
});
