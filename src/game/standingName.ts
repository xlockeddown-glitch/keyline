/** Standings: First + last initial. Single-token names stay as the first token. */
export function standingName(name: string | null | undefined): string {
  const raw = (name ?? "").replace(/[\u0000-\u001f]/g, "").trim();
  if (!raw) return "Walker";
  const parts = raw.split(/\s+/).filter(Boolean);
  const first = (parts[0] ?? "Walker").slice(0, 24);
  if (parts.length < 2) return first;
  const lastLetters = (parts[parts.length - 1] ?? "").replace(/[^A-Za-zÀ-ÿ]/g, "");
  const initial = lastLetters.charAt(0);
  if (!initial) return first;
  return `${first} ${initial.toUpperCase()}.`.slice(0, 32);
}
