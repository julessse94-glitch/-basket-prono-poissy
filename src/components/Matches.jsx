import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Matches({ profile }) {
  const [matches, setMatches] = useState([]);
  const [pronos, setPronos] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadMatches();
    loadPronos();
  }, []);

  const loadMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true });
    
    if (data) setMatches(data);
    setLoading(false);
  };

  const loadPronos = async () => {
    const { data } = await supabase
      .from('pronostics')
      .select('*')
      .eq('user_id', profile.id);
    
    if (data) {
      const pronosMap = {};
      data.forEach(p => {
        pronosMap[p.match_id] = p;
      });
      setPronos(pronosMap);
    }
  };

  const handleProno = async (matchId, field, value) => {
    const existing = pronos[matchId] || {};
    const updated = { ...existing, [field]: value };
    
    setPronos(prev => ({ ...prev, [matchId]: updated }));
  };

  const submitProno = async (matchId) => {
    const prono = pronos[matchId];
    if (!prono || !prono.vainqueur) {
      showToast('Choisis au moins le vainqueur !', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('pronostics')
        .upsert({
          user_id: profile.id,
          match_id: matchId,
          vainqueur: prono.vainqueur,
          ecart: prono.ecart || null,
          submitted: true,
        });

      if (error) throw error;

      showToast('Prono validé ! 🎯');
      loadPronos();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#aaa' }}>
        Chargement des matchs...
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏀</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          Aucun match pour le moment
        </div>
        <div style={{ fontSize: 14, color: '#aaa' }}>
          Les matchs seront ajoutés prochainement
        </div>
      </div>
    );
  }

  const now = new Date();

  return (
    <div style={{ padding: '0 16px 100px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {matches.map((match, i) => {
          const matchDate = new Date(match.match_date);
          const isPast = matchDate < now || match.status === 'finished';
          const prono = pronos[match.match_id];
          const isSubmitted = prono?.submitted;

          let correct = null;
          let pointsGagnes = 0;
          
          if (isPast && isSubmitted) {
            const actualWinner = match.home_score > match.away_score ? 'home' : 'away';
            const ecartReel = Math.abs(match.home_score - match.away_score);
            
            if (prono.vainqueur === actualWinner) {
              correct = true;
              pointsGagnes = 100;
              
              if (prono.ecart && Math.abs(prono.ecart - ecartReel) <= 2) {
                pointsGagnes = 200;
              }
            } else {
              correct = false;
            }
          }

          return (
            <div
              key={match.match_id}
              style={{
                background: correct === true
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.06))'
                  : correct === false
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))'
                  : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${
                  correct === true
                    ? 'rgba(16, 185, 129, 0.35)'
                    : correct === false
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(255, 255, 255, 0.08)'
                }`,
                borderRadius: 20,
                padding: '16px',
                animation: `slideUp 0.4s ease ${i * 0.06}s both`,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  fontSize: 11,
                  color: '#c9a0dc',
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 700,
                }}>{match.equipe}</div>
                <div style={{ fontSize: 11, color: '#666', fontFamily: "'DM Mono', monospace" }}>
                  {matchDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Teams */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <button
                  onClick={() => !isPast && !isSubmitted && handleProno(match.match_id, 'vainqueur', 'home')}
                  disabled={isPast || isSubmitted}
                  style={{
                    flex: 1,
                    padding: '14px 10px',
                    borderRadius: 14,
                    border: `2px solid ${prono?.vainqueur === 'home' ? '#FFD700' : 'rgba(255, 255, 255, 0.1)'}`,
                    background: prono?.vainqueur === 'home' ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: isPast || isSubmitted ? 'default' : 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                    {match.home_team}
                  </div>
                  <div style={{ fontSize: 10, color: '#888', fontFamily: "'DM Mono', monospace" }}>
                    Domicile
                  </div>
                  {isPast && (
                    <div style={{
                      fontSize: 28,
                      fontWeight: 800,
                      marginTop: 6,
                      color: match.home_score > match.away_score ? '#10B981' : '#fff',
                    }}>
                      {match.home_score}
                    </div>
                  )}
                  {prono?.vainqueur === 'home' && !isPast && (
                    <div style={{ fontSize: 10, color: '#FFD700', marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
                      ✓ MON PRONO
                    </div>
                  )}
                </button>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 32,
                }}>
                  <div style={{ fontSize: 10, color: '#444', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
                    VS
                  </div>
                  {correct === true && <div style={{ fontSize: 18, marginTop: 4 }}>✅</div>}
                  {correct === false && <div style={{ fontSize: 18, marginTop: 4 }}>❌</div>}
                </div>

                <button
                  onClick={() => !isPast && !isSubmitted && handleProno(match.match_id, 'vainqueur', 'away')}
                  disabled={isPast || isSubmitted}
                  style={{
                    flex: 1,
                    padding: '14px 10px',
                    borderRadius: 14,
                    border: `2px solid ${prono?.vainqueur === 'away' ? '#FFD700' : 'rgba(255, 255, 255, 0.1)'}`,
                    background: prono?.vainqueur === 'away' ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: isPast || isSubmitted ? 'default' : 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                    {match.away_team}
                  </div>
                  <div style={{ fontSize: 10, color: '#888', fontFamily: "'DM Mono', monospace" }}>
                    Extérieur
                  </div>
                  {isPast && (
                    <div style={{
                      fontSize: 28,
                      fontWeight: 800,
                      marginTop: 6,
                      color: match.away_score > match.home_score ? '#10B981' : '#fff',
                    }}>
                      {match.away_score}
                    </div>
                  )}
                  {prono?.vainqueur === 'away' && !isPast && (
                    <div style={{ fontSize: 10, color: '#FFD700', marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
                      ✓ MON PRONO
                    </div>
                  )}
                </button>
              </div>

              {/* Ecart prono */}
              {!isPast && !isSubmitted && prono?.vainqueur && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 11,
                    color: '#aaa',
                    marginBottom: 6,
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    PRONO ÉCART (optionnel, +100 pts si ±2 pts)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={prono?.ecart || ''}
                    onChange={(e) => handleProno(match.match_id, 'ecart', parseInt(e.target.value) || null)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: 14,
                      fontFamily: "'Syne', sans-serif",
                    }}
                    placeholder="Ex: 12 points d'écart"
                  />
                </div>
              )}

              {/* Submit button */}
              {!isPast && prono?.vainqueur && !isSubmitted && (
                <button
                  onClick={() => submitProno(match.match_id)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #FFD700, #c9a0dc)',
                    color: '#1a0a2e',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  🎯 Valider mon prono
                </button>
              )}

              {/* Results */}
              {correct === true && (
                <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: '#10B981', fontWeight: 700 }}>
                  +{pointsGagnes} pts remportés ! 🎉
                </div>
              )}
              {correct === false && (
                <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: '#ef4444', fontWeight: 700 }}>
                  Raté... Retente ta chance sur les prochains matchs !
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10B981, #059669)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: 20,
          fontWeight: 800,
          fontSize: 13,
          fontFamily: "'Syne', sans-serif",
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
