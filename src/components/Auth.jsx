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
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
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
      background: '#0A0A0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'Outfit', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #555; }
        input:focus { outline: none; border-color: #B794F4 !important; }

        /* Fond ambiance */
        .auth-bg::before {
          content: '';
          position: absolute;
          top: -200px; left: -200px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(183,148,244,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .auth-bg::after {
          content: '';
          position: absolute;
          bottom: -200px; right: -200px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="auth-bg" style={{ width: '100%', maxWidth: 380, animation: 'fadeUp 0.5s ease' }}>

        {/* Logo CSLR */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 100, height: 100,
            borderRadius: '50%',
            background: '#0A0A0A',
            border: '2px solid rgba(183,148,244,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 40px rgba(183,148,244,0.2)',
            overflow: 'hidden',
          }}>
            <img
              src="/logo-cslr.png"
              alt="CSLR"
              style={{ width: '90%', height: '90%', objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#B794F4' }}>CS</span>
            </div>
          </div>
          <div style={{
            fontSize: 11, letterSpacing: 4, color: '#B794F4',
            fontFamily: "'Space Mono', monospace", fontWeight: 700, marginBottom: 8,
          }}>CERCLE SPORTIF LILAS ROMAINVILLE</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>
            Hoop Prono
          </div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 6, fontFamily: "'Space Mono', monospace" }}>
            NBA PLAYOFFS 2026 🏆
          </div>
        </div>

        {/* Card connexion */}
        <div style={{
          background: '#141414',
          borderRadius: 24,
          padding: '28px 24px',
          border: '1px solid rgba(183,148,244,0.15)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
            {isLogin ? 'Bon retour 👋' : 'Rejoins le jeu 🏀'}
          </div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
            {isLogin ? 'Connecte-toi pour voir tes pronos' : 'Crée ton compte gratuitement'}
          </div>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#B794F4', marginBottom: 8, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>
                EMAIL
              </label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 12,
                  border: '1px solid rgba(183,148,244,0.2)', background: '#0A0A0A',
                  color: '#fff', fontSize: 15, fontFamily: "'Outfit', sans-serif",
                  transition: 'border-color 0.2s',
                }}
                placeholder="ton@email.com"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#B794F4', marginBottom: 8, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>
                MOT DE PASSE
              </label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                required minLength={6}
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 12,
                  border: '1px solid rgba(183,148,244,0.2)', background: '#0A0A0A',
                  color: '#fff', fontSize: 15, fontFamily: "'Outfit', sans-serif",
                  transition: 'border-color 0.2s',
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#EF4444', fontSize: 13, marginBottom: 16,
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #B794F4, #9B6FD4)',
              color: '#fff',
              fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: "'Outfit', sans-serif",
              boxShadow: '0 4px 20px rgba(183,148,244,0.4)',
              transition: 'all 0.2s',
            }}>
              {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button onClick={() => { setIsLogin(!isLogin); setError(null); }} style={{
              background: 'none', border: 'none', color: '#555',
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
