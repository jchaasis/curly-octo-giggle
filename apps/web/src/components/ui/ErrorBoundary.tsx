import { Component } from 'react';
import type { ReactNode } from 'react';
import { getClassName } from '@/lib/utils';

interface ErrorBoundaryProps {
  children: ReactNode;
  panelName: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={getClassName(
            'rounded-lg border border-white/10 bg-white/5 p-4',
            'flex flex-col gap-2',
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
            {this.props.panelName} — Data Unavailable
          </p>
          <p className="text-sm text-destructive">This panel encountered an error.</p>
          {this.state.error && (
            <p className="font-mono text-xs text-white/30">{this.state.error.message}</p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
