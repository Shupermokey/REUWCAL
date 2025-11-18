import React, { useState, useEffect } from 'react';
import { getLinkedUnitInfo } from '@/services/unitSyncService';
import '@/styles/components/Income/UnitTooltip.css';

/**
 * Tooltip showing linked unit information from Units table
 * Appears on hover of the link icon
 */
export default function UnitInfoTooltip({
  linkedUnitId,
  userId,
  propertyId,
  position = { top: 0, left: 0 },
}) {
  const [unitInfo, setUnitInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUnitInfo() {
      try {
        const info = await getLinkedUnitInfo(userId, propertyId, linkedUnitId);
        setUnitInfo(info);
      } catch (error) {
        console.error('Error fetching unit info:', error);
        setUnitInfo(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUnitInfo();
  }, [linkedUnitId, userId, propertyId]);

  if (loading) {
    return (
      <div
        className="unit-tooltip"
        style={{ top: position.top, left: position.left }}
      >
        <div className="unit-tooltip-loading">Loading...</div>
      </div>
    );
  }

  if (!unitInfo) {
    return (
      <div
        className="unit-tooltip"
        style={{ top: position.top, left: position.left }}
      >
        <div className="unit-tooltip-error">Unit not found</div>
      </div>
    );
  }

  return (
    <div
      className="unit-tooltip"
      style={{ top: position.top, left: position.left }}
    >
      <div className="unit-tooltip-header">
        <strong>{unitInfo.displayName}</strong>
      </div>

      <div className="unit-tooltip-body">
        <div className="unit-tooltip-row">
          <span className="unit-tooltip-label">Tenant:</span>
          <span className="unit-tooltip-value">
            {unitInfo.tenant || 'Vacant'}
          </span>
        </div>

        <div className="unit-tooltip-row">
          <span className="unit-tooltip-label">Rent:</span>
          <span className="unit-tooltip-value">
            ${unitInfo.rent.toLocaleString()}/mo
          </span>
        </div>

        {unitInfo.sqft > 0 && (
          <div className="unit-tooltip-row">
            <span className="unit-tooltip-label">Size:</span>
            <span className="unit-tooltip-value">{unitInfo.sqft} sq ft</span>
          </div>
        )}

        {unitInfo.leaseStart && unitInfo.leaseEnd && (
          <div className="unit-tooltip-row">
            <span className="unit-tooltip-label">Lease:</span>
            <span className="unit-tooltip-value">
              {new Date(unitInfo.leaseStart).toLocaleDateString()} -{' '}
              {new Date(unitInfo.leaseEnd).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="unit-tooltip-footer">
        <small>Click to view in Units table</small>
      </div>
    </div>
  );
}
