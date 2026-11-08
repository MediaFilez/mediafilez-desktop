import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { error: Error | null };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled interface error", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="error-fallback" role="alert">
        <div className="error-panel">
          <h1>Something went wrong</h1>
          <p>
            MediaFilez Desktop hit an unexpected interface error. Files already
            downloaded and your settings are unchanged.
          </p>
          <pre>{error.message}</pre>
          <div className="error-actions">
            <button type="button" className="primary-button" onClick={() => window.location.reload()} >
              Reload window
            </button>
          </div>
        </div>
      </main>
    );
  }
}
