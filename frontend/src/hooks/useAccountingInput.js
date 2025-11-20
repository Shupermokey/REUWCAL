import { useState, useCallback } from 'react';
import { formatForInput, parseAccounting } from '@/utils/accountingFormat';
import { useUserSettings } from '@/app/providers/UserSettingsProvider';

/**
 * Custom hook for handling accounting formatted number inputs
 * Returns formatted display value and handlers for inputs
 */
export function useAccountingInput() {
  const { settings } = useUserSettings();
  const accountingFormat = settings?.accountingFormat ?? false;

  /**
   * Format a number for display in an input
   * @param {number|string} value - The value to format
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted string or original value
   */
  const formatValue = useCallback((value, decimals = 2) => {
    if (!accountingFormat) {
      return value;
    }
    return formatForInput(value, decimals);
  }, [accountingFormat]);

  /**
   * Parse a formatted input value back to a number
   * @param {string} value - The formatted string
   * @returns {number} Parsed number
   */
  const parseValue = useCallback((value) => {
    if (!accountingFormat) {
      return parseFloat(value) || 0;
    }
    return parseAccounting(value);
  }, [accountingFormat]);

  return {
    accountingFormat,
    formatValue,
    parseValue,
  };
}

export default useAccountingInput;
