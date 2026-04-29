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
      background: '#F8F7F4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'Outfit', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #BBB; }
        input:focus { outline: none; border-color: #1A1A2E !important; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: '#1A1A2E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 40,
          }}>🏀</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#1A1A2E', letterSpacing: -1 }}>
            Hoop Prono
          </div>
          <div style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
            NBA Playoffs 2026 🏆
          </div>
        </div>

        <div style={{
          background: '#fff', borderRadius: 24, padding: '32px 28px',
          boxShadow: '0 4px 40px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 24 }}>
            {isLogin ? 'Bon retour 👋' : 'Rejoins le jeu 🏀'}
          </div>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999', marginBottom: 8, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>
                EMAIL
              </label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 12,
                  border: '2px solid #F0F0F0', background: '#FAFAFA',
                  color: '#1A1A2E', fontSize: 15, fontFamily: "'Outfit', sans-serif",
                  transition: 'border-color 0.2s',
                }}
                placeholder="ton@email.com"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999', marginBottom: 8, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>
                MOT DE PASSE
              </label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                required minLength={6}
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 12,
                  border: '2px solid #F0F0F0', background: '#FAFAFA',
                  color: '#1A1A2E', fontSize: 15, fontFamily: "'Outfit', sans-serif",
                  transition: 'border-color 0.2s',
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: '#FFF0F0', border: '1px solid #FFD0D0',
                color: '#CC4444', fontSize: 13, marginBottom: 16,
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: '#1A1A2E', color: '#FFD700',
              fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: "'Outfit', sans-serif",
              transition: 'opacity 0.2s',
            }}>
              {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button onClick={() => { setIsLogin(!isLogin); setError(null); }} style={{
              background: 'none', border: 'none', color: '#BBB',
              fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
            }}>
              {isLogin ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
