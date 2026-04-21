import { Component } from 'react';
import Icon from './Icon';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('App ErrorBoundary caught:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <h2>Something went wrong in this view.</h2>
          <p>Try refreshing or go back to the Dashboard.</p>
          <div className="chief-actions">
            <button
              type="button"
              className="action-button"
              onClick={() => window.location.reload()}
              aria-label="Reload the current view"
            >
              Reload App
              <Icon name="action" size={14} className="action-button__icon" />
            </button>
            <button
              type="button"
              className="action-button action-button--ghost"
              onClick={() => window.history.back()}
              aria-label="Go back to previous page"
            >
              Go Back
              <Icon name="action" size={14} className="action-button__icon" />
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
