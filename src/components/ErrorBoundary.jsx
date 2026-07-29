import React from 'react';

/**
 * Componente de clase ErrorBoundary para atrapar errores de JS en el renderizado
 * y desplegar una pantalla elegante de recuperación.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary capturó un error crítico:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#1c1c1e', // Elegant dark mode background
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛡️</div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0' }}>Algo no salió como esperábamos</h2>
          <p style={{ color: '#8e8e93', fontSize: '14px', maxWidth: '400px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            La aplicación experimentó un fallo imprevisto. Sin embargo, tus datos financieros están seguros en la nube.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#0a84ff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(10, 132, 255, 0.3)',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#0066cc'}
            onMouseOut={(e) => e.currentTarget.style.background = '#0a84ff'}
          >
            Recargar Aplicación
          </button>
          
          {this.state.error && (
            <div style={{
              marginTop: '32px',
              padding: '16px',
              backgroundColor: '#2c2c2e',
              borderRadius: '8px',
              textAlign: 'left',
              maxWidth: '800px',
              width: '100%',
              overflowX: 'auto',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#ff453a',
              border: '1px solid rgba(255, 69, 58, 0.3)',
              maxHeight: '30vh',
              overflowY: 'auto'
            }}>
              <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Error Details: {this.state.error.message}</strong>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{this.state.error.stack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
