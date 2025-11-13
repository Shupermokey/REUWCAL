import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { SubscriptionProvider } from '@/app/providers/SubscriptionProvider';

/**
 * Custom render function that wraps components with all necessary providers
 * @param {ReactElement} ui - The component to render
 * @param {Object} options - Additional options
 * @param {string} options.route - Initial route (default: '/')
 * @param {Object} options.authValue - Mock auth context value
 * @param {Object} options.subscriptionValue - Mock subscription context value
 */
export function renderWithProviders(ui, options = {}) {
  const { route = '/', ...renderOptions } = options;

  // Set initial route
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
