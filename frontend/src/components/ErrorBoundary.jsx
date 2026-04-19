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
import { AlertCircle, RefreshCw } from 'lucide-react';


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
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-bg flex items-center justify-center p-4"
          role="alert"
        >
          <div
            className="bg-card rounded-2xl p-10 w-full max-w-md text-center border border-border"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex justify-center mb-6">
               <div className="w-20 h-20 bg-accent/10 rounded-[2rem] flex items-center justify-center text-accent">
                 <AlertCircle size={40} strokeWidth={2} />
               </div>
            </div>
            <h1
              className="text-2xl font-black text-navy mb-3"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Something went wrong
            </h1>
            <p
              className="text-text-secondary text-sm mb-8 leading-relaxed font-medium break-words whitespace-normal px-4"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {this.state.error?.message || "Please refresh the page to try again. Your data is safe."}
            </p>
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white px-6 py-4 rounded-xl text-sm font-black transition-colors duration-150 cursor-pointer border-0 shadow-lg shadow-accent/20"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <RefreshCw size={18} /> Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
