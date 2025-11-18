import { SPECIAL_IDS } from '@/utils/income/incomeConfig.js';

/**
 * Unit Detection Helpers
 * Determines if an Income Statement row represents a unit (vs unit type)
 */

/**
 * Determines if we're adding individual units (Unit 1, Unit 2)
 * vs adding unit types (Studio, One Bedroom)
 *
 * @param {string} parentId - ID of the parent item
 * @param {string[]} path - Path of ancestor IDs
 * @param {string} sectionKey - Section key ("Income", "OperatingExpenses", etc.)
 * @returns {boolean} - True if adding units, false if adding unit types
 */
export function isAddingUnits(parentId, path, sectionKey) {
  // Must be in Income section
  if (sectionKey !== 'Income') return false;

  // Case 1: Adding directly to GSR (path = [], parentId = "gsr")
  // → Adding plain units directly under GSR → YES, these are units!
  if (path.length === 0 && parentId === SPECIAL_IDS.GROSS_SCHEDULED_RENT) {
    return true;
  }

  // Case 2: Adding to a child of GSR (path = ["gsr"])
  // → Adding units under a header (Unit 1, Unit 2) → YES, these are units!
  if (path.length > 0 && path[0] === SPECIAL_IDS.GROSS_SCHEDULED_RENT) {
    return true;
  }

  return false;
}

/**
 * Gets the unit type label (Studio, One Bedroom, etc.) from the parent item
 *
 * @param {string} parentId - ID of the parent item
 * @param {string[]} path - Path of ancestor IDs
 * @param {object} sectionData - Section data structure
 * @returns {string} - Unit type label
 */
export function getParentUnitType(parentId, path, sectionData) {
  if (path.length === 0) {
    // Parent is a root item
    return sectionData.items[parentId]?.label || 'Unknown';
  }

  // Parent is nested - need to traverse
  const rootId = path[0];
  const rootItem = sectionData.items[rootId];

  if (!rootItem) return 'Unknown';

  // If path is just ["gsr"], parentId is direct child of gsr
  if (path.length === 1) {
    return rootItem.children[parentId]?.label || 'Unknown';
  }

  // Walk down the tree following the path (skipping the first which is rootId)
  let current = rootItem;
  for (let i = 1; i < path.length; i++) {
    current = current.children[path[i]];
    if (!current) return 'Unknown';
  }

  // Now we're at the parent's parent, get the parent label
  return current.children[parentId]?.label || 'Unknown';
}

/**
 * Gets an item from the data structure by traversing the path
 *
 * @param {string} itemId - ID of the item to find
 * @param {string[]} path - Path of ancestor IDs
 * @param {object} sectionData - Section data structure
 * @returns {object|null} - The item, or null if not found
 */
export function getItemByPath(itemId, path, sectionData) {
  if (path.length === 0) {
    // Item is a root item
    return sectionData.items[itemId] || null;
  }

  // Item is nested - traverse down
  const rootId = path[0];
  let current = sectionData.items[rootId];

  if (!current) return null;

  // Walk down the path (skipping first which is rootId)
  for (let i = 1; i < path.length; i++) {
    current = current.children[path[i]];
    if (!current) return null;
  }

  // Now get the actual item
  return current.children[itemId] || null;
}

/**
 * Checks if an item has a linkedUnitId
 *
 * @param {string} itemId - ID of the item
 * @param {string[]} path - Path of ancestor IDs
 * @param {object} sectionData - Section data structure
 * @returns {string|null} - The linkedUnitId if it exists, null otherwise
 */
export function getLinkedUnitId(itemId, path, sectionData) {
  const item = getItemByPath(itemId, path, sectionData);
  return item?.linkedUnitId || null;
}

/**
 * Updates an item to add linkedUnitId
 * Returns the updated section data
 *
 * @param {string} itemId - ID of the item
 * @param {string[]} path - Path of ancestor IDs
 * @param {string} linkedUnitId - The unit ID from Units table
 * @param {object} sectionData - Section data structure
 * @returns {object} - Updated section data
 */
export function addLinkedUnitIdToItem(itemId, path, linkedUnitId, sectionData) {
  if (path.length === 0) {
    // Root item
    return {
      ...sectionData,
      items: {
        ...sectionData.items,
        [itemId]: {
          ...sectionData.items[itemId],
          linkedUnitId,
        },
      },
    };
  }

  // Nested item - need to traverse and update
  const rootId = path[0];
  const rootItem = sectionData.items[rootId];

  if (!rootItem) return sectionData;

  // Recursive helper to update nested item
  function updateNested(item, pathSegments) {
    if (pathSegments.length === 0) {
      // We're at the parent level, update the child
      return {
        ...item,
        children: {
          ...item.children,
          [itemId]: {
            ...item.children[itemId],
            linkedUnitId,
          },
        },
      };
    }

    // Keep traversing
    const [nextId, ...restPath] = pathSegments;
    return {
      ...item,
      children: {
        ...item.children,
        [nextId]: updateNested(item.children[nextId], restPath),
      },
    };
  }

  const updatedRoot = updateNested(rootItem, path.slice(1));

  return {
    ...sectionData,
    items: {
      ...sectionData.items,
      [rootId]: updatedRoot,
    },
  };
}
