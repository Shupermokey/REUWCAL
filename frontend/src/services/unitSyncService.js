import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';

/**
 * Unit Sync Service
 * Syncs units between Income Statement and Units table
 */

/**
 * Creates a unit in the Units table and returns the unit ID
 * @param {string} unitType - If null/empty, creates a plain unit row. Otherwise creates under a header.
 */
export async function createLinkedUnit(userId, propertyId, incomeStatementRow, unitType) {
  try {
    console.log('createLinkedUnit called with:', { userId, propertyId, incomeStatementRow, unitType });

    const unitId = `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Determine if this is a plain unit (direct child of GSR) or grouped unit (child of child)
    // Plain unit: unitType is "Gross Scheduled Rent" (meaning parent is GSR)
    // Grouped unit: unitType is the parent unit's label (meaning parent is a unit under GSR)
    const isPlainUnit = !unitType || unitType === '' || unitType === 'Gross Scheduled Rent';

    const newUnit = {
      id: unitId,
      name: incomeStatementRow.label,
      displayName: isPlainUnit ? incomeStatementRow.label : `${unitType} - ${incomeStatementRow.label}`,
      type: isPlainUnit ? null : unitType,
      rent: parseFloat(incomeStatementRow.grossMonthly) || 0,
      sqft: 0,
      tenant: '',
      leaseStart: null,
      leaseEnd: null,
      linkedIncomeStatementRowId: incomeStatementRow.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Created new unit object:', newUnit);

    // Get existing units data
    const unitsRef = doc(db, 'users', userId, 'properties', propertyId, 'details', 'units');
    console.log('Units ref path:', `users/${userId}/properties/${propertyId}/details/units`);

    const unitsDoc = await getDoc(unitsRef);
    console.log('Units doc exists?', unitsDoc.exists());

    let unitsData = unitsDoc.exists() ? unitsDoc.data() : {
      unitMix: [],
      rentRoll: {
        totalMonthlyRent: 0,
        occupancyRate: 100
      }
    };
    console.log('Existing units data:', unitsData);

    // Ensure unitMix exists
    if (!unitsData.unitMix) {
      unitsData.unitMix = [];
    }

    // Ensure rentRoll exists
    if (!unitsData.rentRoll) {
      unitsData.rentRoll = {
        totalMonthlyRent: 0,
        occupancyRate: 100
      };
    }

    if (isPlainUnit) {
      // Create as plain unit row (not grouped)
      const plainUnitGroup = {
        type: null,
        count: 1,
        avgSqFt: newUnit.sqft || 0,
        avgRent: newUnit.rent || 0,
        units: [newUnit]
      };
      unitsData.unitMix.push(plainUnitGroup);
      console.log('Created plain unit row:', plainUnitGroup);
    } else {
      // Find or create unit type group (header)
      let typeGroup = unitsData.unitMix.find(group => group.type === unitType);

      if (!typeGroup) {
        typeGroup = {
          type: unitType,
          count: 0,
          avgSqFt: 0,
          avgRent: 0,
          units: []
        };
        unitsData.unitMix.push(typeGroup);
        console.log('Created new type group:', typeGroup);
      } else {
        console.log('Found existing type group:', typeGroup);
      }

      // Add unit to group
      typeGroup.units.push(newUnit);
      typeGroup.count = typeGroup.units.length;

      // Recalculate averages
      typeGroup.avgRent = typeGroup.units.reduce((sum, u) => sum + (u.rent || 0), 0) / typeGroup.count;
      typeGroup.avgSqFt = typeGroup.units.reduce((sum, u) => sum + (u.sqft || 0), 0) / typeGroup.count;
    }

    console.log('Saving units data:', unitsData);

    // Save to Firestore
    await setDoc(unitsRef, unitsData);

    console.log('Unit created successfully:', { unitId, displayName: newUnit.displayName });
    return { unitId, displayName: newUnit.displayName };
  } catch (error) {
    console.error('Error in createLinkedUnit:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

/**
 * Updates rent in Units table when Income Statement changes
 */
export async function updateLinkedUnitRent(userId, propertyId, linkedUnitId, newRent) {
  const unitsRef = doc(db, 'users', userId, 'properties', propertyId, 'details', 'units');
  const unitsDoc = await getDoc(unitsRef);

  if (!unitsDoc.exists()) return false;

  const unitsData = unitsDoc.data();

  // Find and update unit
  for (let typeGroup of unitsData.unitMix) {
    const unit = typeGroup.units.find(u => u.id === linkedUnitId);
    if (unit) {
      unit.rent = newRent;
      unit.updatedAt = new Date().toISOString();

      // Recalculate average
      typeGroup.avgRent = typeGroup.units.reduce((sum, u) => sum + (u.rent || 0), 0) / typeGroup.count;

      await setDoc(unitsRef, unitsData);
      return true;
    }
  }

  return false;
}

/**
 * Updates unit name in Units table when Income Statement changes
 */
export async function updateLinkedUnitName(userId, propertyId, linkedUnitId, newName) {
  const unitsRef = doc(db, 'users', userId, 'properties', propertyId, 'details', 'units');
  const unitsDoc = await getDoc(unitsRef);

  if (!unitsDoc.exists()) return false;

  const unitsData = unitsDoc.data();

  // Find and update unit
  for (let typeGroup of unitsData.unitMix) {
    const unit = typeGroup.units.find(u => u.id === linkedUnitId);
    if (unit) {
      unit.name = newName;
      unit.displayName = `${unit.type} - ${newName}`;
      unit.updatedAt = new Date().toISOString();

      await setDoc(unitsRef, unitsData);
      return true;
    }
  }

  return false;
}

/**
 * Unlinks unit (removes linkedIncomeStatementRowId but keeps unit in table)
 */
export async function unlinkUnit(userId, propertyId, linkedUnitId) {
  const unitsRef = doc(db, 'users', userId, 'properties', propertyId, 'details', 'units');
  const unitsDoc = await getDoc(unitsRef);

  if (!unitsDoc.exists()) return false;

  const unitsData = unitsDoc.data();

  for (let typeGroup of unitsData.unitMix) {
    const unit = typeGroup.units.find(u => u.id === linkedUnitId);
    if (unit) {
      delete unit.linkedIncomeStatementRowId;
      unit.updatedAt = new Date().toISOString();
      await setDoc(unitsRef, unitsData);
      return true;
    }
  }

  return false;
}

/**
 * Deletes unit from Units table permanently
 */
export async function deleteLinkedUnit(userId, propertyId, linkedUnitId) {
  const unitsRef = doc(db, 'users', userId, 'properties', propertyId, 'details', 'units');
  const unitsDoc = await getDoc(unitsRef);

  if (!unitsDoc.exists()) return false;

  const unitsData = unitsDoc.data();

  for (let i = 0; i < unitsData.unitMix.length; i++) {
    const typeGroup = unitsData.unitMix[i];
    const unitIndex = typeGroup.units.findIndex(u => u.id === linkedUnitId);

    if (unitIndex !== -1) {
      const headerName = typeGroup.type;

      typeGroup.units.splice(unitIndex, 1);
      typeGroup.count = typeGroup.units.length;

      // If this was the last unit in a header, we need to convert back to plain unit
      if (typeGroup.count === 0 && typeGroup.type !== null) {
        console.log('Last unit deleted from header, need to convert to plain unit');

        // Get the header's linkedUnitId from Income Statement
        const incomeRef = doc(db, 'users', userId, 'properties', propertyId, 'incomeStatement', 'current');
        const incomeDoc = await getDoc(incomeRef);

        if (incomeDoc.exists()) {
          const incomeData = incomeDoc.data();
          let headerLinkedUnitId = null;

          // Find the header in Income Statement to get its linkedUnitId
          if (incomeData.Income?.items?.gsr?.children) {
            for (const [childId, child] of Object.entries(incomeData.Income.items.gsr.children)) {
              if (child.label === headerName && !child.isSubtotal) {
                headerLinkedUnitId = child.linkedUnitId || childId;
                break;
              }
            }
          }

          if (headerLinkedUnitId) {
            // Convert to plain unit instead of deleting
            await convertHeaderToPlainUnit(userId, propertyId, headerName, headerLinkedUnitId);
            return true;
          }
        }

        // Fallback: if we couldn't find linkedUnitId, just remove the header
        unitsData.unitMix.splice(i, 1);
      } else if (typeGroup.count > 0) {
        // Recalculate averages
        typeGroup.avgRent = typeGroup.units.reduce((sum, u) => sum + (u.rent || 0), 0) / typeGroup.count;
        typeGroup.avgSqFt = typeGroup.units.reduce((sum, u) => sum + (u.sqft || 0), 0) / typeGroup.count;
      } else if (typeGroup.type === null) {
        // Plain unit - just remove it
        unitsData.unitMix.splice(i, 1);
      }

      await setDoc(unitsRef, unitsData);
      return true;
    }
  }

  return false;
}

/**
 * Gets tenant info for a linked unit (for tooltip display)
 */
export async function getLinkedUnitInfo(userId, propertyId, linkedUnitId) {
  const unitsRef = doc(db, 'users', userId, 'properties', propertyId, 'details', 'units');
  const unitsDoc = await getDoc(unitsRef);

  if (!unitsDoc.exists()) return null;

  const unitsData = unitsDoc.data();

  for (let typeGroup of unitsData.unitMix) {
    const unit = typeGroup.units.find(u => u.id === linkedUnitId);
    if (unit) {
      return {
        tenant: unit.tenant || 'Vacant',
        sqft: unit.sqft || 0,
        rent: unit.rent || 0,
        leaseStart: unit.leaseStart || null,
        leaseEnd: unit.leaseEnd || null,
        displayName: unit.displayName || unit.name,
      };
    }
  }

  return null;
}

/**
 * Creates Income Statement rows from Units table (reverse sync)
 * Creates a Header (unit type) and its child Units in Income Statement
 */
export async function createIncomeStatementFromUnitType(userId, propertyId, unitType, units) {
  try {
    console.log('createIncomeStatementFromUnitType:', { userId, propertyId, unitType, units });

    // Get Income Statement data
    const incomeRef = doc(db, 'users', userId, 'properties', propertyId, 'incomeStatement', 'current');
    const incomeDoc = await getDoc(incomeRef);

    if (!incomeDoc.exists()) {
      throw new Error('Income Statement not found');
    }

    const incomeData = incomeDoc.data();

    if (!incomeData.Income || !incomeData.Income.items || !incomeData.Income.items.gsr) {
      throw new Error('Gross Scheduled Rent section not found');
    }

    const gsr = incomeData.Income.items.gsr;

    // Check if Header (unit type) already exists
    let headerItem = null;
    let headerId = null;

    if (gsr.children) {
      for (const [id, child] of Object.entries(gsr.children)) {
        if (child.label === unitType && !child.isSubtotal) {
          headerItem = child;
          headerId = id;
          break;
        }
      }
    }

    // Create Header if it doesn't exist
    if (!headerItem) {
      headerId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      headerItem = {
        id: headerId,
        label: unitType,
        linkedUnitId: headerId, // Track the header's own ID for conversion back to plain unit
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

      // Add to GSR
      if (!gsr.children) gsr.children = {};
      if (!gsr.childOrder) gsr.childOrder = [];

      gsr.children[headerId] = headerItem;
      gsr.childOrder.push(headerId);
    }

    // Add units as children of the Header
    const unitIds = [];
    for (const unit of units) {
      const unitItemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const unitItem = {
        id: unitItemId,
        label: unit.name,
        linkedUnitId: unit.id,
        grossMonthly: unit.rent || 0,
        grossAnnual: (unit.rent || 0) * 12,
        rateMonthly: 0,
        rateAnnual: 0,
        psfMonthly: 0,
        psfAnnual: 0,
        punitMonthly: 0,
        punitAnnual: 0,
      };

      headerItem.children[unitItemId] = unitItem;
      headerItem.childOrder.push(unitItemId);
      unitIds.push({ unitItemId, unitId: unit.id });
    }

    // Add or update subtotal
    const subtotalId = `subtotal-${headerId}`;
    const existingSubtotalIndex = headerItem.childOrder.findIndex(id =>
      headerItem.children[id]?.isSubtotal
    );

    if (existingSubtotalIndex !== -1) {
      // Remove old subtotal from childOrder
      headerItem.childOrder.splice(existingSubtotalIndex, 1);
    }

    // Add subtotal at the end
    const subtotal = {
      id: subtotalId,
      label: `Subtotal ${unitType}`,
      isSubtotal: true,
      grossMonthly: 0,
      grossAnnual: 0,
      rateMonthly: 0,
      rateAnnual: 0,
      psfMonthly: 0,
      psfAnnual: 0,
      punitMonthly: 0,
      punitAnnual: 0,
    };

    headerItem.children[subtotalId] = subtotal;
    headerItem.childOrder.push(subtotalId);

    // Save Income Statement
    await setDoc(incomeRef, incomeData);

    console.log('Income Statement updated successfully');
    return { headerId, unitIds };
  } catch (error) {
    console.error('Error in createIncomeStatementFromUnitType:', error);
    throw error;
  }
}

/**
 * Updates unit name in Income Statement when changed in Units table
 */
export async function updateIncomeStatementUnitName(userId, propertyId, linkedIncomeStatementRowId, newName) {
  try {
    const incomeRef = doc(db, 'users', userId, 'properties', propertyId, 'incomeStatement', 'current');
    const incomeDoc = await getDoc(incomeRef);

    if (!incomeDoc.exists()) return false;

    const incomeData = incomeDoc.data();

    // Find and update the item (need to traverse the tree)
    let found = false;

    if (incomeData.Income?.items?.gsr?.children) {
      // First check direct children of GSR (plain units)
      for (const [childId, child] of Object.entries(incomeData.Income.items.gsr.children)) {
        if (child.id === linkedIncomeStatementRowId && !child.isSubtotal) {
          child.label = newName;
          found = true;
          break;
        }

        // Then check grandchildren (units within headers)
        if (child.children) {
          for (const [unitId, unit] of Object.entries(child.children)) {
            if (unit.id === linkedIncomeStatementRowId && !unit.isSubtotal) {
              unit.label = newName;
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
    }

    if (found) {
      await setDoc(incomeRef, incomeData);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error updating Income Statement unit name:', error);
    return false;
  }
}

/**
 * Updates unit rent in Income Statement when changed in Units table
 */
export async function updateIncomeStatementUnitRent(userId, propertyId, linkedIncomeStatementRowId, newRent) {
  try {
    const incomeRef = doc(db, 'users', userId, 'properties', propertyId, 'incomeStatement', 'current');
    const incomeDoc = await getDoc(incomeRef);

    if (!incomeDoc.exists()) return false;

    const incomeData = incomeDoc.data();

    // Find and update the item
    let found = false;

    if (incomeData.Income?.items?.gsr?.children) {
      // First check direct children of GSR (plain units)
      for (const [childId, child] of Object.entries(incomeData.Income.items.gsr.children)) {
        if (child.id === linkedIncomeStatementRowId && !child.isSubtotal) {
          child.grossMonthly = newRent;
          child.grossAnnual = newRent * 12;
          found = true;
          break;
        }

        // Then check grandchildren (units within headers)
        if (child.children) {
          for (const [unitId, unit] of Object.entries(child.children)) {
            if (unit.id === linkedIncomeStatementRowId && !unit.isSubtotal) {
              unit.grossMonthly = newRent;
              unit.grossAnnual = newRent * 12;
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
    }

    if (found) {
      await setDoc(incomeRef, incomeData);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error updating Income Statement unit rent:', error);
    return false;
  }
}

/**
 * Deletes unit from Income Statement when deleted in Units table
 */
export async function deleteIncomeStatementUnit(userId, propertyId, linkedIncomeStatementRowId) {
  try {
    const incomeRef = doc(db, 'users', userId, 'properties', propertyId, 'incomeStatement', 'current');
    const incomeDoc = await getDoc(incomeRef);

    if (!incomeDoc.exists()) return false;

    const incomeData = incomeDoc.data();

    // Find and delete the item
    let found = false;

    if (incomeData.Income?.items?.gsr) {
      const gsr = incomeData.Income.items.gsr;

      // First check direct children of GSR (plain units)
      if (gsr.childOrder && gsr.children) {
        const directChildIndex = gsr.childOrder.indexOf(linkedIncomeStatementRowId);
        if (directChildIndex !== -1) {
          // Remove from childOrder
          gsr.childOrder.splice(directChildIndex, 1);
          // Remove from children
          delete gsr.children[linkedIncomeStatementRowId];
          found = true;
        }
      }

      // Then check grandchildren (units within headers)
      if (!found && gsr.children) {
        for (const [headerId, header] of Object.entries(gsr.children)) {
          if (header.children && header.childOrder) {
            const unitIndex = header.childOrder.indexOf(linkedIncomeStatementRowId);
            if (unitIndex !== -1) {
              // Remove from childOrder
              header.childOrder.splice(unitIndex, 1);
              // Remove from children
              delete header.children[linkedIncomeStatementRowId];

              // Check if this was the last child (excluding subtotal) - if so, convert header back to plain unit
              const nonSubtotalChildren = header.childOrder.filter(id => !header.children[id]?.isSubtotal);
              if (nonSubtotalChildren.length === 0) {
                console.log('Last child deleted, converting header back to plain unit');

                // Get or create linkedUnitId for the header
                const headerLinkedUnitId = header.linkedUnitId || headerId;

                delete header.children;
                delete header.childOrder;

                // Set linkedUnitId on the header so it can be tracked
                header.linkedUnitId = headerLinkedUnitId;

                // Also trigger conversion in Units table
                await convertHeaderToPlainUnit(userId, propertyId, header.label, headerLinkedUnitId);
              }

              found = true;
              break;
            }
          }
        }
      }
    }

    if (found) {
      await setDoc(incomeRef, incomeData);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting Income Statement unit:', error);
    return false;
  }
}

/**
 * Updates header/parent name in Income Statement when unit type is renamed in Units table
 * Uses old name to find the header since we don't have linkedUnitId
 */
export async function updateIncomeStatementHeaderName(userId, propertyId, oldName, newName) {
  try {
    const incomeRef = doc(db, 'users', userId, 'properties', propertyId, 'incomeStatement', 'current');
    const incomeDoc = await getDoc(incomeRef);

    if (!incomeDoc.exists()) return false;

    const incomeData = incomeDoc.data();

    // Find the header with the old name (it's a direct child of GSR that has children)
    let found = false;

    if (incomeData.Income?.items?.gsr?.children) {
      for (const [childId, child] of Object.entries(incomeData.Income.items.gsr.children)) {
        if (child.label === oldName && child.children && !child.isSubtotal) {
          // This is the header - update its label
          child.label = newName;
          found = true;
          break;
        }
      }
    }

    if (found) {
      await setDoc(incomeRef, incomeData);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error updating Income Statement header name:', error);
    return false;
  }
}

/**
 * Deletes header and all its children from Income Statement when header is deleted in Units table
 */
export async function deleteIncomeStatementHeader(userId, propertyId, headerName) {
  try {
    const incomeRef = doc(db, 'users', userId, 'properties', propertyId, 'incomeStatement', 'current');
    const incomeDoc = await getDoc(incomeRef);

    if (!incomeDoc.exists()) return false;

    const incomeData = incomeDoc.data();

    // Find the header with this name (it's a direct child of GSR that has children)
    let found = false;

    if (incomeData.Income?.items?.gsr) {
      const gsr = incomeData.Income.items.gsr;

      if (gsr.children && gsr.childOrder) {
        // Find the header by name
        for (const [childId, child] of Object.entries(gsr.children)) {
          if (child.label === headerName && child.children && !child.isSubtotal) {
            // Remove from childOrder
            const headerIndex = gsr.childOrder.indexOf(childId);
            if (headerIndex !== -1) {
              gsr.childOrder.splice(headerIndex, 1);
            }
            // Remove from children
            delete gsr.children[childId];
            found = true;
            break;
          }
        }
      }
    }

    if (found) {
      await setDoc(incomeRef, incomeData);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting Income Statement header:', error);
    return false;
  }
}

/**
 * Deletes header and all its children from Units table when header is deleted in Income Statement
 */
export async function deleteLinkedHeader(userId, propertyId, headerName) {
  try {
    const unitsRef = doc(db, 'users', userId, 'properties', propertyId, 'details', 'units');
    const unitsDoc = await getDoc(unitsRef);

    if (!unitsDoc.exists()) return false;

    const unitsData = unitsDoc.data();

    // Find the header group by type name
    const headerIndex = unitsData.unitMix.findIndex(group => group.type === headerName);

    if (headerIndex === -1) {
      console.log('Header not found in Units table');
      return false;
    }

    // Remove the entire header group (including all children)
    unitsData.unitMix.splice(headerIndex, 1);

    // Save to Firestore
    await setDoc(unitsRef, unitsData);

    console.log('Deleted header from Units table successfully');
    return true;
  } catch (error) {
    console.error('Error deleting header from Units table:', error);
    return false;
  }
}

/**
 * Updates header/parent type name in Units table when changed in Income Statement
 */
export async function updateLinkedHeaderName(userId, propertyId, oldName, newName) {
  try {
    const unitsRef = doc(db, 'users', userId, 'properties', propertyId, 'details', 'units');
    const unitsDoc = await getDoc(unitsRef);

    if (!unitsDoc.exists()) return false;

    const unitsData = unitsDoc.data();

    // Find the header group with the old name
    const headerGroup = unitsData.unitMix.find(group => group.type === oldName);

    if (headerGroup) {
      headerGroup.type = newName;
      await setDoc(unitsRef, unitsData);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error updating Units header name:', error);
    return false;
  }
}

/**
 * Converts a header back to a plain unit in Income Statement when all children are deleted
 */
export async function convertIncomeStatementHeaderToPlainUnit(userId, propertyId, headerLabel) {
  try {
    const incomeRef = doc(db, 'users', userId, 'properties', propertyId, 'incomeStatement', 'current');
    const incomeDoc = await getDoc(incomeRef);

    if (!incomeDoc.exists()) return false;

    const incomeData = incomeDoc.data();

    // Find the header in GSR children
    let found = false;

    if (incomeData.Income?.items?.gsr?.children) {
      for (const [childId, child] of Object.entries(incomeData.Income.items.gsr.children)) {
        if (child.label === headerLabel && child.children && !child.isSubtotal) {
          // Convert header to plain unit by removing children structure
          delete child.children;
          delete child.childOrder;
          found = true;
          break;
        }
      }
    }

    if (found) {
      await setDoc(incomeRef, incomeData);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error converting Income Statement header to plain unit:', error);
    return false;
  }
}

/**
 * Converts a header back to a plain unit when all children are deleted
 * This is the reverse of transformUnitToHeader
 */
export async function convertHeaderToPlainUnit(userId, propertyId, headerName, linkedUnitId) {
  try {
    console.log('convertHeaderToPlainUnit:', { userId, propertyId, headerName, linkedUnitId });

    const unitsRef = doc(db, 'users', userId, 'properties', propertyId, 'details', 'units');
    const unitsDoc = await getDoc(unitsRef);

    if (!unitsDoc.exists()) return false;

    const unitsData = unitsDoc.data();

    // Find the header group by type name
    const headerIndex = unitsData.unitMix.findIndex(group => group.type === headerName);

    if (headerIndex === -1) {
      console.log('Header not found');
      return false;
    }

    // Remove the header group
    unitsData.unitMix.splice(headerIndex, 1);

    // Create a new plain unit entry (type = null, single unit in array)
    const plainUnitGroup = {
      type: null,
      count: 1,
      avgRent: 0,
      avgSqFt: 0,
      units: [{
        id: linkedUnitId,
        name: headerName, // Use the header name as the unit name
        displayName: headerName,
        type: null,
        tenant: 'Vacant',
        rent: 0,
        sqft: 0,
        leaseStart: '',
        leaseEnd: '',
        linkedIncomeStatementRowId: linkedUnitId, // Keep the same ID
      }]
    };

    unitsData.unitMix.push(plainUnitGroup);

    // Save to Firestore
    await setDoc(unitsRef, unitsData);

    console.log('Converted header to plain unit successfully');
    return true;
  } catch (error) {
    console.error('Error converting header to plain unit:', error);
    return false;
  }
}

/**
 * Adds children to a plain unit in Income Statement (converting it to a header)
 * This is triggered when converting a plain unit to header from Units dropdown
 */
export async function addChildrenToIncomeStatementUnit(userId, propertyId, parentLabel, childNames) {
  try {
    const incomeRef = doc(db, 'users', userId, 'properties', propertyId, 'incomeStatement', 'current');
    const incomeDoc = await getDoc(incomeRef);

    if (!incomeDoc.exists()) return false;

    const incomeData = incomeDoc.data();

    // Find the plain unit in GSR children by label
    let parentItem = null;
    let parentId = null;

    if (incomeData.Income?.items?.gsr?.children) {
      for (const [childId, child] of Object.entries(incomeData.Income.items.gsr.children)) {
        if (child.label === parentLabel && !child.children && !child.isSubtotal) {
          parentItem = child;
          parentId = childId;
          break;
        }
      }
    }

    if (!parentItem) {
      console.log('Plain unit not found in Income Statement');
      return false;
    }

    // Initialize children structure
    parentItem.children = {};
    parentItem.childOrder = [];

    // Ensure the parent has a linkedUnitId (it should already, but make sure)
    if (!parentItem.linkedUnitId) {
      parentItem.linkedUnitId = parentId;
    }

    const childUnits = []; // Track created children for return

    // Add each child
    for (const childName of childNames) {
      const childId = `child-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create unit ID that will be used in Units table
      const unitId = `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      parentItem.children[childId] = {
        id: childId,
        label: childName,
        linkedUnitId: unitId, // Link to Units table
        rateMonthly: 0,
        grossMonthly: 0,
        grossAnnual: 0,
        psfMonthly: 0,
        psfAnnual: 0,
        punitMonthly: 0,
        punitAnnual: 0,
      };
      parentItem.childOrder.push(childId);

      // Track for return
      childUnits.push({
        incomeStatementId: childId,
        unitId: unitId,
        name: childName,
      });
    }

    // Add subtotal
    const subtotalId = `subtotal-${Date.now()}`;
    parentItem.children[subtotalId] = {
      id: subtotalId,
      label: `${parentLabel} Subtotal`,
      isSubtotal: true,
      rateMonthly: 0,
      grossMonthly: 0,
      grossAnnual: 0,
      psfMonthly: 0,
      psfAnnual: 0,
      punitMonthly: 0,
      punitAnnual: 0,
    };
    parentItem.childOrder.push(subtotalId);

    await setDoc(incomeRef, incomeData);
    return { success: true, childUnits };
  } catch (error) {
    console.error('Error adding children to Income Statement unit:', error);
    return false;
  }
}

/**
 * Transforms a plain unit into a header with children when sub-units are added
 * This happens when you add children to a unit in Income Statement
 */
export async function transformUnitToHeader(userId, propertyId, parentUnitId, parentLabel) {
  try {
    console.log('transformUnitToHeader:', { userId, propertyId, parentUnitId, parentLabel });

    const unitsRef = doc(db, 'users', userId, 'properties', propertyId, 'details', 'units');
    const unitsDoc = await getDoc(unitsRef);

    if (!unitsDoc.exists()) return false;

    const unitsData = unitsDoc.data();

    // Find the plain unit entry
    const plainUnitIndex = unitsData.unitMix.findIndex(
      group => group.type === null && group.units[0]?.id === parentUnitId
    );

    if (plainUnitIndex === -1) {
      console.log('Plain unit not found');
      return false;
    }

    const plainUnit = unitsData.unitMix[plainUnitIndex].units[0];

    // Transform: Remove from plain units, create as header
    unitsData.unitMix.splice(plainUnitIndex, 1);

    // Create new header group
    const headerGroup = {
      type: parentLabel, // Use parent's label as the type name
      count: 0, // Will be updated when children are added
      avgRent: 0,
      avgSqFt: 0,
      units: [], // Children will be added separately
    };

    unitsData.unitMix.push(headerGroup);

    // Save to Firestore
    await setDoc(unitsRef, unitsData);

    console.log('Transformed plain unit to header successfully');
    return true;
  } catch (error) {
    console.error('Error transforming unit to header:', error);
    return false;
  }
}

/**
 * Auto-generates units when total units value is entered in Row.jsx
 * Creates individual plain unit rows (not grouped under a header)
 * @param {number} grossScheduledRent - Annual gross scheduled rent (from incomeStatement field)
 */
export async function autoGenerateUnits(userId, propertyId, totalUnits, grossScheduledRent, grossBuildingArea) {
  try {
    console.log('autoGenerateUnits:', { userId, propertyId, totalUnits, grossScheduledRent, grossBuildingArea });

    if (totalUnits <= 0 || totalUnits > 15) {
      return { tooMany: totalUnits > 15, totalUnits };
    }

    // Get existing units data
    const unitsRef = doc(db, 'users', userId, 'properties', propertyId, 'details', 'units');
    const unitsDoc = await getDoc(unitsRef);

    let unitsData = unitsDoc.exists() ? unitsDoc.data() : {
      unitMix: [],
      rentRoll: {
        totalMonthlyRent: 0,
        occupancyRate: 100
      }
    };

    // Calculate evenly distributed assumptions
    // grossScheduledRent is ANNUAL, so divide by 12 to get monthly, then divide by units
    const avgRentMonthly = grossScheduledRent > 0 ? Math.round((grossScheduledRent / 12 / totalUnits) * 100) / 100 : 0;
    const avgRentAnnual = grossScheduledRent > 0 ? Math.round((grossScheduledRent / totalUnits) * 100) / 100 : 0;
    const avgSqFt = grossBuildingArea > 0 ? Math.round(grossBuildingArea / totalUnits) : 0;

    // Create individual plain unit rows (no header/type grouping)
    const units = [];
    for (let i = 1; i <= totalUnits; i++) {
      const unitId = `unit-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      const unit = {
        id: unitId,
        name: `Unit ${i}`,
        displayName: `Unit ${i}`,
        type: null, // No type - standalone unit
        rent: avgRentMonthly, // Monthly rent per unit
        sqft: avgSqFt,
        tenant: '',
        leaseStart: null,
        leaseEnd: null,
        linkedIncomeStatementRowId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      units.push(unit);

      // Add as individual entry in unitMix (not grouped)
      unitsData.unitMix.push({
        type: null,
        count: 1,
        avgRent: avgRentMonthly,
        avgSqFt: avgSqFt,
        units: [unit],
      });
    }

    // Update rent roll (total monthly rent)
    unitsData.rentRoll.totalMonthlyRent = avgRentMonthly * totalUnits;

    // Save to Firestore
    await setDoc(unitsRef, unitsData);

    // Sync each unit individually to Income Statement (as direct children of GSR)
    const incomeRef = doc(db, 'users', userId, 'properties', propertyId, 'incomeStatement', 'current');
    const incomeDoc = await getDoc(incomeRef);

    if (!incomeDoc.exists()) {
      console.error('Income Statement does not exist for property:', propertyId);
      throw new Error('Income Statement not found. Please open the Income Statement first.');
    }

    const incomeData = incomeDoc.data();

    if (!incomeData.Income?.items?.gsr) {
      console.error('GSR not found in Income Statement');
      throw new Error('Gross Scheduled Rent section not found in Income Statement');
    }

    const gsr = incomeData.Income.items.gsr;

    if (!gsr.children) gsr.children = {};
    if (!gsr.childOrder) gsr.childOrder = [];

    // Add each unit as a direct child of GSR
    for (const unit of units) {
      const unitItemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const unitItem = {
        id: unitItemId,
        label: unit.name,
        linkedUnitId: unit.id,
        grossMonthly: unit.rent || 0, // Monthly rent per unit
        grossAnnual: avgRentAnnual || 0, // Annual rent per unit
        rateMonthly: 0,
        rateAnnual: 0,
        psfMonthly: 0,
        psfAnnual: 0,
        punitMonthly: 0,
        punitAnnual: 0,
      };

      gsr.children[unitItemId] = unitItem;
      gsr.childOrder.push(unitItemId);

      // Update unit with linkedIncomeStatementRowId
      unit.linkedIncomeStatementRowId = unitItemId;
    }

    // Update GSR total to match the sum of children
    gsr.grossAnnual = grossScheduledRent;
    gsr.grossMonthly = Math.round((grossScheduledRent / 12) * 100) / 100;

    // Save Income Statement
    console.log('Saving Income Statement with units:', gsr.childOrder);
    await setDoc(incomeRef, incomeData);

    // Update units data with linkedIncomeStatementRowIds
    await setDoc(unitsRef, unitsData);

    console.log('Auto-generated units successfully');
    return { success: true, totalUnits, avgRent: avgRentMonthly, avgSqFt };
  } catch (error) {
    console.error('Error in autoGenerateUnits:', error);
    throw error;
  }
}
