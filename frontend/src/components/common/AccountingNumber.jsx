import React from 'react';
import { useUserSettings } from '@/app/providers/UserSettingsProvider';
import { formatAccounting, formatPercent } from '@/utils/accountingFormat';

// Symbol configuration for different value types
const SYMBOL_CONFIG = {
  currency: { prefix: '$', suffix: '' },
  percent: { prefix: '', suffix: '%' },
  sqft: { prefix: '', suffix: ' sq ft' },
  psf: { prefix: '$', suffix: '/sf' },
  psfyr: { prefix: '$', suffix: '/sf/yr' },
  punit: { prefix: '$', suffix: '/unit' },
  punityr: { prefix: '$', suffix: '/unit/yr' },
  years: { prefix: '', suffix: ' yrs' },
  months: { prefix: '', suffix: ' mo' },
  acres: { prefix: '', suffix: ' acres' },
  none: { prefix: '', suffix: '' },
};

/**
 * AccountingNumber - Displays a number formatted in accounting style
 * based on user settings.
 *
 * @param {Object} props
 * @param {number|string} props.value - The numeric value to display
 * @param {number} props.decimals - Number of decimal places (default: 2)
 * @param {string} props.symbolType - Type of symbol (currency, percent, sqft, etc.)
 * @param {boolean} props.showCurrency - Whether to show $ symbol (deprecated, use symbolType)
 * @param {boolean} props.isPercent - Format as percentage (deprecated, use symbolType)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.prefix - Custom prefix (overrides symbolType)
 * @param {string} props.suffix - Custom suffix (overrides symbolType)
 */
export function AccountingNumber({
  value,
  decimals = 2,
  symbolType,
  showCurrency = false,
  isPercent = false,
  className = '',
  prefix: customPrefix,
  suffix: customSuffix,
}) {
  const { settings } = useUserSettings();
  const accountingFormat = settings?.accountingFormat ?? false;

  // Determine symbol type from props (backwards compatibility)
  let effectiveSymbolType = symbolType || 'none';
  if (!symbolType) {
    if (showCurrency) effectiveSymbolType = 'currency';
    else if (isPercent) effectiveSymbolType = 'percent';
  }

  // Get symbol configuration
  const symbolConfig = SYMBOL_CONFIG[effectiveSymbolType] || SYMBOL_CONFIG.none;
  const prefix = customPrefix !== undefined ? customPrefix : symbolConfig.prefix;
  const suffix = customSuffix !== undefined ? customSuffix : symbolConfig.suffix;

  // Handle empty/null values
  if (value === '' || value === null || value === undefined) {
    return <span className={className}>—</span>;
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return <span className={className}>—</span>;
  }

  let formatted;

  if (accountingFormat) {
    // Use accounting format (with parentheses for negatives)
    formatted = formatAccounting(num, { showCurrency: false, decimals });
  } else {
    // Standard formatting
    formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

export default AccountingNumber;
