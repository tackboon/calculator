export function createWorker(): Worker {
  return {
    postMessage: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    terminate: jest.fn(),
  } as unknown as Worker;
}
