import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  fallback(reset: () => void): ReactNode;
  children: ReactNode;
}

/** Keeps a crash inside one feature (e.g. a module) from blanking the whole app. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Feature crashed', error, info.componentStack);
  }

  render() {
    return this.state.failed
      ? this.props.fallback(() => this.setState({ failed: false }))
      : this.props.children;
  }
}
