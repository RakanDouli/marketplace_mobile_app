/**
 * Filter specs by view mode (grid/list/detail)
 * Uses attribute showInGrid/showInList/showInDetail flags
 */

import { Attribute } from '../stores/filtersStore';

export type SpecsViewMode = 'grid' | 'list' | 'detail';

/**
 * Filter specsDisplay based on attribute display flags
 * @param specsDisplay - The specs object from listing
 * @param attributes - Array of attributes with display flags
 * @param viewMode - 'grid' | 'list' | 'detail'
 * @returns Filtered specs object
 */
export function filterSpecsByViewMode(
  specsDisplay: Record<string, any> | undefined,
  attributes: Attribute[],
  viewMode: SpecsViewMode
): Record<string, any> {
  if (!specsDisplay || !attributes.length) {
    return specsDisplay || {};
  }

  // Create a map of attribute key -> display flags
  const attributeFlags = new Map<string, { showInGrid?: boolean; showInList?: boolean; showInDetail?: boolean }>();
  attributes.forEach(attr => {
    attributeFlags.set(attr.key, {
      showInGrid: attr.showInGrid,
      showInList: attr.showInList,
      showInDetail: attr.showInDetail,
    });
  });

  // Filter specs based on view mode
  const filtered: Record<string, any> = {};

  Object.entries(specsDisplay).forEach(([key, value]) => {
    const flags = attributeFlags.get(key);

    // If no attribute found, include by default (backward compatibility)
    if (!flags) {
      filtered[key] = value;
      return;
    }

    // Check the appropriate flag based on view mode
    let shouldShow = true;
    switch (viewMode) {
      case 'grid':
        shouldShow = flags.showInGrid !== false; // Default to true if undefined
        break;
      case 'list':
        shouldShow = flags.showInList !== false;
        break;
      case 'detail':
        shouldShow = flags.showInDetail !== false;
        break;
    }

    if (shouldShow) {
      filtered[key] = value;
    }
  });

  return filtered;
}

/**
 * Format filtered specs to string with | separator
 * @param specsDisplay - The specs object
 * @param attributes - Array of attributes with display flags
 * @param viewMode - 'grid' | 'list' | 'detail'
 * @returns Formatted string like "2023 | Toyota | Camry"
 */
export function formatFilteredSpecs(
  specsDisplay: Record<string, any> | string | undefined,
  attributes: Attribute[],
  viewMode: SpecsViewMode
): string {
  if (!specsDisplay) return '';

  // Parse if string
  let specs: Record<string, any> = {};
  try {
    if (typeof specsDisplay === 'string') {
      specs = JSON.parse(specsDisplay);
    } else if (typeof specsDisplay === 'object') {
      specs = specsDisplay;
    }
  } catch {
    return '';
  }

  // Filter by view mode
  const filtered = filterSpecsByViewMode(specs, attributes, viewMode);

  // Format to string (deduplicated)
  const partsSet = new Set<string>();
  Object.entries(filtered)
    .filter(([key]) => key !== 'accountType' && key !== 'account_type')
    .forEach(([, value]) => {
      if (!value) return;
      const displayValue = typeof value === 'object' ? value.value : value;
      if (displayValue && displayValue !== '') {
        partsSet.add(String(displayValue));
      }
    });

  // Wrap each part in Unicode isolates to prevent BiDi reordering
  return Array.from(partsSet).map(p => `\u2068${p}\u2069`).join(' | ');
}
