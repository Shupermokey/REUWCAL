// src/constants/fileSystemStructure.js

/**
 * File system structure for property rows
 * Each property has a parent folder with subfolders for each section
 */

export const PROPERTY_FOLDERS = {
  PROPERTY_ADDRESS: {
    id: 'propertyAddress',
    label: 'Property Address',
    subfolders: [
      { id: 'zoningMap', label: 'Zoning Map' },
      { id: 'zoningOrdinance', label: 'Zoning Ordinance' },
      { id: 'floodZone', label: 'Flood Zone' },
      { id: 'marketing', label: 'Marketing' },
      { id: 'msa', label: 'MSA' },
      { id: 'demographics', label: 'Demographics' },
      { id: 'trafficPatterns', label: 'Traffic Patterns' },
      { id: 'propertyReports', label: 'Property Reports' },
      { id: 'corporateGovernance', label: 'Corporate Governance' },
    ]
  },
  PROPERTY_TAXES: {
    id: 'propertyTaxes',
    label: 'Property Taxes',
    subfolders: [
      { id: 'assessment', label: 'Assessment' },
      { id: 'propertyReport', label: 'Property Report' },
      { id: 'taxBill', label: 'Tax Bill' },
      { id: 'potentialTaxBills', label: 'Potential Tax Bills' },
    ]
  },
  GROSS_SITE_AREA: {
    id: 'grossSiteArea',
    label: 'Gross Site Area',
    subfolders: [
      { id: 'propertySurvey', label: 'Property Survey' },
    ]
  },
  GROSS_BUILDING_AREA: {
    id: 'grossBuildingArea',
    label: 'Gross Building Area',
    subfolders: [
      { id: 'floorPlans', label: 'Floor Plans' },
      { id: 'other', label: 'Other' },
    ]
  },
  UNITS: {
    id: 'units',
    label: 'Units',
    subfolders: [
      { id: 'unitMix', label: 'Unit Mix' },
      { id: 'rentRoll', label: 'Rent Roll' },
    ]
  },
  PURCHASE_PRICE: {
    id: 'purchasePrice',
    label: 'Purchase Price',
    subfolders: [
      { id: 'contract', label: 'Contract' },
      { id: 'closingDocuments', label: 'Closing Documents' },
      { id: 'dueDiligence', label: 'Due Diligence' },
    ]
  },
  INCOME_STATEMENT: {
    id: 'incomeStatement',
    label: 'Income Statement',
    subfolders: [
      { id: 'financialStatements', label: 'Financial Statements' },
      { id: 'budgets', label: 'Budgets' },
      { id: 'projections', label: 'Projections' },
    ]
  },
  FINANCING: {
    id: 'financing',
    label: 'Financing',
    subfolders: [
      { id: 'loanDocuments', label: 'Loan Documents' },
      { id: 'termSheets', label: 'Term Sheets' },
      { id: 'appraisals', label: 'Appraisals' },
    ]
  },
};

/**
 * Get all folder sections as an array
 */
export const getFolderSections = () => {
  return Object.values(PROPERTY_FOLDERS);
};

/**
 * Get folder section by ID
 */
export const getFolderSection = (sectionId) => {
  return Object.values(PROPERTY_FOLDERS).find(section => section.id === sectionId);
};

/**
 * Get file path for Firebase Storage
 * Format: users/{userId}/properties/{propertyId}/{sectionId}/{subfolderId}/{fileName}
 */
export const getStoragePath = (userId, propertyId, sectionId, subfolderId, fileName) => {
  return `users/${userId}/properties/${propertyId}/${sectionId}/${subfolderId}/${fileName}`;
};

/**
 * Get Firestore document path for file metadata
 * Format: users/{userId}/properties/{propertyId}/files/{fileId}
 */
export const getFileMetadataPath = (userId, propertyId) => {
  return `users/${userId}/properties/${propertyId}/files`;
};
