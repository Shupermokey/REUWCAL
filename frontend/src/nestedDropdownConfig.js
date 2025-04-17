const dropdownStructureMap = {
  propertyAddress: [
    "Property Address",
    "Property Title/Name",
    "Property Marketing/Media",
    "Property MSA/Trade-Area Report",
    "Property Neighborhood",
    "Property Demographics",
    "Property Traffic Patterns",
    "Property Reports / Inspections",
    "...Other"
  ],
  propertyClass: [
    "Property Zoning",
    "Property Class",
    "Property Zoning Code",
    "Property Zoning Ordinence Documentation",
    "...Other"
  ],
  purchasePrice: [
    "Contract Price",
    "Transaction Expenses",
    [
      "Due-Diligence/Inspection",
      "Sale Expenses",
      "...Other"
    ],
    "1st Year CAPEx",
    "Capital Reserve",
    "...Other"
  ],
  purchasePriceSF: [
    "$PSF, GBA (And other acquisition metrics)",
    "$P/Unit",
    "$PSF, GBA",
    "$PSF, GSA",
    "$/Acre"
  ],
  GrossSiteArea: [
    "GSA (Metric Dropdown)",
    "Acres",
    "Property Survey",
    "Property FEMA ID / MAP",
    "...Other"
  ],
  GrossBuildingArea: [
    "GBA (Metric Dropdown)",
    "Property Floor-Plan(s)",
    "Property 3-D Scan",
    "Property Componants",
    [
      "Roofing Report(s)",
      "RTU/HVAC Report(s)",
      "Life & Saftey Report(s)",
      "...Other Componant(s)"
    ],
    "...Other"
  ],
  UnitCount: [
    "NRA (Metric Dropdown)",
    "Unit Count",
    "Unit Configuration",
    [
      "[ Unit ID ] [ Tenant Name ] [ Unit SF ] [ Unit % ]",
      "...Unit Configuration Other"
    ],
    "...Other"
  ],
  REPropertyTax: [
    "Property Tax",
    "Property Tax PIN (Multiple Pins)",
    "Property Tax: Gross, PSF/GBA & PSF/GSA",
    "Property Tax Assessor Report",
    "Property Tax Map",
    "...Other"
  ],
  MarketRate: [
    "PGI (Applies Baseline First)",
    "Potential Gross Income",
    "BRI"
  ],
  ServiceStructure: [
    "OMI",
    "Offering Memorandum Income"
  ]
};

export default dropdownStructureMap;
