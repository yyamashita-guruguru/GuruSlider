import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback UI. If omitted, a default message is shown. */
  fallback?: React.ReactNode;
  /** Compact fallback (for wrapping a single slide, not the whole app). */
  compact?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Catches render-time errors in the subtree so a single failure does not
 * blank out the whole application. Fallback uses inline styles on purpose,
 * so it still renders even if the stylesheet failed to load.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const message = this.state.error?.message || '不明なエラー';

    if (this.props.compact) {
      return (
        <div style={{
          height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24,
          textAlign: 'center', color: '#334155', background: '#f8fafc',
          fontFamily: 'sans-serif',
        }}>
          <div style={{ fontWeight: 700 }}>このスライドの表示でエラーが発生しました</div>
          <div style={{ fontSize: 12, color: '#64748b', maxWidth: 480, wordBreak: 'break-word' }}>{message}</div>
          <button
            onClick={this.handleRetry}
            style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', cursor: 'pointer' }}
          >
            再表示を試す
          </button>
        </div>
      );
    }

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32,
        textAlign: 'center', color: '#e2e8f0', background: '#020617',
        fontFamily: 'sans-serif',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>表示中にエラーが発生しました</div>
        <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 560, wordBreak: 'break-word' }}>{message}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            onClick={this.handleRetry}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: '#fff', cursor: 'pointer' }}
          >
            再表示を試す
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #4f46e5', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
