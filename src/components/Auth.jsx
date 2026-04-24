import { useState } from 'react';
import { supabase } from '../supabase';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "'Syne', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: '40px 30px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏀</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Poissy Basket
          </div>
          <div style={{ fontSize: 14, color: '#c9a0dc', fontFamily: "'DM Mono', monospace" }}>
            Pronostics entre membres du club
          </div>
        </div>

        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              color: '#aaa',
              marginBottom: 8,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
            }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: 14,
                fontFamily: "'Syne', sans-serif",
              }}
              placeholder="ton.email@example.com"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              color: '#aaa',
              marginBottom: 8,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
            }}>MOT DE PASSE</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: 14,
                fontFamily: "'Syne', sans-serif",
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: 13,
              marginBottom: 16,
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg, #FFD700, #c9a0dc)',
              color: '#1a0a2e',
              fontSize: 15,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontFamily: "'Syne', sans-serif",
            }}
          >
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#c9a0dc',
              fontSize: 13,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: "'Syne', sans-serif",
            }}
          >
            {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
    </div>
  );
}
