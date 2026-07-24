import React from "react";

interface Props {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}
interface State { hasError: boolean; }

/** Renders a calm, on-brand fallback if a descendant throws during render. */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown): void {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  reset = (): void => {
    this.setState({ hasError: false });
    if (typeof window !== "undefined") window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="min-h-screen bg-bb-cream flex items-center justify-center px-6" data-testid="error-boundary">
        <div className="max-w-md text-center">
          <p className="bb-eyebrow">A small pause</p>
          <h1 className="mt-3 font-serif text-4xl text-bb-forest">Something interrupted the flow.</h1>
          <p className="mt-4 text-bb-forest/70">
            The page ran into an unexpected moment. Refresh gently and we'll try again.
          </p>
          <button
            onClick={this.reset}
            className="mt-6 px-6 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm hover:bg-bb-forest-2 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
}
