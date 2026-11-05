import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Hirbit Store View Crash Caught]', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto mt-16 bg-white rounded-xl border border-[#E5E0D8] shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-[#B89B65] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#1A1A1A]">
              {this.props.fallbackTitle || 'Workspace Display Error'}
            </h3>
            <p className="text-xs text-[#716D66] mt-2 leading-relaxed">
              An unexpected render anomaly occurred while presenting this view.
              Your data remains securely preserved on Neon PostgreSQL.
            </p>
            {this.state.error?.message && (
              <p className="mt-3 p-2 bg-[#F9F8F6] text-amber-900 rounded font-mono text-[11px] break-all border border-[#E5E0D8]">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 mx-auto transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Workspace</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

