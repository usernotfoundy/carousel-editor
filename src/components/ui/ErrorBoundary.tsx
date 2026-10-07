import { Component, type ReactNode } from 'react';

type State = { message: string | null };

export class EditorErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: Error): State {
    return { message: error.message || 'Something went wrong.' };
  }

  render() {
    if (!this.state.message) return this.props.children;
    return (
      <div className="boot">
        <h1>The editor hit a problem</h1>
        <p>{this.state.message}</p>
        <button type="button" className="primary-btn" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
