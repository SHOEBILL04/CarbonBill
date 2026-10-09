import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CarbonBill ErrorBoundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.fallbackComponent) {
        return this.fallbackComponent;
      }
      return (
        <div className="p-6 max-w-lg mx-auto my-8 bg-red-50 border border-red-200 rounded-2xl text-red-900 text-center font-sans">
          <h2 className="text-lg font-bold mb-2">একটি ত্রুটি ঘটেছে (An unexpected error occurred)</h2>
          <p className="text-xs text-red-700 mb-4">{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
          >
            পুনরায় লোড করুন (Reload Page)
          </button>
        </div>
      );
    }

    return this.props.children;
  }

  private get fallbackComponent(): ReactNode {
    return this.props.fallback;
  }
}
