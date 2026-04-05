/**
 * ErrorBoundary.jsx — React Error Boundary
 *
 * Prevents the entire app from crashing to a blank white screen.
 * Shows a user-friendly error UI instead.
 *
 * FIX 6: No blank white screens
 * FIX 7: Standard React class component — works on Chrome + Edge
 */

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-bg flex items-center justify-center p-4"
          role="alert"
        >
          <div
            className="bg-card rounded-2xl p-8 w-full max-w-md text-center border border-border"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="text-5xl mb-4">⚠️</div>
            <h1
              className="text-xl font-bold text-navy mb-2"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Something went wrong
            </h1>
            <p
              className="text-text-secondary text-sm mb-6 leading-relaxed"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              An unexpected error occurred. Don't worry — your data is safe.
            </p>
            {/* Show error details only in development */}
            {import.meta.env.DEV && this.state.error && (
              <pre
                className="text-left bg-danger-light text-danger text-xs p-3 rounded-lg mb-5 overflow-auto max-h-32"
                style={{ fontFamily: 'monospace' }}
              >
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer border-0"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              ← Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
