import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@/components/ui/Primitives';

interface State {
  error: Error | null;
}

/** A thrown render error becomes a designed page rather than a white screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this is where a real reporter would be called.
    console.error('Milepost render error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page">
          <ErrorState
            detail="Something went wrong loading your adventure. Your walking record is safe."
            onRetry={() => this.setState({ error: null })}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
