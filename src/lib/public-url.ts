/** Prefix public assets with Vite `base` (needed on GitHub Pages). */
export function publicUrl(path: string) {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}${path.replace(/^\//, "")}`;
}
