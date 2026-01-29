import { BRAND_CONFIG } from '@/config/brand';

/**
 * Format currency amount with proper locale and symbol
 */
export const formatCurrency = (
  amount: number | string,
  options: {
    locale?: string;
    currency?: string;
    symbol?: string;
    showSymbol?: boolean;
    compact?: boolean;
  } = {}
): string => {
  const {
    locale = BRAND_CONFIG.currency.locale,
    currency = BRAND_CONFIG.currency.code,
    symbol = BRAND_CONFIG.currency.symbol,
    showSymbol = true,
    compact = false
  } = options;

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0';
  }

  // For Uzbekistan Sum, we typically don't use decimal places
  const shouldShowDecimals = currency !== 'UZS';
  const minimumFractionDigits = shouldShowDecimals ? 2 : 0;
  const maximumFractionDigits = shouldShowDecimals ? 2 : 0;

  // Format with locale
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    ...(compact && {
      notation: 'compact',
      compactDisplay: 'short'
    })
  }).format(numAmount);

  if (!showSymbol) {
    return formatted;
  }

  // For UZS, symbol typically goes after the number
  if (currency === 'UZS') {
    return `${formatted} ${symbol}`;
  }

  // For other currencies, use Intl format
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(numAmount);
  } catch {
    // Fallback to manual formatting
    return `${formatted} ${symbol}`;
  }
};

/**
 * Format Uzbekistan Sum specifically
 */
export const formatUZS = (amount: number | string): string => {
  return formatCurrency(amount, {
    currency: 'UZS',
    symbol: 'сум',
    locale: 'uz-UZ'
  });
};

/**
 * Parse currency string back to number
 */
export const parseCurrency = (value: string): number => {
  // Remove currency symbols and formatting
  const cleaned = value
    .replace(/[^\d.,-]/g, '')
    .replace(/,/g, '.');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Convert between currencies (placeholder for future API integration)
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  // TODO: Implement real currency conversion API
  // For now, return same amount
  return amount;
};

/**
 * Get currency display info
 */
export const getCurrencyInfo = (currency: string = BRAND_CONFIG.currency.code) => {
  const currencies = {
    UZS: {
      code: 'UZS',
      symbol: 'сум',
      name: 'Uzbekistan Sum',
      locale: 'uz-UZ',
      decimalPlaces: 0
    },
    USD: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      locale: 'en-US',
      decimalPlaces: 2
    },
    EUR: {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      locale: 'de-DE',
      decimalPlaces: 2
    },
    RUB: {
      code: 'RUB',
      symbol: '₽',
      name: 'Russian Ruble',
      locale: 'ru-RU',
      decimalPlaces: 2
    }
  };

  return currencies[currency as keyof typeof currencies] || currencies.UZS;
};

export default {
  formatCurrency,
  formatUZS,
  parseCurrency,
  convertCurrency,
  getCurrencyInfo
};
