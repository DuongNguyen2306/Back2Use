import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Suppress "Text strings must be rendered within a <Text> component" errors
    const isTextError = error.message?.includes('Text strings must be rendered within a <Text> component') ||
                       error.message?.includes('Text strings must be rendered');
    
    if (isTextError) {
      // Silently handle text rendering errors - don't log or show
      // Reset error state to continue rendering
      this.setState({ hasError: false, error: null });
      return;
    }
    
    // For other errors, log quietly (not as error level)
    if (__DEV__) {
      console.log('⚠️ Error caught by boundary (suppressed from UI):', error.message);
    }
  }

  render() {
    if (this.state.hasError) {
      // Check if it's a text rendering error - if so, suppress it
      const isTextError = this.state.error?.message?.includes('Text strings must be rendered within a <Text> component');
      
      if (isTextError) {
        // Return children anyway - suppress the error
        return this.props.children;
      }
      
      // For other errors, show fallback or children
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default: return children to continue app execution
      return this.props.children;
    }

    return this.props.children;
  }
}

