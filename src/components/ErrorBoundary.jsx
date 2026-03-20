import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App crash capturado:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #b41e1e 0%, #7a0e0e 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '40px',
            maxWidth: '380px', width: '100%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ color: '#b41e1e', fontSize: '20px', fontWeight: '700', margin: '0 0 10px' }}>
              Algo salió mal
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 28px', lineHeight: '1.5' }}>
              La aplicación encontró un error inesperado. Por favor recarga la página para continuar.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #b41e1e, #7a0e0e)',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '16px', fontWeight: '700', cursor: 'pointer',
              }}
            >
              🔄 Recargar aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
