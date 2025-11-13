import React from 'react';
import * as Sentry from '@sentry/react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Send to Sentry
    Sentry.withScope((scope) => {
      scope.setExtras({ errorInfo });
      Sentry.captureException(error);
    });

    // Store error in state for display
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the page
    // window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h1 style={styles.title}>⚠️ Something went wrong</h1>
            <p style={styles.message}>
              We're sorry for the inconvenience. The error has been reported to our team.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Development Only)</summary>
                <pre style={styles.pre}>
                  <strong>Error:</strong> {this.state.error.toString()}
                  {'\n\n'}
                  <strong>Stack:</strong>
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={styles.actions}>
              <button onClick={this.handleReset} style={styles.button}>
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{ ...styles.button, ...styles.buttonSecondary }}
              >
                Go Home
              </button>
            </div>

            {import.meta.env.PROD && (
              <p style={styles.footer}>
                If this problem persists, please{' '}
                <a href="mailto:support@yourapp.com" style={styles.link}>
                  contact support
                </a>
                .
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Styles
const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#333',
  },
  message: {
    fontSize: '16px',
    lineHeight: '1.5',
    color: '#666',
    marginBottom: '24px',
  },
  details: {
    marginTop: '20px',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#666',
  },
  pre: {
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: '#c7254e',
    backgroundColor: '#f9f2f4',
    padding: '12px',
    borderRadius: '4px',
    overflow: 'auto',
    maxHeight: '300px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  button: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    transition: 'background-color 0.2s',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
  },
  footer: {
    marginTop: '24px',
    fontSize: '14px',
    color: '#999',
    textAlign: 'center',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
  },
};

export default ErrorBoundary;

// Export Sentry-wrapped version for even better error tracking
export const SentryErrorBoundary = Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: ({ error, resetError }) => (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚠️ Application Error</h1>
        <p style={styles.message}>An unexpected error occurred. Please try refreshing the page.</p>
        <button onClick={resetError} style={styles.button}>
          Try Again
        </button>
      </div>
    </div>
  ),
  showDialog: false,
});
