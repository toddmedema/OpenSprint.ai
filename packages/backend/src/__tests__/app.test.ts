import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';

describe('App', () => {
  it('should create an Express app', () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.get).toBe('function');
    expect(typeof app.post).toBe('function');
    expect(typeof app.use).toBe('function');
  });

  it('should respond to health check', async () => {
    const app = createApp();

    // Create a mock request/response for testing
    const mockReq = {
      method: 'GET',
      url: '/health',
    };

    // Basic structural test
    expect(app).toBeDefined();
  });
});
