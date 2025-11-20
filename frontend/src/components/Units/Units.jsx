import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';
import { useAuth } from "@/app/providers/AuthProvider";
import { useDialog } from "@/app/providers/DialogProvider";
import { useUnits } from "@/hooks/useUnits";
import AccountingInput from "@/components/common/AccountingInput";
import AccountingNumber from "@/components/common/AccountingNumber";
import {
  createUnitType,
  createUnit,
  calculateTotalUnits,
  calculateAvgSqFt,
  calculateAvgRent,
  generateYearlyBreakdown,
  calculateWALT,
  calculatePercentOfGBA,
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
// Theme presets for table settings
const THEME_PRESETS = {
  default: {
    name: 'Default',
    headerBg: '#374151',
    incomeBg: '#065f46',
    leaseBg: '#1e40af',
  },
  ocean: {
    name: 'Ocean',
    headerBg: '#0c4a6e',
    incomeBg: '#155e75',
    leaseBg: '#164e63',
  },
  forest: {
    name: 'Forest',
    headerBg: '#14532d',
    incomeBg: '#166534',
    leaseBg: '#15803d',
  },
};

export default function Units({ propertyId, onTotalUnitsChange, grossBuildingArea = 0 }) {
  const { user } = useAuth();
  const { prompt, promptMultiple } = useDialog();
  const { data, setData, loading, save } = useUnits(user.uid, propertyId);
  const [expandedTypes, setExpandedTypes] = useState({}); // Track which unit types are expanded
  const [expandedYearlyUnits, setExpandedYearlyUnits] = useState({}); // Track which units have yearly breakdown expanded
  const [viewMode, setViewMode] = useState('annual'); // 'monthly', 'annual', or 'rollup'
  const [showSettings, setShowSettings] = useState(false); // Show/hide settings dropdown
  const [theme, setTheme] = useState('default'); // Current theme preset
  const onTotalUnitsChangeRef = useRef(onTotalUnitsChange);
  const prevTotalUnitsRef = useRef();

  // Toggle yearly breakdown expansion for a unit
  const toggleYearlyExpanded = useCallback((unitId) => {
    setExpandedYearlyUnits(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  }, []);

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
          <div className="units-header-controls">
            {/* View Mode Toggle */}
            <div className="units-view-mode">
              <button
                className={`units-view-btn ${viewMode === 'monthly' ? 'active' : ''}`}
                onClick={() => setViewMode('monthly')}
                title="Show Monthly values only"
              >
                Monthly
              </button>
              <button
                className={`units-view-btn ${viewMode === 'annual' ? 'active' : ''}`}
                onClick={() => setViewMode('annual')}
                title="Show Annual values only"
              >
                Annual
              </button>
              <button
                className={`units-view-btn ${viewMode === 'rollup' ? 'active' : ''}`}
                onClick={() => setViewMode('rollup')}
                title="Show both Monthly and Annual"
              >
                Roll Up
              </button>
            </div>

            {/* Settings Gear */}
            <div className="units-settings-wrapper">
              <button
                className="units-settings-btn"
                onClick={() => setShowSettings(!showSettings)}
                title="Table Settings"
              >
                ⚙️
              </button>
              {showSettings && (
                <div className="units-settings-dropdown">
                  <div className="units-settings-header">Theme</div>
                  {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      className={`units-theme-option ${theme === key ? 'active' : ''}`}
                      onClick={() => {
                        setTheme(key);
                        setShowSettings(false);
                      }}
                    >
                      <span
                        className="units-theme-preview"
                        style={{
                          background: `linear-gradient(90deg, ${preset.headerBg} 33%, ${preset.incomeBg} 33%, ${preset.incomeBg} 66%, ${preset.leaseBg} 66%)`
                        }}
                      />
                      {preset.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="units-save-btn" onClick={handleSave}>
              💾 Save
            </button>
          </div>
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

          {/* New 22-Column Table Structure */}
          <div className={`units-table-container units-view-${viewMode}`}>
            {/* Header Groups */}
            <div className="units-header-groups">
              <div className="units-header-group-info" style={{ background: THEME_PRESETS[theme].headerBg }}>Unit Information</div>
              <div className="units-header-group-income" style={{ background: THEME_PRESETS[theme].incomeBg }}>Unit Income Information</div>
              <div className="units-header-group-lease" style={{ background: THEME_PRESETS[theme].leaseBg }}>Lease Information</div>
            </div>

            {/* Sub-headers */}
            <div className="units-subheaders">
              {/* Unit Information - 5 columns */}
              <div className="units-subheader">Unit ID</div>
              <div className="units-subheader">Unit Desc</div>
              <div className="units-subheader">Lease Abstract</div>
              <div className="units-subheader">Tenant Name</div>
              <div className="units-subheader">Size (% GBA)</div>
              {/* Unit Income Information - columns vary by view mode */}
              <div className="units-subheader">% Inc Rent</div>
              {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-subheader">Rent/sqft</div>}
              {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-subheader">Rent/mo</div>}
              {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-subheader">Rent/sqft/yr</div>}
              {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-subheader">Rent/yr</div>}
              <div className="units-subheader">% Inc Rec</div>
              {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-subheader">Rec/sqft</div>}
              {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-subheader">Rec/mo</div>}
              {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-subheader">Rec/sqft/yr</div>}
              {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-subheader">Rec/yr</div>}
              {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-subheader">Gross/sqft</div>}
              {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-subheader">Gross/mo</div>}
              {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-subheader">Gross/sqft/yr</div>}
              {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-subheader">Gross/yr</div>}
              {/* Lease Information - only Term Start/End for Monthly/Annual, all 6 for Roll Up */}
              <div className="units-subheader">Term Start</div>
              <div className="units-subheader">Term End</div>
              {viewMode === 'rollup' && <div className="units-subheader">Gross Mo Rem</div>}
              {viewMode === 'rollup' && <div className="units-subheader">Gross Yr Rem</div>}
              {viewMode === 'rollup' && <div className="units-subheader">WALT (Mo)</div>}
              {viewMode === 'rollup' && <div className="units-subheader">WALT (Yr)</div>}
            </div>

            {/* Data Rows */}
            {data.unitMix.map((typeGroup, typeIndex) => {
              const isPlainUnit = typeGroup.type === null;

              return (
                <React.Fragment key={typeIndex}>
                  {/* Type Header Row (if grouped) */}
                  {!isPlainUnit && (
                    <>
                      <div
                        className="units-type-header"
                        onClick={() => toggleExpanded(typeGroup.type)}
                      >
                        <div className="units-type-header-left">
                          <span className="units-type-expand-icon">
                            {expandedTypes[typeGroup.type] ? '▼' : '▶'}
                          </span>
                          <input
                            type="text"
                            className="units-type-name-input"
                            value={typeGroup.type || ''}
                            onChange={(e) => updateUnitTypeName(typeGroup.type, e.target.value)}
                            placeholder={`Unit Type ${typeIndex + 1}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="units-type-count">
                            ({typeGroup.count} unit{typeGroup.count !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="units-type-summary">
                          <button
                            className="units-delete-unit-btn"
                            onClick={(e) => { e.stopPropagation(); removeUnitType(typeIndex); }}
                            title="Delete entire unit type"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      {/* Subheaders inside expanded group */}
                      {expandedTypes[typeGroup.type] && (
                        <div className="units-subheaders units-group-subheaders">
                          {/* Unit Information - 5 columns */}
                          <div className="units-subheader">Unit ID</div>
                          <div className="units-subheader">Unit Desc</div>
                          <div className="units-subheader">Lease Abstract</div>
                          <div className="units-subheader">Tenant Name</div>
                          <div className="units-subheader">Size (% GBA)</div>
                          {/* Unit Income Information - columns vary by view mode */}
                          <div className="units-subheader">% Inc Rent</div>
                          {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-subheader">Rent/sqft</div>}
                          {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-subheader">Rent/mo</div>}
                          {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-subheader">Rent/sqft/yr</div>}
                          {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-subheader">Rent/yr</div>}
                          <div className="units-subheader">% Inc Rec</div>
                          {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-subheader">Rec/sqft</div>}
                          {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-subheader">Rec/mo</div>}
                          {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-subheader">Rec/sqft/yr</div>}
                          {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-subheader">Rec/yr</div>}
                          {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-subheader">Gross/sqft</div>}
                          {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-subheader">Gross/mo</div>}
                          {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-subheader">Gross/sqft/yr</div>}
                          {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-subheader">Gross/yr</div>}
                          {/* Lease Information - only Term Start/End for Monthly/Annual, all 6 for Roll Up */}
                          <div className="units-subheader">Term Start</div>
                          <div className="units-subheader">Term End</div>
                          {viewMode === 'rollup' && <div className="units-subheader">Gross Mo Rem</div>}
                          {viewMode === 'rollup' && <div className="units-subheader">Gross Yr Rem</div>}
                          {viewMode === 'rollup' && <div className="units-subheader">WALT (Mo)</div>}
                          {viewMode === 'rollup' && <div className="units-subheader">WALT (Yr)</div>}
                        </div>
                      )}
                    </>
                  )}

                  {/* Unit Rows */}
                  {(isPlainUnit || expandedTypes[typeGroup.type]) && typeGroup.units && typeGroup.units.map((unit) => {
                    // Calculate derived values
                    const sqft = parseFloat(unit.sqft) || 0;
                    const rentMonthly = parseFloat(unit.rent || unit.rentMonthly) || 0;
                    const rentAnnual = rentMonthly * 12;
                    const rentPsf = sqft > 0 ? rentMonthly / sqft : 0;
                    const percentGBA = calculatePercentOfGBA(sqft, grossBuildingArea);
                    const walt = calculateWALT(unit.leaseEnd);

                    // Generate yearly breakdown
                    const yearlyBreakdown = generateYearlyBreakdown(
                      unit.leaseStart,
                      unit.leaseEnd,
                      rentMonthly,
                      unit.percentIncreaseRent || 3
                    );

                    return (
                      <React.Fragment key={unit.id}>
                        {/* Main Unit Row */}
                        <div className="units-data-row">
                          {/* Unit Information - 5 columns */}
                          <div className="units-data-cell">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {yearlyBreakdown.length > 0 && (
                                <button
                                  className={`units-expand-btn ${expandedYearlyUnits[unit.id] ? 'expanded' : ''}`}
                                  onClick={() => toggleYearlyExpanded(unit.id)}
                                  title="Toggle yearly breakdown"
                                >
                                  ▶
                                </button>
                              )}
                              <input
                                type="text"
                                className="units-cell-input"
                                value={unit.name || unit.unitId || ''}
                                onChange={(e) => updateUnit(typeIndex, unit.id, 'name', e.target.value)}
                                placeholder="ID"
                              />
                            </div>
                          </div>
                          <div className="units-data-cell">
                            <input
                              type="text"
                              className="units-cell-input"
                              value={unit.unitDesc || ''}
                              onChange={(e) => updateUnit(typeIndex, unit.id, 'unitDesc', e.target.value)}
                              placeholder="Description"
                            />
                          </div>
                          <div className="units-data-cell">
                            <input
                              type="text"
                              className="units-cell-input"
                              value={unit.leaseAbstract || ''}
                              onChange={(e) => updateUnit(typeIndex, unit.id, 'leaseAbstract', e.target.value)}
                              placeholder="Abstract"
                            />
                          </div>
                          <div className="units-data-cell">
                            <input
                              type="text"
                              className="units-cell-input"
                              value={unit.tenant || ''}
                              onChange={(e) => updateUnit(typeIndex, unit.id, 'tenant', e.target.value)}
                              placeholder="Vacant"
                            />
                          </div>
                          <div className="units-data-cell">
                            <AccountingInput
                              className="units-cell-input units-cell-input-number"
                              value={unit.sqft || ''}
                              onChange={(val) => updateUnit(typeIndex, unit.id, 'sqft', val)}
                              placeholder="0"
                              decimals={0}
                              symbolType="sqft"
                            />
                          </div>

                          {/* Unit Income Information - columns vary by view mode */}
                          <div className="units-data-cell">
                            <AccountingInput
                              className="units-cell-input units-cell-input-number"
                              value={unit.percentIncreaseRent || 3}
                              onChange={(val) => updateUnit(typeIndex, unit.id, 'percentIncreaseRent', val)}
                              decimals={1}
                              symbolType="percent"
                            />
                          </div>
                          {(viewMode === 'monthly' || viewMode === 'rollup') && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={rentPsf}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'rent', val * sqft)}
                                placeholder="0"
                                decimals={2}
                                symbolType="psf"
                              />
                            </div>
                          )}
                          {(viewMode === 'monthly' || viewMode === 'rollup') && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={rentMonthly || ''}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'rent', val)}
                                placeholder="0"
                                decimals={2}
                                symbolType="currency"
                              />
                            </div>
                          )}
                          {(viewMode === 'annual' || viewMode === 'rollup') && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={sqft > 0 ? rentAnnual / sqft : ''}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'rent', (val * sqft) / 12)}
                                placeholder="0"
                                decimals={2}
                                symbolType="psfyr"
                              />
                            </div>
                          )}
                          {(viewMode === 'annual' || viewMode === 'rollup') && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={rentAnnual || ''}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'rent', val / 12)}
                                placeholder="0"
                                decimals={2}
                                symbolType="currency"
                              />
                            </div>
                          )}
                          <div className="units-data-cell">
                            <AccountingInput
                              className="units-cell-input units-cell-input-number"
                              value={unit.percentIncreaseRecoverable || ''}
                              onChange={(val) => updateUnit(typeIndex, unit.id, 'percentIncreaseRecoverable', val)}
                              placeholder="0"
                              decimals={1}
                              symbolType="percent"
                            />
                          </div>
                          {(viewMode === 'monthly' || viewMode === 'rollup') && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={unit.recoverableRentPsf || ''}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'recoverableRentPsf', val)}
                                placeholder="0"
                                decimals={2}
                                symbolType="psf"
                              />
                            </div>
                          )}
                          {(viewMode === 'monthly' || viewMode === 'rollup') && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={unit.recoverableRentMonthly || ''}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'recoverableRentMonthly', val)}
                                placeholder="0"
                                decimals={2}
                                symbolType="currency"
                              />
                            </div>
                          )}
                          {(viewMode === 'annual' || viewMode === 'rollup') && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={unit.recoverableRentPsfAnnual || ''}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'recoverableRentPsfAnnual', val)}
                                placeholder="0"
                                decimals={2}
                                symbolType="psfyr"
                              />
                            </div>
                          )}
                          {(viewMode === 'annual' || viewMode === 'rollup') && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={unit.recoverableRentAnnual || ''}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'recoverableRentAnnual', val)}
                                placeholder="0"
                                decimals={2}
                                symbolType="currency"
                              />
                            </div>
                          )}
                          {(viewMode === 'monthly' || viewMode === 'rollup') && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={unit.grossRentPsf || rentPsf}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'grossRentPsf', val)}
                                placeholder="0"
                                decimals={2}
                                symbolType="psf"
                              />
                            </div>
                          )}
                          {(viewMode === 'monthly' || viewMode === 'rollup') && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={unit.grossRentMonthly || rentMonthly}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'grossRentMonthly', val)}
                                placeholder="0"
                                decimals={2}
                                symbolType="currency"
                              />
                            </div>
                          )}
                          {(viewMode === 'annual' || viewMode === 'rollup') && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={unit.grossRentPsfAnnual || (sqft > 0 ? rentAnnual / sqft : '')}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'grossRentPsfAnnual', val)}
                                placeholder="0"
                                decimals={2}
                                symbolType="psfyr"
                              />
                            </div>
                          )}
                          {(viewMode === 'annual' || viewMode === 'rollup') && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={unit.grossRentAnnual || rentAnnual}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'grossRentAnnual', val)}
                                placeholder="0"
                                decimals={2}
                                symbolType="currency"
                              />
                            </div>
                          )}

                          {/* Lease Information - only Term Start/End for Monthly/Annual, all 6 for Roll Up */}
                          <div className="units-data-cell">
                            <input
                              type="date"
                              className="units-cell-input units-cell-input-date"
                              value={unit.leaseStart || ''}
                              onChange={(e) => updateUnit(typeIndex, unit.id, 'leaseStart', e.target.value)}
                            />
                          </div>
                          <div className="units-data-cell">
                            <input
                              type="date"
                              className="units-cell-input units-cell-input-date"
                              value={unit.leaseEnd || ''}
                              onChange={(e) => updateUnit(typeIndex, unit.id, 'leaseEnd', e.target.value)}
                            />
                          </div>
                          {viewMode === 'rollup' && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={unit.grossMonthsRemaining || (() => {
                                  if (!unit.leaseEnd) return '';
                                  const end = new Date(unit.leaseEnd);
                                  const now = new Date();
                                  if (isNaN(end.getTime())) return '';
                                  const diffMs = end.getTime() - now.getTime();
                                  if (diffMs <= 0) return 0;
                                  return Math.round((diffMs / (1000 * 60 * 60 * 24 * 30.44)) * 10) / 10;
                                })()}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'grossMonthsRemaining', val)}
                                placeholder="0"
                                decimals={1}
                                symbolType="months"
                              />
                            </div>
                          )}
                          {viewMode === 'rollup' && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={unit.grossYearsRemaining || (() => {
                                  if (!unit.leaseEnd) return '';
                                  const end = new Date(unit.leaseEnd);
                                  const now = new Date();
                                  if (isNaN(end.getTime())) return '';
                                  const diffMs = end.getTime() - now.getTime();
                                  if (diffMs <= 0) return 0;
                                  return Math.round((diffMs / (1000 * 60 * 60 * 24 * 365.25)) * 100) / 100;
                                })()}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'grossYearsRemaining', val)}
                                placeholder="0"
                                decimals={2}
                                symbolType="years"
                              />
                            </div>
                          )}
                          {viewMode === 'rollup' && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={unit.waltMonthly || walt.monthly}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'waltMonthly', val)}
                                placeholder="0"
                                decimals={1}
                                symbolType="months"
                              />
                            </div>
                          )}
                          {viewMode === 'rollup' && (
                            <div className="units-data-cell">
                              <AccountingInput
                                className="units-cell-input units-cell-input-number"
                                value={unit.waltAnnual || walt.annual}
                                onChange={(val) => updateUnit(typeIndex, unit.id, 'waltAnnual', val)}
                                placeholder="0"
                                decimals={2}
                                symbolType="years"
                              />
                            </div>
                          )}
                        </div>

                        {/* Yearly Breakdown Rows (collapsible) */}
                        {expandedYearlyUnits[unit.id] && yearlyBreakdown.map((yearData, yearIndex) => (
                          <div key={`${unit.id}-year-${yearData.year}`} className="units-data-row units-yearly-row">
                            {/* Unit Information - 5 columns (mostly empty for yearly rows) */}
                            <div className="units-data-cell" style={{ paddingLeft: '24px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{yearData.year}</span>
                            </div>
                            <div className="units-data-cell"></div>
                            <div className="units-data-cell"></div>
                            <div className="units-data-cell"></div>
                            <div className="units-data-cell"></div>

                            {/* Unit Income Information - columns vary by view mode */}
                            <div className="units-data-cell">
                              <span className="units-calculated">{yearData.percentIncrease}%</span>
                            </div>
                            {(viewMode === 'monthly' || viewMode === 'rollup') && (
                              <div className="units-data-cell">
                                <span className="units-calculated">${sqft > 0 ? (yearData.rentMonthly / sqft).toFixed(2) : '0.00'}</span>
                              </div>
                            )}
                            {(viewMode === 'monthly' || viewMode === 'rollup') && (
                              <div className="units-data-cell">
                                <span className="units-calculated">${yearData.rentMonthly.toLocaleString()}</span>
                              </div>
                            )}
                            {(viewMode === 'annual' || viewMode === 'rollup') && (
                              <div className="units-data-cell">
                                <span className="units-calculated">${sqft > 0 ? (yearData.rentAnnual / sqft).toFixed(2) : '0.00'}</span>
                              </div>
                            )}
                            {(viewMode === 'annual' || viewMode === 'rollup') && (
                              <div className="units-data-cell">
                                <span className="units-calculated">${yearData.rentAnnual.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="units-data-cell"></div>
                            {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-data-cell"></div>}
                            {(viewMode === 'monthly' || viewMode === 'rollup') && <div className="units-data-cell"></div>}
                            {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-data-cell"></div>}
                            {(viewMode === 'annual' || viewMode === 'rollup') && <div className="units-data-cell"></div>}
                            {(viewMode === 'monthly' || viewMode === 'rollup') && (
                              <div className="units-data-cell">
                                <span className="units-calculated">${sqft > 0 ? (yearData.rentMonthly / sqft).toFixed(2) : '0.00'}</span>
                              </div>
                            )}
                            {(viewMode === 'monthly' || viewMode === 'rollup') && (
                              <div className="units-data-cell">
                                <span className="units-calculated">${yearData.rentMonthly.toLocaleString()}</span>
                              </div>
                            )}
                            {(viewMode === 'annual' || viewMode === 'rollup') && (
                              <div className="units-data-cell">
                                <span className="units-calculated">${sqft > 0 ? (yearData.rentAnnual / sqft).toFixed(2) : '0.00'}</span>
                              </div>
                            )}
                            {(viewMode === 'annual' || viewMode === 'rollup') && (
                              <div className="units-data-cell">
                                <span className="units-calculated">${yearData.rentAnnual.toLocaleString()}</span>
                              </div>
                            )}

                            {/* Lease Information - only Term Start/End for Monthly/Annual, all 6 for Roll Up */}
                            <div className="units-data-cell"></div>
                            <div className="units-data-cell"></div>
                            {viewMode === 'rollup' && <div className="units-data-cell"></div>}
                            {viewMode === 'rollup' && <div className="units-data-cell"></div>}
                            {viewMode === 'rollup' && <div className="units-data-cell"></div>}
                            {viewMode === 'rollup' && <div className="units-data-cell"></div>}
                          </div>
                        ))}
                      </React.Fragment>
                    );
                  })}

                  {/* Add Unit button for grouped types */}
                  {!isPlainUnit && expandedTypes[typeGroup.type] && (
                    <div className="units-add-unit-row">
                      <button
                        className="units-add-unit-btn"
                        onClick={() => addUnitToType(typeIndex)}
                      >
                        ➕ Add Unit to {typeGroup.type}
                      </button>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Totals Summary */}
          <div className="units-totals">
            <div className="units-totals-item">
              <span className="units-totals-label">Total Units:</span>
              <span className="units-totals-value">{totals.totalUnits}</span>
            </div>
            <div className="units-totals-item">
              <span className="units-totals-label">GBA:</span>
              <span className="units-totals-value">{grossBuildingArea.toLocaleString()} sq ft</span>
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
              <AccountingInput
                value={data.rentRoll?.totalMonthlyRent || 0}
                onChange={(val) =>
                  updateField("rentRoll", {
                    ...(data.rentRoll || {}),
                    totalMonthlyRent: val,
                  })
                }
                placeholder="0.00"
                decimals={2}
                symbolType="currency"
              />
              <p className="units-field-hint">Total monthly rent collected from all units</p>
            </div>

            <div className="units-field">
              <label>Occupancy Rate (%)</label>
              <AccountingInput
                value={data.rentRoll?.occupancyRate || 100}
                onChange={(val) =>
                  updateField("rentRoll", {
                    ...(data.rentRoll || {}),
                    occupancyRate: val,
                  })
                }
                placeholder="100"
                decimals={1}
                symbolType="percent"
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
