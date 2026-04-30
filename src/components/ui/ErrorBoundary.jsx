import { Component } from 'react';
import Button from './Button';
import { emitAppErrorTelemetry } from '../../lib/appErrorTelemetry';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    emitAppErrorTelemetry(error, info, {
      boundary: this.props.name || 'ErrorBoundary',
    });

    if (import.meta.env.DEV) {
      console.error('App ErrorBoundary caught:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <h2>Something went wrong in this view.</h2>
          <p>Try refreshing or return to Focus Home.</p>
          <div className="chief-actions">
            <Button
              type="button"
              onClick={() => window.location.reload()}
              ariaLabel="Reload the current view"
              icon={{ name: 'refresh', size: 14 }}
            >
              Reload App
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => window.history.back()}
              ariaLabel="Go back to previous page"
              icon={{ name: 'back', size: 14 }}
            >
              Go Back
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
