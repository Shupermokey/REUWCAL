/**
 * Default structure for Financing data
 */

export const FOLDER_TYPES = {
  LOAN_DOCUMENTS: "loanDocuments",
};

/**
 * Create default folder structure
 */
export const createFolder = () => ({
  pdfs: [], // Array of { name, url, uploadedAt }
  links: [], // Array of { name, url, addedAt }
});

/**
 * Common loan types
 */
export const LOAN_TYPES = [
  "Conventional",
  "FHA",
  "VA",
  "Commercial",
  "Bridge",
  "Hard Money",
  "Portfolio",
  "SBA 7(a)",
  "SBA 504",
  "Other",
];

/**
 * Calculate monthly payment using mortgage formula
 * P = L[c(1 + c)^n]/[(1 + c)^n - 1]
 * Where:
 * P = Monthly Payment
 * L = Loan Amount
 * c = Monthly Interest Rate (annual rate / 12)
 * n = Number of Payments (amortization in years * 12)
 */
export const calculateMonthlyPayment = (loanAmount, interestRate, amortizationYears) => {
  if (!loanAmount || !interestRate || !amortizationYears) return 0;

  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = amortizationYears * 12;

  if (monthlyRate === 0) {
    return loanAmount / numberOfPayments;
  }

  const payment =
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return Math.round(payment * 100) / 100;
};

/**
 * Calculate down payment from purchase price and loan amount
 */
export const calculateDownPayment = (purchasePrice, loanAmount) => {
  if (!purchasePrice || !loanAmount) return 0;
  return Math.max(0, purchasePrice - loanAmount);
};

/**
 * Calculate loan-to-value ratio (LTV)
 */
export const calculateLTV = (loanAmount, purchasePrice) => {
  if (!purchasePrice || purchasePrice === 0) return 0;
  return Math.round((loanAmount / purchasePrice) * 10000) / 100; // Percentage with 2 decimals
};

/**
 * Default structure for Financing
 */
export const defaultFinancing = () => ({
  loanAmount: 0,
  interestRate: 0, // Annual percentage
  termYears: 0, // Loan term in years
  amortizationYears: 0, // Amortization period in years
  loanType: "", // Type of loan
  downPayment: 0,
  folders: {
    [FOLDER_TYPES.LOAN_DOCUMENTS]: createFolder(),
  },
});
