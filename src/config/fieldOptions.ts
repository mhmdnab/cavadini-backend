// Scalar string fields that are fixed-option in the admin UI (one source of truth
// for dropdowns + storefront filters). Distinct DB values are merged with CURATED.
export const SCALAR_OPTION_FIELDS = [
  'gender', 'movement', 'caseMaterial', 'strapMaterial',
  'caseColor', 'strapColor', 'dialColor', 'displayType',
  'waterResistance', 'watchShape', 'caseFinish', 'crystalType',
  'bezel', 'caseBack', 'dialPattern', 'settingAdornment', 'clasp',
  'fitting', 'material', 'color', 'productType',
] as const;

// String[] fields whose element values are also offered as options.
export const ARRAY_OPTION_FIELDS = ['functions', 'styles'] as const;

// Optional curated base values guaranteed to appear even with no product using them.
// Enriched in Plan 2 from the storefront's config/sidebar.ts + valueTranslations.ts.
export const CURATED: Record<string, string[]> = {};
