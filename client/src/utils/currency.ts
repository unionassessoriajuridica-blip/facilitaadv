// Utility functions for currency formatting and parsing

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove currency symbol and spaces
  let cleanValue = value.replace(/[R$\s]/g, '');
  
  // Handle Brazilian currency format (dots for thousands, comma for decimals)
  // Ex: "50.000,00" should become 50000.00
  
  // If there's a comma, it's the decimal separator
  if (cleanValue.includes(',')) {
    // Split by comma to separate integer and decimal parts
    const parts = cleanValue.split(',');
    // Remove dots from the integer part (thousands separators)
    const integerPart = parts[0].replace(/\./g, '');
    // Keep the decimal part as is
    const decimalPart = parts[1] || '00';
    // Combine with dot as decimal separator for parsing
    cleanValue = `${integerPart}.${decimalPart}`;
  } else {
    // If no comma, remove dots (they might be thousands separators)
    cleanValue = cleanValue.replace(/\./g, '');
  }
  
  return parseFloat(cleanValue) || 0;
};

export const formatCurrencyInput = (value: string): string => {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, '');
  
  if (!numericValue) return '';
  
  // Convert to number and divide by 100 to handle cents
  const number = parseInt(numericValue) / 100;
  
  // Format with Brazilian currency format
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(number);
};