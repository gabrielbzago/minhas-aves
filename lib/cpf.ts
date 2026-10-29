export function digitsOnlyCpf(value: string | null | undefined) {
  return String(value || '').replace(/\D/g, '');
}

export function isValidCpf(value: string | null | undefined) {
  const cpf = digitsOnlyCpf(value);
  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === Number(cpf[10]);
}

export function formatCpf(value: string | null | undefined) {
  const cpf = digitsOnlyCpf(value);
  if (cpf.length !== 11) return value || '';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
