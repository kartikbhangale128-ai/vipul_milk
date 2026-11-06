export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatLitres(litres: number | null | undefined): string {
  if (litres == null) return '0.00 L';
  const num = Number(litres);
  // If it's a multiple of 0.01 (e.g. 1.0, 1.5, 0.50), format with 2 decimals
  // If it has 3 decimals (e.g. 0.625, 1.375), show full 3 decimals
  const is3Decimals = (Math.round(num * 1000) % 10) !== 0;
  return `${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: is3Decimals ? 3 : 2,
  })} L`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
  } catch {
    return dateStr;
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthDates(year: number, month: number): string[] {
  const dates: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dates.push(dStr);
  }
  return dates;
}
