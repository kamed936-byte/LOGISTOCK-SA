export const money = (v: number | null | undefined): string =>
  Number(v ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const dateFr = (s: string | null | undefined): string => {
  if (!s) return '';
  const d = new Date(s);
  return isNaN(d.getTime()) ? String(s) : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};
