export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

export function whatsappUrl(phone?: string, text?: string): string | null {
  const normalized = normalizePhone(phone).replace(/^\+/, '');
  if (!normalized) return null;

  const message = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${normalized}${message}`;
}
