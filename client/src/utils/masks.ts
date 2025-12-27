// utils/masks.ts
export const formatCPF = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
  return value;
};

export const formatRG = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  return cleaned
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{1})\d+?$/, '$1');
};

export const formatPhone = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');

  if (cleaned.length <= 10) {
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  } else {
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
};

export const formatCEP = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  return cleaned
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

// Formato CNJ: 0000000-00.0000.0.00.0000
export const formatProcessNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');

  return cleaned
    .replace(/(\d{7})(\d)/, '$1-$2')        // 0000000-
    .replace(/(\d{7}-\d{2})(\d)/, '$1.$2')  // 0000000-00.
    .replace(/(\d{7}-\d{2}\.\d{4})(\d)/, '$1.$2')  // 0000000-00.0000.
    .replace(/(\d{7}-\d{2}\.\d{4}\.\d{1})(\d)/, '$1.$2')  // 0000000-00.0000.0.
    .replace(/(\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2})(\d)/, '$1.$2')  // 0000000-00.0000.0.00.
    .replace(/(\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4})\d+?$/, '$1'); // Limita a 20 dígitos
};

export const removeMask = (value: string): string => {
  return value.replace(/\D/g, '');
};