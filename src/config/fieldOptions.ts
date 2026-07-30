// Scalar string fields that are fixed-option in the admin UI (one source of truth
// for dropdowns + storefront filters). Distinct DB values are merged with CURATED.
export const SCALAR_OPTION_FIELDS = [
  'gender', 'movement', 'caseMaterial', 'strapMaterial',
  'caseColor', 'strapColor', 'dialColor', 'displayType',
  'waterResistance', 'watchShape', 'caseFinish', 'crystalType',
  'bezel', 'caseBack', 'dialPattern', 'settingAdornment', 'clasp',
  'fitting', 'material', 'color', 'productType', 'condition',
] as const;

// String[] fields whose element values are also offered as options.
export const ARRAY_OPTION_FIELDS = ['functions', 'styles'] as const;

// Curated base values guaranteed to appear even when no product uses them yet.
// Distinct DB values are merged on top, so custom entries still surface.
export const CURATED: Record<string, string[]> = {
  // Item 4 — Uhrenform (case shape). Empty until now because no product had a value.
  watchShape: ['Rund', 'Quadrat', 'Rechteck', 'Oval', 'Tonneau', 'Spitzeck', 'Assymetrisch'],
  // Item 5 — allowed Style values (multi-select, max 3 enforced client-side).
  styles: [
    'Rarität', 'Markant', 'Feminin', 'Business-Casual', 'Luxus', 'Klassiker',
    'Elegant/festlich', 'Business-Formal', 'Sport', 'Taucher', 'Militär', 'Lässig',
    'modern/Fashion', 'Glamourös', 'Flieger', 'Skelettuhr', 'Vintage', 'Retro',
    'Funktional', 'Wow-Effekt', 'Dresswatch', 'Bahnhofsuhr',
  ],
  // Item 10 — condition options. Canonical keys; the customer-facing label comes
  // from the frontend valueTranslations "condition" set (where Ina's exact legal
  // wording will be dropped in).
  condition: ['Neu', 'Lagerware/NOS', 'Gebraucht'],
};
