'use client';
import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode; source: string; onRetry: () => void };

/**
 * Catches geometry and texture failures. The reading panel stays usable, and retry clears
 * the loader cache so the next attempt refetches instead of rethrowing the cached error.
 */
export default class ModelBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="model-failure">
        <h3>The model could not load.</h3>
        <p>You can still read the inscriptions in the panel.</p>
        <button
          onClick={() => {
            this.props.onRetry();
            this.setState({ failed: false });
          }}
        >
          Try again
        </button>
        <a href={this.props.source}>Open the original viewer ↗</a>
      </div>
    );
  }
}
