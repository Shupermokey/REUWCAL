/**
 * Income Statement Data Structure & Helpers
 *
 * Structure:
 * {
 *   Income: {
 *     order: ["gsr", "vacancy", "nri", "parking"],
 *     items: {
 *       gsr: {
 *         id: "gsr",
 *         label: "Gross Scheduled Rent",
 *         grossMonthly: 0,
 *         grossAnnual: 0,
 *         rateMonthly: 0,
 *         rateAnnual: 0,
 *         psfMonthly: 0,
 *         psfAnnual: 0,
 *         punitMonthly: 0,
 *         punitAnnual: 0,
 *         childOrder: [],
 *         children: {}
 *       }
 *     }
 *   }
 * }
 */

/**
 * Generate a unique ID for new items
 */
export function generateId() {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new empty item
 */
export function createItem(label = "New Item", id = null) {
  return {
    id: id || generateId(),
    label,
    grossMonthly: 0,
    grossAnnual: 0,
    rateMonthly: 0,
    rateAnnual: 0,
    psfMonthly: 0,
    psfAnnual: 0,
    punitMonthly: 0,
    punitAnnual: 0,
    childOrder: [],
    children: {},
  };
}

/**
 * Create initial section structure
 */
export function createSection() {
  return {
    order: [],
    items: {},
  };
}

/**
 * Add item to a section (at root level)
 */
export function addItemToSection(section, label) {
  const newItem = createItem(label);
  return {
    ...section,
    order: [...section.order, newItem.id],
    items: {
      ...section.items,
      [newItem.id]: newItem,
    },
  };
}

/**
 * Helper: Recursively find and update an item by path
 */
function updateItemByPath(item, path, updater) {
  if (path.length === 0) {
    return updater(item);
  }

  const [childId, ...restPath] = path;
  const child = item.children[childId];
  if (!child) return item;

  return {
    ...item,
    children: {
      ...item.children,
      [childId]: updateItemByPath(child, restPath, updater),
    },
  };
}

/**
 * Add child item to a parent (works for nested items too)
 * @param {object} section - The section data
 * @param {string} parentId - ID of parent item
 * @param {string} label - Label for new child
 * @param {string[]} path - Path of ancestor IDs leading to parent, empty for root items
 */
export function addChildItem(section, parentId, label, path = []) {
  const newItem = createItem(label);

  // If path is empty, parent is a root item
  if (path.length === 0) {
    const parent = section.items[parentId];
    if (!parent) return section;

    return {
      ...section,
      items: {
        ...section.items,
        [parentId]: {
          ...parent,
          childOrder: [...(parent.childOrder || []), newItem.id],
          children: {
            ...(parent.children || {}),
            [newItem.id]: newItem,
          },
        },
      },
    };
  }

  // Parent is nested, need to traverse the tree
  // path contains ancestors, parentId is the item itself
  const [rootId, ...childPath] = path;
  const rootItem = section.items[rootId];
  if (!rootItem) return section;

  // Build full path to parent: childPath + [parentId]
  const fullPath = [...childPath, parentId];

  const updatedRoot = updateItemByPath(rootItem, fullPath, (parent) => ({
    ...parent,
    childOrder: [...(parent.childOrder || []), newItem.id],
    children: {
      ...(parent.children || {}),
      [newItem.id]: newItem,
    },
  }));

  return {
    ...section,
    items: {
      ...section.items,
      [rootId]: updatedRoot,
    },
  };
}

/**
 * Delete an item from section
 */
export function deleteItem(section, itemId) {
  // Remove from order
  const newOrder = section.order.filter(id => id !== itemId);

  // Remove from items
  const { [itemId]: removed, ...remainingItems } = section.items;

  return {
    order: newOrder,
    items: remainingItems,
  };
}

/**
 * Delete a child item (works for nested items too)
 * @param {object} section - The section data
 * @param {string} itemId - ID of item to delete
 * @param {string[]} path - Path of ancestor IDs, empty for root items
 */
export function deleteChildItem(section, itemId, path = []) {
  // If path is empty, item is a root item
  if (path.length === 0) {
    return deleteItem(section, itemId);
  }

  // Item is nested
  const [rootId, ...childPath] = path;
  const rootItem = section.items[rootId];
  if (!rootItem) return section;

  // If childPath is empty, delete directly from root's children
  if (childPath.length === 0) {
    const newChildOrder = rootItem.childOrder.filter(id => id !== itemId);
    const { [itemId]: removed, ...remainingChildren } = rootItem.children;

    return {
      ...section,
      items: {
        ...section.items,
        [rootId]: {
          ...rootItem,
          childOrder: newChildOrder,
          children: remainingChildren,
        },
      },
    };
  }

  // Need to traverse deeper
  const updatedRoot = updateItemByPath(rootItem, childPath, (parent) => {
    const newChildOrder = parent.childOrder.filter(id => id !== itemId);
    const { [itemId]: removed, ...remainingChildren } = parent.children;

    return {
      ...parent,
      childOrder: newChildOrder,
      children: remainingChildren,
    };
  });

  return {
    ...section,
    items: {
      ...section.items,
      [rootId]: updatedRoot,
    },
  };
}

/**
 * Clone an item
 */
export function cloneItem(section, itemId) {
  const item = section.items[itemId];
  if (!item) return section;

  const clonedItem = {
    ...item,
    id: generateId(),
    label: `${item.label} (Copy)`,
  };

  // Insert after the original
  const index = section.order.indexOf(itemId);
  const newOrder = [
    ...section.order.slice(0, index + 1),
    clonedItem.id,
    ...section.order.slice(index + 1),
  ];

  return {
    order: newOrder,
    items: {
      ...section.items,
      [clonedItem.id]: clonedItem,
    },
  };
}

/**
 * Clone a child item
 */
export function cloneChildItem(section, parentId, childId) {
  const parent = section.items[parentId];
  if (!parent) return section;

  const child = parent.children[childId];
  if (!child) return section;

  const clonedChild = {
    ...child,
    id: generateId(),
    label: `${child.label} (Copy)`,
  };

  const index = parent.childOrder.indexOf(childId);
  const newChildOrder = [
    ...parent.childOrder.slice(0, index + 1),
    clonedChild.id,
    ...parent.childOrder.slice(index + 1),
  ];

  return {
    ...section,
    items: {
      ...section.items,
      [parentId]: {
        ...parent,
        childOrder: newChildOrder,
        children: {
          ...parent.children,
          [clonedChild.id]: clonedChild,
        },
      },
    },
  };
}

/**
 * Update item values
 */
export function updateItem(section, itemId, updates) {
  const item = section.items[itemId];
  if (!item) return section;

  return {
    ...section,
    items: {
      ...section.items,
      [itemId]: {
        ...item,
        ...updates,
      },
    },
  };
}

/**
 * Update child item values
 */
export function updateChildItem(section, parentId, childId, updates) {
  const parent = section.items[parentId];
  if (!parent) return section;

  const child = parent.children[childId];
  if (!child) return section;

  return {
    ...section,
    items: {
      ...section.items,
      [parentId]: {
        ...parent,
        children: {
          ...parent.children,
          [childId]: {
            ...child,
            ...updates,
          },
        },
      },
    },
  };
}

/**
 * Reorder items (for drag & drop)
 */
export function reorderItems(section, fromIndex, toIndex) {
  const newOrder = [...section.order];
  const [movedId] = newOrder.splice(fromIndex, 1);
  newOrder.splice(toIndex, 0, movedId);

  return {
    ...section,
    order: newOrder,
  };
}

/**
 * Calculate sum of all children (recursively)
 */
export function sumChildren(item) {
  if (!item.childOrder || item.childOrder.length === 0) {
    return {
      grossMonthly: item.grossMonthly || 0,
      grossAnnual: item.grossAnnual || 0,
      rateMonthly: item.rateMonthly || 0,
      rateAnnual: item.rateAnnual || 0,
      psfMonthly: item.psfMonthly || 0,
      psfAnnual: item.psfAnnual || 0,
      punitMonthly: item.punitMonthly || 0,
      punitAnnual: item.punitAnnual || 0,
    };
  }

  // Sum all children
  const totals = {
    grossMonthly: 0,
    grossAnnual: 0,
    rateMonthly: 0,
    rateAnnual: 0,
    psfMonthly: 0,
    psfAnnual: 0,
    punitMonthly: 0,
    punitAnnual: 0,
  };

  item.childOrder.forEach(childId => {
    const child = item.children[childId];
    if (child) {
      const childTotals = sumChildren(child);
      Object.keys(totals).forEach(key => {
        totals[key] += childTotals[key];
      });
    }
  });

  return totals;
}
