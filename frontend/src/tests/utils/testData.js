// Mock user data for testing

export const mockUsers = {
  free: {
    uid: 'free-user-123',
    email: 'freeuser@example.com',
    emailVerified: true,
    displayName: 'Free User',
  },
  marketing: {
    uid: 'marketing-user-123',
    email: 'marketinguser@example.com',
    emailVerified: true,
    displayName: 'Marketing User',
  },
  developer: {
    uid: 'developer-user-123',
    email: 'developeruser@example.com',
    emailVerified: true,
    displayName: 'Developer User',
  },
  syndicator: {
    uid: 'syndicator-user-123',
    email: 'syndicatoruser@example.com',
    emailVerified: true,
    displayName: 'Syndicator User',
  },
  unverified: {
    uid: 'unverified-user-123',
    email: 'unverified@example.com',
    emailVerified: false,
    displayName: 'Unverified User',
  },
};

export const mockSubscriptions = {
  marketing: {
    id: 'sub_marketing_123',
    status: 'active',
    priceId: 'price_marketing',
    current_period_start: Date.now() / 1000,
    current_period_end: (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000,
  },
  developer: {
    id: 'sub_developer_123',
    status: 'active',
    priceId: 'price_developer',
    current_period_start: Date.now() / 1000,
    current_period_end: (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000,
  },
  syndicator: {
    id: 'sub_syndicator_123',
    status: 'active',
    priceId: 'price_syndicator',
    current_period_start: Date.now() / 1000,
    current_period_end: (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000,
  },
  canceled: {
    id: 'sub_canceled_123',
    status: 'canceled',
    priceId: 'price_marketing',
    current_period_start: Date.now() / 1000,
    current_period_end: (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000,
  },
};

export const mockProperties = {
  residential: {
    id: 'prop_123',
    propertyName: '123 Main St',
    propertyType: 'Residential',
    address: '123 Main Street',
    city: 'Seattle',
    state: 'WA',
    zip: '98101',
    purchasePrice: 500000,
    createdAt: new Date().toISOString(),
  },
  commercial: {
    id: 'prop_456',
    propertyName: 'Downtown Office Building',
    propertyType: 'Commercial',
    address: '456 Business Ave',
    city: 'Portland',
    state: 'OR',
    zip: '97201',
    purchasePrice: 2000000,
    createdAt: new Date().toISOString(),
  },
};

export const mockIncomeData = {
  basic: {
    grossRentalIncome: 60000,
    otherIncome: 5000,
    vacancy: 3000,
    effectiveGrossIncome: 62000,
    operatingExpenses: 20000,
    netOperatingIncome: 42000,
  },
};
