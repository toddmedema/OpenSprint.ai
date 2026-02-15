import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BeadsService } from '../services/beads.service.js';

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('util', () => ({
  promisify: vi.fn((fn: unknown) => {
    return async (...args: unknown[]) => {
      const { exec } = await import('child_process');
      return new Promise((resolve, reject) => {
        const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
        const lastCall = mockExec.mock.calls[mockExec.mock.calls.length - 1];
        if (lastCall) {
          resolve(lastCall);
        } else {
          reject(new Error('No mock response set'));
        }
      });
    };
  }),
}));

describe('BeadsService', () => {
  let beads: BeadsService;

  beforeEach(() => {
    beads = new BeadsService();
    vi.clearAllMocks();
  });

  it('should be instantiable', () => {
    expect(beads).toBeInstanceOf(BeadsService);
  });

  it('should have all expected methods', () => {
    expect(typeof beads.init).toBe('function');
    expect(typeof beads.create).toBe('function');
    expect(typeof beads.update).toBe('function');
    expect(typeof beads.close).toBe('function');
    expect(typeof beads.ready).toBe('function');
    expect(typeof beads.list).toBe('function');
    expect(typeof beads.show).toBe('function');
    expect(typeof beads.addDependency).toBe('function');
    expect(typeof beads.delete).toBe('function');
    expect(typeof beads.sync).toBe('function');
    expect(typeof beads.depTree).toBe('function');
  });
});
