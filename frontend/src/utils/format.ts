// Formatting utilities

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-NZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatWeight(kg: number): string {
  if (kg < 1) {
    return `${(kg * 1000).toFixed(0)}g`;
  }
  return `${kg.toFixed(2)}kg`;
}
