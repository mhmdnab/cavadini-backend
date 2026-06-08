import { describe, it, expect } from 'vitest';
import { slugify, deriveSlug } from './slugify';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Swiss Military Hanowa')).toBe('swiss-military-hanowa');
  });

  it('strips diacritics', () => {
    expect(slugify('Café René')).toBe('cafe-rene');
  });

  it('collapses symbols and trims edge hyphens', () => {
    expect(slugify('  --Men!! & Women--  ')).toBe('men-women');
  });

  it('returns empty string for symbol-only input', () => {
    expect(slugify('!!!')).toBe('');
  });
});

describe('deriveSlug', () => {
  it('prefers an explicit non-empty slug', () => {
    expect(deriveSlug('Rolex', 'custom-slug')).toBe('custom-slug');
  });

  it('derives from name when slug is empty', () => {
    expect(deriveSlug('Rolex', '')).toBe('rolex');
  });

  it('derives from name when slug is undefined', () => {
    expect(deriveSlug('Rolex', undefined)).toBe('rolex');
  });

  it('throws when neither yields a usable slug', () => {
    expect(() => deriveSlug(undefined, '')).toThrow(/Validation/);
    expect(() => deriveSlug('!!!', undefined)).toThrow(/Validation/);
  });
});
