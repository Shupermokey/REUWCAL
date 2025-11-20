import React, { useState, useEffect, useCallback } from 'react';
import { useUserSettings } from '@/app/providers/UserSettingsProvider';
import { formatForInput, parseAccounting } from '@/utils/accountingFormat';

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
 * AccountingInput - A number input that formats values in accounting style
 * based on user settings.
 *
 * @param {Object} props
 * @param {number|string} props.value - The numeric value
 * @param {Function} props.onChange - Callback with parsed number value
 * @param {number} props.decimals - Number of decimal places (default: 2)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.symbolType - Type of symbol (currency, percent, sqft, etc.)
 * @param {string} props.prefix - Custom prefix (overrides symbolType)
 * @param {string} props.suffix - Custom suffix (overrides symbolType)
 * @param {boolean} props.disabled - Whether input is disabled
 */
export function AccountingInput({
  value,
  onChange,
  decimals = 2,
  className = '',
  placeholder = '0',
  symbolType = 'none',
  prefix: customPrefix,
  suffix: customSuffix,
  disabled = false,
  ...rest
}) {
  const { settings } = useUserSettings();
  const accountingFormat = settings?.accountingFormat ?? false;

  // Get symbol configuration
  const symbolConfig = SYMBOL_CONFIG[symbolType] || SYMBOL_CONFIG.none;
  const prefix = customPrefix !== undefined ? customPrefix : symbolConfig.prefix;
  const suffix = customSuffix !== undefined ? customSuffix : symbolConfig.suffix;

  // Local state for the display value (formatted string)
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Update display value when external value changes (and not focused)
  useEffect(() => {
    if (!isFocused) {
      if (accountingFormat && value !== '' && value !== null && value !== undefined) {
        const formatted = formatForInput(value, decimals);
        setDisplayValue(formatted ? `${prefix}${formatted}${suffix}` : '');
      } else {
        const val = value?.toString() || '';
        setDisplayValue(val ? `${prefix}${val}${suffix}` : '');
      }
    }
  }, [value, accountingFormat, decimals, isFocused, prefix, suffix]);

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    // Show raw number when focused for easier editing (strip symbols)
    let rawDisplay = displayValue;
    // Remove prefix and suffix
    if (prefix && rawDisplay.startsWith(prefix)) {
      rawDisplay = rawDisplay.slice(prefix.length);
    }
    if (suffix && rawDisplay.endsWith(suffix)) {
      rawDisplay = rawDisplay.slice(0, -suffix.length);
    }

    if (accountingFormat) {
      const rawValue = parseAccounting(rawDisplay);
      setDisplayValue(rawValue === 0 ? '' : rawValue.toString());
    } else {
      setDisplayValue(rawDisplay.replace(/,/g, ''));
    }
    e.target.select();
  }, [accountingFormat, displayValue, prefix, suffix]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Parse and format on blur
    const parsed = accountingFormat ? parseAccounting(displayValue) : (parseFloat(displayValue) || 0);

    if (parsed !== 0) {
      if (accountingFormat) {
        const formatted = formatForInput(parsed, decimals);
        setDisplayValue(`${prefix}${formatted}${suffix}`);
      } else {
        setDisplayValue(`${prefix}${parsed}${suffix}`);
      }
    } else {
      setDisplayValue('');
    }

    // Notify parent of the change
    if (onChange) {
      onChange(parsed);
    }
  }, [accountingFormat, displayValue, decimals, onChange, prefix, suffix]);

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);

    // For non-accounting format, update parent immediately
    if (!accountingFormat && onChange) {
      onChange(parseFloat(newValue) || 0);
    }
  }, [accountingFormat, onChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  }, []);

  return (
    <input
      type={accountingFormat ? 'text' : 'number'}
      className={className}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      min={!accountingFormat ? min : undefined}
      max={!accountingFormat ? max : undefined}
      step={!accountingFormat ? step : undefined}
      disabled={disabled}
      {...rest}
    />
  );
}

export default AccountingInput;
