import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIncomeStatement } from '../useIncomeStatement';
import * as incomeStatementService from '../../services/firestore/incomeStatementService';

// Mock the service
vi.mock('../../services/firestore/incomeStatementService', () => ({
  getIncomeStatement: vi.fn(),
  saveIncomeStatement: vi.fn(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useIncomeStatement', () => {
  const mockUid = 'user123';
  const mockPropertyId = 'prop456';
  const mockData = {
    Income: { order: ['rent'], items: { rent: { value: 5000 } } },
    Expenses: { order: [], items: {} },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch income statement on mount', async () => {
    incomeStatementService.getIncomeStatement.mockResolvedValue(mockData);

    const { result } = renderHook(() => useIncomeStatement(mockUid, mockPropertyId));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(incomeStatementService.getIncomeStatement).toHaveBeenCalledWith(mockUid, mockPropertyId);
    expect(result.current.data).toEqual(mockData);
  });

  it('should handle empty data gracefully', async () => {
    incomeStatementService.getIncomeStatement.mockResolvedValue(null);

    const { result } = renderHook(() => useIncomeStatement(mockUid, mockPropertyId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({});
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Fetch failed');
    incomeStatementService.getIncomeStatement.mockRejectedValue(error);

    const { result } = renderHook(() => useIncomeStatement(mockUid, mockPropertyId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(console.error).toHaveBeenCalledWith(
      'Failed to load income statement:',
      error
    );
  });

  it('should save income statement', async () => {
    incomeStatementService.getIncomeStatement.mockResolvedValue(mockData);
    incomeStatementService.saveIncomeStatement.mockResolvedValue();

    const { result } = renderHook(() => useIncomeStatement(mockUid, mockPropertyId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.save();

    expect(incomeStatementService.saveIncomeStatement).toHaveBeenCalledWith(
      mockUid,
      mockPropertyId,
      mockData
    );
  });

  it('should not fetch when uid or propertyId is missing', () => {
    const { result: result1 } = renderHook(() => useIncomeStatement(null, mockPropertyId));
    const { result: result2 } = renderHook(() => useIncomeStatement(mockUid, null));

    expect(incomeStatementService.getIncomeStatement).not.toHaveBeenCalled();
    expect(result1.current.loading).toBe(true);
    expect(result2.current.loading).toBe(true);
  });

  it('should allow updating data locally', async () => {
    incomeStatementService.getIncomeStatement.mockResolvedValue(mockData);

    const { result } = renderHook(() => useIncomeStatement(mockUid, mockPropertyId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newData = { ...mockData, Expenses: { order: ['utilities'], items: {} } };
    result.current.setData(newData);

    expect(result.current.data).toEqual(newData);
  });
});
