export function formatCurrency(amountInCents: number, currency: string = 'usd'): string {
  const amount = amountInCents / 100;
  const locale = 'en-CA';
  const currencyCode = currency.toUpperCase();

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  return date.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatReason(reason: string | null): string {
  if (!reason) return 'Not specified';
  const map: Record<string, string> = {
    duplicate: 'Duplicate',
    fraudulent: 'Fraudulent',
    requested_by_customer: 'Customer Request',
    expired_uncaptured_charge: 'Expired Charge',
    other: 'Other',
  };
  return map[reason] ?? reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    succeeded: 'Succeeded',
    pending: 'Pending',
    failed: 'Failed',
    canceled: 'Canceled',
    requires_action: 'Requires Action',
  };
  return map[status] ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
