import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';
import { useAuth } from "@/app/providers/AuthProvider";
import { useDialog } from "@/app/providers/DialogProvider";
import { useUnits } from "@/hooks/useUnits";
import {
  createUnitType,
  calculateTotalUnits,
  calculateAvgSqFt,
  calculateAvgRent,
} from "@/utils/units/unitsDefaults";
import {
  createIncomeStatementFromUnitType,
  updateIncomeStatementUnitName,
  updateIncomeStatementUnitRent,
  deleteIncomeStatementUnit,
  updateIncomeStatementHeaderName,
  deleteIncomeStatementHeader,
  addChildrenToIncomeStatementUnit,
} from "@/services/unitSyncService";
import "@/styles/components/Units/Units.css";

/**
 * Units Detail Panel
 */
export default function Units({ propertyId, onTotalUnitsChange }) {
  const { user } = useAuth();
  const { prompt, promptMultiple } = useDialog();
  const { data, setData, loading, save } = useUnits(user.uid, propertyId);
  const [expandedTypes, setExpandedTypes] = useState({}); // Track which unit types are expanded
  const onTotalUnitsChangeRef = useRef(onTotalUnitsChange);
  const prevTotalUnitsRef = useRef();

  // Keep ref up to date
  useEffect(() => {
    onTotalUnitsChangeRef.current = onTotalUnitsChange;
  }, [onTotalUnitsChange]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!data?.unitMix) return { totalUnits: 0, avgSqFt: 0, avgRent: 0 };

    return {
      totalUnits: calculateTotalUnits(data.unitMix),
      avgSqFt: calculateAvgSqFt(data.unitMix),
      avgRent: calculateAvgRent(data.unitMix),
    };
  }, [data?.unitMix]);

  // Notify parent when total units change (only if actually changed)
  useEffect(() => {
    if (totals.totalUnits !== prevTotalUnitsRef.current) {
      prevTotalUnitsRef.current = totals.totalUnits;
      if (onTotalUnitsChangeRef.current && totals.totalUnits !== undefined) {
        onTotalUnitsChangeRef.current(totals.totalUnits);
      }
    }
  }, [totals.totalUnits]);

  // Toggle unit type expansion
  const toggleExpanded = useCallback((type) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, []);

  // Update unit type name
  const updateUnitTypeName = useCallback(async (oldType, newType) => {
    setData(prev => ({
      ...prev,
      unitMix: prev.unitMix.map(group =>
        group.type === oldType
          ? { ...group, type: newType }
          : group
      )
    }));

    // Update expanded state to use new name
    setExpandedTypes(prev => {
      const updated = { ...prev };
      if (updated[oldType] !== undefined) {
        updated[newType] = updated[oldType];
        delete updated[oldType];
      }
      return updated;
    });

    // Sync to Income Statement
    if (user && propertyId) {
      try {
        await updateIncomeStatementHeaderName(user.uid, propertyId, oldType, newType);
      } catch (error) {
        console.error('Error syncing header name to Income Statement:', error);
      }
    }
  }, [setData, user, propertyId]);

  // Update field
  const updateField = useCallback(
    (field, value) => {
      setData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [setData]
  );

  // Update unit mix item
  const updateUnitMixItem = useCallback(
    (index, field, value) => {
      setData((prev) => {
        const newUnitMix = [...prev.unitMix];
        newUnitMix[index] = {
          ...newUnitMix[index],
          [field]: value,
        };
        return {
          ...prev,
          unitMix: newUnitMix,
        };
      });
    },
    [setData]
  );

  // Add unit type (Header) with required child units
  const addUnitType = useCallback(async () => {
    // First prompt for unit type name (header)
    const typeName = await prompt({
      title: "New Unit Type",
      message: "Enter the unit type name (e.g., Studio, One Bedroom)",
      placeholder: "e.g., Studio",
    });

    if (!typeName || typeName.trim() === '') return;

    // Then prompt for initial units (at least one required)
    const unitNames = await promptMultiple({
      title: "Add Units",
      message: `Add units to "${typeName}" (at least 1 required)`,
      fields: [
        { label: "First Unit", placeholder: "e.g., Unit 1" },
        { label: "Second Unit (optional)", placeholder: "e.g., Unit 2" },
      ],
      maxFields: 10,
    });

    if (!unitNames || unitNames.length === 0) {
      alert("Please add at least 1 unit to create this unit type.");
      return;
    }

    // Create the new unit type with initial units
    const newUnits = unitNames.map((name, index) => ({
      id: `unit-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      displayName: `${typeName.trim()} - ${name.trim()}`,
      type: typeName.trim(),
      rent: 0,
      sqft: 0,
      tenant: '',
      leaseStart: null,
      leaseEnd: null,
      linkedIncomeStatementRowId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const newUnitType = {
      type: typeName.trim(),
      count: newUnits.length,
      avgRent: 0,
      avgSqFt: 0,
      units: newUnits,
    };

    // Sync to Income Statement BEFORE updating local state
    try {
      const { headerId, unitIds } = await createIncomeStatementFromUnitType(
        user.uid,
        propertyId,
        typeName.trim(),
        newUnits
      );

      // Update units with linkedIncomeStatementRowId
      unitIds.forEach(({ unitItemId, unitId }) => {
        const unit = newUnits.find(u => u.id === unitId);
        if (unit) {
          unit.linkedIncomeStatementRowId = unitItemId;
        }
      });

      // Update local state
      setData((prev) => ({
        ...prev,
        unitMix: [...prev.unitMix, newUnitType],
      }));

      // Auto-expand the newly created type
      setExpandedTypes(prev => ({
        ...prev,
        [typeName.trim()]: true,
      }));

      toast.success(`Created "${typeName}" with ${newUnits.length} unit${newUnits.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error syncing to Income Statement:', error);
      toast.error('Failed to sync to Income Statement');
    }
  }, [setData, prompt, promptMultiple, user, propertyId]);

  // Add standalone unit (plain unit row, not under a header)
  const addStandaloneUnit = useCallback(async () => {
    const unitName = await prompt({
      title: "New Unit",
      message: "Enter the unit name",
      placeholder: "e.g., Unit 1",
    });

    if (!unitName || unitName.trim() === '') return;

    const newUnit = {
      id: `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: unitName.trim(),
      displayName: unitName.trim(),
      type: null, // No type - standalone
      rent: 0,
      sqft: 0,
      tenant: '',
      leaseStart: null,
      leaseEnd: null,
      linkedIncomeStatementRowId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Sync to Income Statement BEFORE updating local state
    try {
      // Create as direct child of GSR
      const incomeRef = doc(db, 'users', user.uid, 'properties', propertyId, 'incomeStatement', 'current');
      const incomeDoc = await getDoc(incomeRef);

      if (incomeDoc.exists()) {
        const incomeData = incomeDoc.data();

        if (incomeData.Income?.items?.gsr) {
          const gsr = incomeData.Income.items.gsr;

          if (!gsr.children) gsr.children = {};
          if (!gsr.childOrder) gsr.childOrder = [];

          const unitItemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const unitItem = {
            id: unitItemId,
            label: newUnit.name,
            linkedUnitId: newUnit.id,
            grossMonthly: 0,
            grossAnnual: 0,
            rateMonthly: 0,
            rateAnnual: 0,
            psfMonthly: 0,
            psfAnnual: 0,
            punitMonthly: 0,
            punitAnnual: 0,
          };

          gsr.children[unitItemId] = unitItem;
          gsr.childOrder.push(unitItemId);

          // Save Income Statement
          await setDoc(incomeRef, incomeData);

          // Update unit with linkedIncomeStatementRowId
          newUnit.linkedIncomeStatementRowId = unitItemId;
        }
      }

      // Add to Units table
      setData((prev) => ({
        ...prev,
        unitMix: [...prev.unitMix, {
          type: null,
          count: 1,
          avgRent: 0,
          avgSqFt: 0,
          units: [newUnit],
        }],
      }));

      toast.success(`Created ${unitName}`);
    } catch (error) {
      console.error('Error creating standalone unit:', error);
      toast.error('Failed to create unit');
    }
  }, [setData, prompt, user, propertyId]);

  // Remove unit type
  const removeUnitType = useCallback(
    async (index) => {
      const typeGroup = data.unitMix[index];

      // Confirm deletion
      const confirmed = window.confirm(
        `Delete "${typeGroup.type}" and all ${typeGroup.count} units under it?`
      );

      if (!confirmed) return;

      // Sync delete to Income Statement if it's a header (not plain unit)
      if (typeGroup.type !== null && user && propertyId) {
        try {
          await deleteIncomeStatementHeader(user.uid, propertyId, typeGroup.type);
        } catch (error) {
          console.error('Error syncing header delete to Income Statement:', error);
          toast.error('Failed to sync delete to Income Statement');
          return; // Don't delete from Units if sync failed
        }
      }

      setData((prev) => ({
        ...prev,
        unitMix: prev.unitMix.filter((_, i) => i !== index),
      }));

      toast.success(`Deleted "${typeGroup.type}" and all units`);
    },
    [setData, data, user, propertyId]
  );

  // Add unit to a type group
  const addUnitToType = useCallback(async (typeIndex) => {
    const typeGroup = data.unitMix[typeIndex];
    const unitNumber = typeGroup.units.length + 1;

    const newUnit = {
      id: `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Unit ${unitNumber}`,
      displayName: `${typeGroup.type} - Unit ${unitNumber}`,
      type: typeGroup.type,
      rent: 0,
      sqft: 0,
      tenant: '',
      leaseStart: null,
      leaseEnd: null,
      linkedIncomeStatementRowId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Sync to Income Statement
    try {
      const { unitIds } = await createIncomeStatementFromUnitType(
        user.uid,
        propertyId,
        typeGroup.type,
        [newUnit]
      );

      // Update with linkedIncomeStatementRowId
      if (unitIds && unitIds.length > 0) {
        newUnit.linkedIncomeStatementRowId = unitIds[0].unitItemId;
      }

      setData((prev) => {
        const newUnitMix = [...prev.unitMix];
        const currentTypeGroup = newUnitMix[typeIndex];

        currentTypeGroup.units.push(newUnit);
        currentTypeGroup.count = currentTypeGroup.units.length;

        // Recalculate averages
        currentTypeGroup.avgRent = currentTypeGroup.units.reduce((sum, u) => sum + (u.rent || 0), 0) / currentTypeGroup.count;
        currentTypeGroup.avgSqFt = currentTypeGroup.units.reduce((sum, u) => sum + (u.sqft || 0), 0) / currentTypeGroup.count;

        return {
          ...prev,
          unitMix: newUnitMix,
        };
      });

      toast.success(`Added ${newUnit.name} to ${typeGroup.type}`);
    } catch (error) {
      console.error('Error syncing unit to Income Statement:', error);
      toast.error('Failed to sync to Income Statement');
    }
  }, [setData, data, user, propertyId]);

  // Update unit field
  const updateUnit = useCallback(async (typeIndex, unitId, field, value) => {
    const typeGroup = data.unitMix[typeIndex];
    const unit = typeGroup.units.find(u => u.id === unitId);

    if (!unit) return;

    // Sync name changes to Income Statement
    if (field === 'name' && unit.linkedIncomeStatementRowId) {
      try {
        await updateIncomeStatementUnitName(user.uid, propertyId, unit.linkedIncomeStatementRowId, value);
      } catch (error) {
        console.error('Error syncing name to Income Statement:', error);
      }
    }

    // Sync rent changes to Income Statement
    if (field === 'rent' && unit.linkedIncomeStatementRowId) {
      try {
        await updateIncomeStatementUnitRent(user.uid, propertyId, unit.linkedIncomeStatementRowId, parseFloat(value) || 0);
      } catch (error) {
        console.error('Error syncing rent to Income Statement:', error);
      }
    }

    setData((prev) => {
      const newUnitMix = [...prev.unitMix];
      const currentTypeGroup = newUnitMix[typeIndex];
      const currentUnit = currentTypeGroup.units.find(u => u.id === unitId);

      if (currentUnit) {
        currentUnit[field] = value;
        currentUnit.updatedAt = new Date().toISOString();

        // Recalculate averages if rent or sqft changed
        if (field === 'rent' || field === 'sqft') {
          currentTypeGroup.avgRent = currentTypeGroup.units.reduce((sum, u) => sum + (parseFloat(u.rent) || 0), 0) / currentTypeGroup.count;
          currentTypeGroup.avgSqFt = currentTypeGroup.units.reduce((sum, u) => sum + (parseFloat(u.sqft) || 0), 0) / currentTypeGroup.count;
        }
      }

      return {
        ...prev,
        unitMix: newUnitMix,
      };
    });
  }, [setData, data, user, propertyId]);

  // Remove unit from type group
  const removeUnit = useCallback(async (typeIndex, unitId) => {
    const typeGroup = data.unitMix[typeIndex];
    const unit = typeGroup.units.find(u => u.id === unitId);

    if (!unit) return;

    const unitName = unit.name;

    // Sync delete to Income Statement if linked
    if (unit.linkedIncomeStatementRowId && user && propertyId) {
      try {
        await deleteIncomeStatementUnit(user.uid, propertyId, unit.linkedIncomeStatementRowId);
      } catch (error) {
        console.error('Error syncing delete to Income Statement:', error);
        toast.error('Failed to sync delete to Income Statement');
        return; // Don't delete from Units if sync failed
      }
    }

    // Update local state to remove the unit
    // Note: If this is the last unit in a header, deleteIncomeStatementUnit will trigger
    // convertHeaderToPlainUnit which updates Firestore, and the listener will update our state.
    // So we don't need to handle that case here - just remove the unit and let the listener handle conversion.
    setData((prev) => {
      const newUnitMix = [...prev.unitMix];
      const currentTypeGroup = newUnitMix[typeIndex];

      // Remove the unit from the group
      currentTypeGroup.units = currentTypeGroup.units.filter(u => u.id !== unitId);
      currentTypeGroup.count = currentTypeGroup.units.length;

      // If this is a plain unit (type === null) and it's now empty, remove the group
      if (currentTypeGroup.count === 0 && currentTypeGroup.type === null) {
        newUnitMix.splice(typeIndex, 1);
      } else if (currentTypeGroup.count === 0 && currentTypeGroup.type !== null) {
        // This was the last unit in a header - the Income Statement sync will handle conversion
        // via convertHeaderToPlainUnit, which will update Firestore and trigger our listener.
        // For immediate UI feedback, we'll remove it now and let the listener add back the plain unit.
        newUnitMix.splice(typeIndex, 1);
      } else if (currentTypeGroup.count > 0) {
        // Recalculate averages
        currentTypeGroup.avgRent = currentTypeGroup.units.reduce((sum, u) => sum + (u.rent || 0), 0) / currentTypeGroup.count;
        currentTypeGroup.avgSqFt = currentTypeGroup.units.reduce((sum, u) => sum + (u.sqft || 0), 0) / currentTypeGroup.count;
      }

      return {
        ...prev,
        unitMix: newUnitMix,
      };
    });

    toast.success(`Deleted ${unitName}`);
  }, [setData, data, user, propertyId]);

  // Convert plain unit to header
  const convertPlainUnitToHeader = useCallback(async (typeIndex) => {
    const typeGroup = data.unitMix[typeIndex];
    const unit = typeGroup.units[0]; // Plain unit only has one unit in array

    if (!unit) return;

    // Prompt for child unit names (at least 1 required)
    const childNames = await promptMultiple({
      title: "Convert to Unit Type",
      message: `Add sub-units to "${unit.name}" (at least 1 required)`,
      fields: [
        { label: "First Sub-Unit", placeholder: "e.g., Unit 1A" },
        { label: "Second Sub-Unit (optional)", placeholder: "e.g., Unit 1B" },
      ],
      maxFields: 10,
    });

    if (!childNames || childNames.length === 0) {
      toast.error("At least 1 sub-unit required");
      return;
    }

    try {
      // Sync to Income Statement first (add children to the unit) and get the unit IDs
      let childUnits = [];
      if (user && propertyId) {
        const result = await addChildrenToIncomeStatementUnit(user.uid, propertyId, unit.name, childNames);
        if (result && result.success) {
          childUnits = result.childUnits;
        } else {
          toast.error('Failed to create children in Income Statement');
          return;
        }
      }

      // Transform in Units table
      setData(prev => {
        const newUnitMix = [...prev.unitMix];

        // Remove the plain unit group
        newUnitMix.splice(typeIndex, 1);

        // Create new header group with children using the IDs from Income Statement
        const headerGroup = {
          type: unit.name, // Use the unit name as the header type
          count: childUnits.length,
          avgRent: 0,
          avgSqFt: 0,
          units: childUnits.map(child => ({
            id: child.unitId, // Use the ID from Income Statement
            name: child.name,
            displayName: `${unit.name} - ${child.name}`,
            type: unit.name,
            tenant: 'Vacant',
            rent: 0,
            sqft: 0,
            leaseStart: '',
            leaseEnd: '',
            linkedIncomeStatementRowId: child.incomeStatementId, // Link back to Income Statement
          }))
        };

        newUnitMix.push(headerGroup);

        return {
          ...prev,
          unitMix: newUnitMix,
        };
      });

      // Expand the new header
      setExpandedTypes(prev => ({
        ...prev,
        [unit.name]: true,
      }));

      toast.success(`Converted "${unit.name}" to header with ${childNames.length} sub-units`);
    } catch (error) {
      console.error('Error converting plain unit to header:', error);
      toast.error('Failed to convert to header');
    }
  }, [data, user, propertyId, promptMultiple, setData]);

  // Handle save
  const handleSave = async () => {
    try {
      await save();
      toast.success("✅ Units saved");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("❌ Save failed");
    }
  };

  if (loading) {
    return (
      <div className="units-wrapper">
        <div className="units-panel">Loading...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="units-wrapper">
      <div className="units-panel">
        {/* Header */}
        <div className="units-header">
          <h2>Units</h2>
          <button className="units-save-btn" onClick={handleSave}>
            💾 Save
          </button>
        </div>

        {/* Unit Mix Section */}
        <section className="units-section">
          <div className="units-section-header">
            <h3>Unit Mix</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="units-add-btn" onClick={addStandaloneUnit}>
                ➕ Add Unit
              </button>
              <button className="units-add-btn" onClick={addUnitType}>
                ➕ Add Unit Type
              </button>
            </div>
          </div>

          <div className="units-mix-grid">
            {data.unitMix.map((typeGroup, index) => {
              const isPlainUnit = typeGroup.type === null;
              const unit = isPlainUnit ? typeGroup.units[0] : null;

              // Render plain units differently
              if (isPlainUnit && unit) {
                return (
                  <div key={index} className="units-plain-unit-row">
                    <div className="units-list-row">
                      <div className="units-list-col-name">
                        <input
                          type="text"
                          className="units-inline-input"
                          value={unit.name || ''}
                          onChange={(e) => updateUnit(index, unit.id, 'name', e.target.value)}
                          placeholder="Unit name"
                        />
                      </div>
                      <div className="units-list-col">
                        <input
                          type="text"
                          className="units-inline-input"
                          value={unit.tenant || ''}
                          onChange={(e) => updateUnit(index, unit.id, 'tenant', e.target.value)}
                          placeholder="Vacant"
                        />
                      </div>
                      <div className="units-list-col">
                        <input
                          type="number"
                          className="units-inline-input units-inline-input-number"
                          value={unit.rent || ''}
                          onChange={(e) => updateUnit(index, unit.id, 'rent', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="units-list-col">
                        <input
                          type="number"
                          className="units-inline-input units-inline-input-number"
                          value={unit.sqft || ''}
                          onChange={(e) => updateUnit(index, unit.id, 'sqft', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="units-list-col-lease">
                        <input
                          type="date"
                          className="units-inline-input units-inline-input-date"
                          value={unit.leaseStart || ''}
                          onChange={(e) => updateUnit(index, unit.id, 'leaseStart', e.target.value)}
                        />
                      </div>
                      <div className="units-list-col-lease">
                        <input
                          type="date"
                          className="units-inline-input units-inline-input-date"
                          value={unit.leaseEnd || ''}
                          onChange={(e) => updateUnit(index, unit.id, 'leaseEnd', e.target.value)}
                        />
                      </div>
                      <div className="units-list-col-actions">
                        {unit.linkedIncomeStatementRowId && (
                          <span className="units-linked-badge" title="Linked to Income Statement">
                            🔗
                          </span>
                        )}
                        <button
                          className="units-action-btn"
                          onClick={() => convertPlainUnitToHeader(index)}
                          title="Convert to header with sub-units"
                          style={{ marginRight: '4px' }}
                        >
                          📁
                        </button>
                        <button
                          className="units-delete-unit-btn"
                          onClick={() => removeUnit(index, unit.id)}
                          title="Delete unit"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Render grouped units (with header/type)
              return (
              <div key={index} className="units-type-group">
                {/* Unit Type Header */}
                <div className="units-type-header">
                  <div className="units-type-header-left">
                    <span
                      className="units-type-expand-icon"
                      onClick={() => toggleExpanded(typeGroup.type)}
                      style={{ cursor: 'pointer' }}
                    >
                      {expandedTypes[typeGroup.type] ? '▼' : '▶'}
                    </span>
                    <input
                      type="text"
                      className="units-type-name-input"
                      value={typeGroup.type || ''}
                      onChange={(e) => updateUnitTypeName(typeGroup.type, e.target.value)}
                      placeholder={`Unit Type ${index + 1}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="units-type-count">
                      ({typeGroup.count} unit{typeGroup.count !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="units-type-summary" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {typeGroup.avgSqFt > 0 && (
                      <span className="units-type-stat">
                        {typeGroup.avgSqFt.toLocaleString()} sq ft avg
                      </span>
                    )}
                    {typeGroup.avgRent > 0 && (
                      <span className="units-type-stat">
                        ${typeGroup.avgRent.toLocaleString()}/mo avg
                      </span>
                    )}
                    <button
                      className="units-delete-unit-btn"
                      onClick={() => removeUnitType(index)}
                      title="Delete entire unit type and all units"
                      style={{ marginLeft: '8px' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Individual Units (when expanded) */}
                {expandedTypes[typeGroup.type] && (
                  <div className="units-list">
                    <div className="units-list-header">
                      <div className="units-list-col-name">Unit Name</div>
                      <div className="units-list-col">Tenant</div>
                      <div className="units-list-col">Rent</div>
                      <div className="units-list-col">Sq Ft</div>
                      <div className="units-list-col-lease">Lease Start</div>
                      <div className="units-list-col-lease">Lease End</div>
                      <div className="units-list-col-actions">Actions</div>
                    </div>
                    {typeGroup.units && typeGroup.units.map((unit) => (
                      <div key={unit.id} className="units-list-row">
                        <div className="units-list-col-name">
                          <input
                            type="text"
                            className="units-inline-input"
                            value={unit.name || ''}
                            onChange={(e) => updateUnit(index, unit.id, 'name', e.target.value)}
                            placeholder="Unit name"
                          />
                        </div>
                        <div className="units-list-col">
                          <input
                            type="text"
                            className="units-inline-input"
                            value={unit.tenant || ''}
                            onChange={(e) => updateUnit(index, unit.id, 'tenant', e.target.value)}
                            placeholder="Vacant"
                          />
                        </div>
                        <div className="units-list-col">
                          <input
                            type="number"
                            className="units-inline-input units-inline-input-number"
                            value={unit.rent || ''}
                            onChange={(e) => updateUnit(index, unit.id, 'rent', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                            step="1"
                          />
                        </div>
                        <div className="units-list-col">
                          <input
                            type="number"
                            className="units-inline-input units-inline-input-number"
                            value={unit.sqft || ''}
                            onChange={(e) => updateUnit(index, unit.id, 'sqft', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                            step="1"
                          />
                        </div>
                        <div className="units-list-col-lease">
                          <input
                            type="date"
                            className="units-inline-input units-inline-input-date"
                            value={unit.leaseStart || ''}
                            onChange={(e) => updateUnit(index, unit.id, 'leaseStart', e.target.value)}
                          />
                        </div>
                        <div className="units-list-col-lease">
                          <input
                            type="date"
                            className="units-inline-input units-inline-input-date"
                            value={unit.leaseEnd || ''}
                            onChange={(e) => updateUnit(index, unit.id, 'leaseEnd', e.target.value)}
                          />
                        </div>
                        <div className="units-list-col-actions">
                          {unit.linkedIncomeStatementRowId && (
                            <span className="units-linked-badge" title="Linked to Income Statement">
                              🔗
                            </span>
                          )}
                          <button
                            className="units-delete-unit-btn"
                            onClick={() => removeUnit(index, unit.id)}
                            title="Delete unit"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="units-add-unit-row">
                      <button
                        className="units-add-unit-btn"
                        onClick={() => addUnitToType(index)}
                      >
                        ➕ Add Unit to {typeGroup.type}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>

          {/* Totals Summary */}
          <div className="units-totals">
            <div className="units-totals-item">
              <span className="units-totals-label">Total Units:</span>
              <span className="units-totals-value">{totals.totalUnits}</span>
            </div>
            {totals.avgSqFt > 0 && (
              <div className="units-totals-item">
                <span className="units-totals-label">Weighted Avg Sq Ft:</span>
                <span className="units-totals-value">{totals.avgSqFt.toLocaleString()} sq ft</span>
              </div>
            )}
            {totals.avgRent > 0 && (
              <div className="units-totals-item">
                <span className="units-totals-label">Weighted Avg Rent:</span>
                <span className="units-totals-value">${totals.avgRent.toLocaleString()}/mo</span>
              </div>
            )}
          </div>
        </section>

        {/* Rent Roll Section */}
        <section className="units-section">
          <h3>Rent Roll Summary</h3>

          <div className="units-rentroll-grid">
            <div className="units-field">
              <label>Total Monthly Rent</label>
              <input
                type="number"
                value={data.rentRoll?.totalMonthlyRent || 0}
                onChange={(e) =>
                  updateField("rentRoll", {
                    ...(data.rentRoll || {}),
                    totalMonthlyRent: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <p className="units-field-hint">Total monthly rent collected from all units</p>
            </div>

            <div className="units-field">
              <label>Occupancy Rate (%)</label>
              <input
                type="number"
                value={data.rentRoll?.occupancyRate || 100}
                onChange={(e) =>
                  updateField("rentRoll", {
                    ...(data.rentRoll || {}),
                    occupancyRate: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="100"
                step="0.1"
                min="0"
                max="100"
              />
              <p className="units-field-hint">Current occupancy percentage</p>
            </div>
          </div>

          {data.rentRoll?.totalMonthlyRent > 0 && (
            <div className="units-rentroll-summary">
              <div className="units-rentroll-summary-item">
                <span className="units-rentroll-summary-label">Annual Gross Rent:</span>
                <span className="units-rentroll-summary-value">
                  ${(data.rentRoll.totalMonthlyRent * 12).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              {totals.totalUnits > 0 && (
                <div className="units-rentroll-summary-item">
                  <span className="units-rentroll-summary-label">Avg Rent per Unit:</span>
                  <span className="units-rentroll-summary-value">
                    ${(data.rentRoll.totalMonthlyRent / totals.totalUnits).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                    /mo
                  </span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Documentation Section */}
        <section className="units-section">
          <h3>Documentation</h3>

          <div className="units-folder-card">
            <h4>📐 Unit Floor Plans</h4>
            <p>Floor plans and layouts for each unit type</p>
          </div>
        </section>
      </div>
    </div>
  );
}
