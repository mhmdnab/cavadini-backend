/**
 * URL-slug helper shared across admin controllers (brands, categories, themes).
 * Lowercases, strips diacritics (NFKD + combining-mark removal), turns any run
 * of non-alphanumerics into a single '-', and trims leading/trailing '-'.
 * e.g. "Café René!" -> "cafe-rene".
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Resolves the slug to persist: an explicit non-empty slug wins, otherwise it is
 * derived from `name`. Throws a `Validation:` error (mapped to HTTP 400) when the
 * result would be empty — preventing an empty string from being written to a
 * `@unique` slug column (which would corrupt future inserts).
 */
export function deriveSlug(name: string | undefined, slug: string | undefined): string {
  const candidate = slug?.trim() || slugify(name ?? '');
  if (!candidate) {
    throw new Error(
      'Validation: could not derive a slug — provide a slug, or a name containing letters or numbers',
    );
  }
  return candidate;
}
