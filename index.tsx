import React, { ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  // Fix: Explicitly define constructor to ensure `this.props` is correctly typed by TypeScript
  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', backgroundColor: '#0f172a', height: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#ef4444', fontSize: '24px' }}>Something went wrong.</h1>
          <p>Please screenshot this and send it to the developer:</p>
          <pre style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '5px', overflowX: 'auto', fontSize: '12px', color: '#cbd5e1' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => {
                localStorage.clear();
                window.location.reload();
            }}
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#06b6d4', border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold' }}
          >
            Clear Cache & Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
  </React.StrictMode>
);