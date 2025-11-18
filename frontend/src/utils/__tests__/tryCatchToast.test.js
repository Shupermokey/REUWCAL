import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { tryCatchToast } from '../tryCatchToast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('tryCatchToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show success toast when promise resolves', async () => {
    const mockResult = { data: 'test data' };
    const promise = Promise.resolve(mockResult);

    const result = await tryCatchToast(promise, 'Success!', 'Error');

    expect(result).toEqual(mockResult);
    expect(toast.success).toHaveBeenCalledWith('Success!');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should show error toast when promise rejects', async () => {
    const error = new Error('Test error');
    const promise = Promise.reject(error);

    await expect(tryCatchToast(promise, 'Success', 'Failed')).rejects.toThrow('Test error');

    expect(toast.error).toHaveBeenCalledWith('Failed');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('should use error message when errorMsg not provided', async () => {
    const error = new Error('Custom error message');
    const promise = Promise.reject(error);

    await expect(tryCatchToast(promise, 'Success')).rejects.toThrow();

    expect(toast.error).toHaveBeenCalledWith('Custom error message');
  });

  it('should not show success toast when successMsg is null', async () => {
    const promise = Promise.resolve('data');

    await tryCatchToast(promise, null, 'Error');

    expect(toast.success).not.toHaveBeenCalled();
  });

  it('should handle errors without message property', async () => {
    const error = 'String error';
    const promise = Promise.reject(error);

    await expect(tryCatchToast(promise, 'Success', 'Default error')).rejects.toThrow();

    expect(toast.error).toHaveBeenCalledWith('Default error');
  });
});
