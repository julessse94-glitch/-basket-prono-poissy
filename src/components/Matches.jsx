import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

const NBA_LOGOS = {
  BOS: 'https://cdn.nba.com/logos/nba/1610612738/global/L/logo.svg',
  PHI: 'https://cdn.nba.com/logos/nba/1610612755/global/L/logo.svg',
  NYK: 'https://cdn.nba.com/logos/nba/1610612752/global/L/logo.svg',
  ATL: 'https://cdn.nba.com/logos/nba/1610612737/global/L/logo.svg',
  CLE: 'https://cdn.nba.com/logos/nba/1610612739/global/L/logo.svg',
  TOR: 'https://cdn.nba.com/logos/nba/1610612761/global/L/logo.svg',
  DET: 'https://cdn.nba.com/logos/nba/1610612765/global/L/logo.svg',
  ORL: 'https://cdn.nba.com/logos/nba/1610612753/global/L/logo.svg',
  OKC: 'https://cdn.nba.com/logos/nba/1610612760/global/L/logo.svg',
  PHX: 'https://cdn.nba.com/logos/nba/1610612756/global/L/logo.svg',
  SAS: 'https://cdn.nba.com/logos/nba/1610612759/global/L/logo.svg',
  POR: 'https://cdn.nba.com/logos/nba/1610612757/global/L/logo.svg',
  DEN: 'https://cdn.nba.com/logos/nba/1610612743/global/L/logo.svg',
  MIN: 'https://cdn.nba.com/logos/nba/1610612750/global/L/logo.svg',
  LAL: 'https://cdn.nba.com/logos/nba/1610612747/global/L/logo.svg',
  HOU: 'https://cdn.nba.com/logos/nba/1610612745/global/L/logo.svg',
};

const SERIES_ORDER = ['BOS_PHI', 'NYK_ATL', 'CLE_TOR', 'DET_ORL', 'OKC_PHX', 'SAS_POR', 'DEN_MIN', 'LAL_HOU'];
const SERIES_CONF = {
  BOS_PHI: 'EST', NYK_ATL: 'EST', CLE_TOR: 'EST', DET_ORL: 'EST',
  OKC_PHX: 'OUEST', SAS_POR: 'OUEST', DEN_MIN: 'OUEST', LAL_HOU: 'OUEST',
};

function TeamLogo({ abbr, size = 52 }) {
  const [err, setErr] = useState(false);
  const FALLBACK = { BOS:'☘️',PHI:'🔔',NYK:'🗽',ATL:'🦅',CLE:'⚔️',TOR:'🦕',DET:'⚙️',ORL:'✨',OKC:'⚡',PHX:'☀️',SAS:'🤠',POR:'🌲',DEN:'⛰️',MIN:'🐺',LAL:'💜',HOU:'🚀' };
  if (err || !NBA_LOGOS[abbr]) return <div style={{ fontSize: size * 0.55, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{FALLBACK[abbr] || '🏀'}</div>;
  return <img src={NBA_LOGOS[abbr]} alt={abbr} width={size} height={size} onError={() => setErr(true)} style={{ objectFit: 'contain', display: 'block' }} />;
}

export default function Matches({ profile }) {
  const [games, setGames] = useState([]);
  const [pronos, setPronos] = useState({});
  const [statusFilter, setStatusFilter] = useState('upcoming'); // 'upcoming' | 'finished'
  const [confFilter, setConfFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadAll();
    intervalRef.current = setInterval(loadAll, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const loadAll = async () => {
    await Promise.all([loadGames(), loadPronos()]);
    setLoading(false);
  };

  const loadGames = async () => {
    const { data } = await supabase
      .from('nba_games')
      .select('*')
      .order('game_date', { ascending: true });
    if (data) setGames(data);
  };

  const loadPronos = async () => {
    const { data } = await supabase
      .from('pronostics').select('*').eq('user_id', profile.id);
    if (data) {
      const map = {};
      data.forEach(p => { if (p.nba_serie_id) map[p.nba_serie_id] = p; });
      setPronos(map);
    }
  };

  const handlePick = (gameId, pick) => {
    if (pronos[gameId]?.submitted) return;
    setPronos(prev => ({ ...prev, [gameId]: { ...prev[gameId], vainqueur: pick } }));
  };

  const submitProno = async (gameId, game) => {
    const prono = pronos[gameId];
    if (!prono?.vainqueur) { showToast("Choisis une équipe !", 'error'); return; }
    const { error } = await supabase.from('pronostics').upsert({
      user_id: profile.id, nba_serie_id: gameId,
      vainqueur: prono.vainqueur, submitted: true,
    }, { onConflict: 'user_id,nba_serie_id' });
    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    showToast('Prono validé ! 🎯');
    loadAll();
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Organiser par série
  const bySerieId = {};
  games.forEach(g => {
    if (!bySerieId[g.serie_id]) bySerieId[g.serie_id] = [];
    bySerieId[g.serie_id].push(g);
  });

  // Pour chaque série, trouver le prochain match (upcoming) et le dernier terminé
  const seriesData = SERIES_ORDER.map(sid => {
    const serieGames = (bySerieId[sid] || []).sort((a, b) => a.game_num - b.game_num);
    const finished = serieGames.filter(g => g.status === 'finished');
    const upcoming = serieGames.filter(g => g.status === 'upcoming' || g.status === 'scheduled');
    const live = serieGames.find(g => g.status === 'inprogress');
    const lastFinished = finished[finished.length - 1] || null;
    const nextGame = live || upcoming[0] || null;
    const isEliminated = finished.length > 0 && !nextGame && !live;
    const record = lastFinished?.serie_record || '';
    const conf = SERIES_CONF[sid];
    return { sid, conf, serieGames, lastFinished, nextGame, live: !!live, isEliminated, record, nextDate: nextGame?.game_date || null };
  });

  // Filtrer et trier
  const filteredSeries = seriesData
    .filter(s => confFilter === 'all' || s.conf === confFilter)
    .filter(s => {
      if (statusFilter === 'upcoming') return !s.isEliminated;
      if (statusFilter === 'finished') return s.isEliminated;
      return true;
    })
    // Trier par date du prochain match (les plus proches en premier)
    .sort((a, b) => {
      if (!a.nextDate && !b.nextDate) return 0;
      if (!a.nextDate) return 1;
      if (!b.nextDate) return -1;
      return new Date(a.nextDate) - new Date(b.nextDate);
    });

  const upcomingCount = seriesData.filter(s => !s.isEliminated).length;
  const finishedCount = seriesData.filter(s => s.isEliminated).length;
  const totalPronos = Object.keys(pronos).filter(k => pronos[k]?.submitted).length;

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#BBB', fontFamily: "'Outfit', sans-serif" }}>Chargement...</div>;

  return (
    <div style={{ padding: '0 16px 100px', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>

      {/* Banner */}
      <div style={{ background: '#1A1A2E', borderRadius: 20, padding: '16px 20px', marginBottom: 16, boxShadow: '0 4px 24px rgba(26,26,46,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,215,0,0.4)', fontFamily: "'Space Mono', monospace", letterSpacing: 1, marginBottom: 4 }}>NBA · PLAYOFFS 2026 · 1ER TOUR</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Prochain match de chaque série</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 3, fontFamily: "'Space Mono', monospace" }}>
              {totalPronos} prono{totalPronos > 1 ? 's' : ''} posé{totalPronos > 1 ? 's' : ''} · 100 pts par bon prono
            </div>
          </div>
          <div style={{ fontSize: 30 }}>🏆</div>
        </div>
      </div>

      {/* Onglets À venir / Terminés */}
      <div style={{ display: 'flex', background: '#EBEBEB', borderRadius: 14, padding: 4, marginBottom: 14, gap: 0 }}>
        <button onClick={() => setStatusFilter('upcoming')} style={{
          flex: 1, padding: '9px', borderRadius: 11, border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 700,
          background: statusFilter === 'upcoming' ? '#fff' : 'transparent',
          color: statusFilter === 'upcoming' ? '#1A1A2E' : '#AAA',
          boxShadow: statusFilter === 'upcoming' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.2s',
        }}>
          ⏳ En cours ({upcomingCount})
        </button>
        <button onClick={() => setStatusFilter('finished')} style={{
          flex: 1, padding: '9px', borderRadius: 11, border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 700,
          background: statusFilter === 'finished' ? '#fff' : 'transparent',
          color: statusFilter === 'finished' ? '#1A1A2E' : '#AAA',
          boxShadow: statusFilter === 'finished' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.2s',
        }}>
          ✅ Terminées ({finishedCount})
        </button>
      </div>

      {/* Filtre conférence */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['all', 'Toutes'], ['EST', '🏀 Est'], ['OUEST', '⚡ Ouest']].map(([id, label]) => (
          <button key={id} onClick={() => setConfFilter(id)} style={{
            flex: 1, padding: '8px', borderRadius: 12, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700,
            background: confFilter === id ? '#1A1A2E' : '#fff',
            color: confFilter === id ? '#FFD700' : '#999',
            boxShadow: confFilter === id ? '0 2px 10px rgba(26,26,46,0.2)' : '0 1px 4px rgba(0,0,0,0.05)',
            transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {filteredSeries.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', borderRadius: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 15, color: '#BBB' }}>Aucune série dans cette catégorie</div>
        </div>
      )}

      {/* Séries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredSeries.map(({ sid, conf, lastFinished, nextGame, live, isEliminated, record }, si) => {
          const activeGameId = nextGame?.id;
          const prono = pronos[activeGameId];
          const isSubmitted = prono?.submitted;
          const lastWinner = lastFinished ? (lastFinished.home_score > lastFinished.away_score ? lastFinished.home : lastFinished.away) : null;
          const lastProno = lastFinished ? pronos[lastFinished.id] : null;
          const lastPronoCorrect = lastProno?.submitted && lastWinner && lastProno.vainqueur === lastWinner;
          const lastPronoWrong = lastProno?.submitted && lastWinner && lastProno.vainqueur !== lastWinner;
          const nextHome = nextGame?.home;
          const nextAway = nextGame?.away;

          return (
            <div key={sid} style={{
              background: '#fff', borderRadius: 22, overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              animation: `slideUp 0.35s ease ${si * 0.05}s both`,
            }}>
              {/* Header série */}
              <div style={{ padding: '11px 16px', background: isEliminated ? '#F8F7F4' : '#FAFAFA', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: conf === 'EST' ? '#3B82F6' : '#F97316', background: conf === 'EST' ? '#EFF6FF' : '#FFF7ED', padding: '3px 8px', borderRadius: 6, fontFamily: "'Space Mono', monospace" }}>{conf}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <TeamLogo abbr={lastFinished?.home || nextGame?.home} size={18} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#CCC' }}>vs</span>
                    <TeamLogo abbr={lastFinished?.away || nextGame?.away} size={18} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1A1A2E' }}>
                    {(nextGame?.home_name || lastFinished?.home_name || '').split(' ').pop()} vs {(nextGame?.away_name || lastFinished?.away_name || '').split(' ').pop()}
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: isEliminated ? '#059669' : '#999', fontFamily: "'Space Mono', monospace" }}>{record}</div>
              </div>

              {/* Éliminé */}
              {isEliminated && (
                <div style={{ padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#059669', fontWeight: 700, marginBottom: 6 }}>Série terminée ✅</div>
                  {lastFinished && (
                    <div style={{ fontSize: 12, color: '#BBB' }}>
                      Dernier match — {lastFinished.home_name} {lastFinished.home_score} - {lastFinished.away_score} {lastFinished.away_name}
                    </div>
                  )}
                </div>
              )}

              {/* Dernier résultat */}
              {!isEliminated && lastFinished && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F8F8F8' }}>
                  <div style={{ fontSize: 10, color: '#CCC', fontFamily: "'Space Mono', monospace", marginBottom: 10, letterSpacing: 1 }}>
                    DERNIER RÉSULTAT — GAME {lastFinished.game_num}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <TeamLogo abbr={lastFinished.home} size={38} />
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#999', marginTop: 4 }}>{lastFinished.home}</div>
                      <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4, color: lastWinner === lastFinished.home ? '#059669' : '#CCC' }}>{lastFinished.home_score}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 10, color: '#E0E0E0', fontFamily: "'Space Mono', monospace" }}>—</div>
                      {lastPronoCorrect && <div style={{ fontSize: 18 }}>✅</div>}
                      {lastPronoWrong && <div style={{ fontSize: 18 }}>❌</div>}
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <TeamLogo abbr={lastFinished.away} size={38} />
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#999', marginTop: 4 }}>{lastFinished.away}</div>
                      <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4, color: lastWinner === lastFinished.away ? '#059669' : '#CCC' }}>{lastFinished.away_score}</div>
                    </div>
                  </div>
                  {lastPronoCorrect && <div style={{ marginTop: 8, textAlign: 'center', fontSize: 11, color: '#059669', fontWeight: 700 }}>Ton prono était bon ! +100 pts 🎉</div>}
                  {lastPronoWrong && <div style={{ marginTop: 8, textAlign: 'center', fontSize: 11, color: '#EF4444', fontWeight: 700 }}>Raté sur ce match</div>}
                </div>
              )}

              {/* Prochain match */}
              {!isEliminated && nextGame && (
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: live ? '#E84545' : '#BBB', fontFamily: "'Space Mono', monospace", letterSpacing: 0.5, fontWeight: 700 }}>
                      {live ? `🔴 EN DIRECT — GAME ${nextGame.game_num}` : `PROCHAIN — GAME ${nextGame.game_num}`}
                    </div>
                    <div style={{ fontSize: 10, color: '#CCC', fontFamily: "'Space Mono', monospace" }}>
                      {new Date(nextGame.game_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {nextGame.win_prob_home && !live && !isSubmitted && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${nextGame.win_prob_home}%`, background: '#1A1A2E' }} />
                        <div style={{ flex: 1, background: '#E8E8E8' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 9, color: '#BBB', fontFamily: "'Space Mono', monospace" }}>{nextHome} {nextGame.win_prob_home}%</span>
                        <span style={{ fontSize: 9, color: '#BBB', fontFamily: "'Space Mono', monospace" }}>{nextAway} {nextGame.win_prob_away}%</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    {['home', 'away'].map(side => {
                      const abbr = side === 'home' ? nextHome : nextAway;
                      const name = side === 'home' ? nextGame.home_name : nextGame.away_name;
                      const picked = prono?.vainqueur === side;
                      return (
                        <button key={side}
                          onClick={() => !live && !isSubmitted && handlePick(activeGameId, side)}
                          disabled={live || isSubmitted}
                          style={{
                            flex: 1, padding: '14px 8px', borderRadius: 16, textAlign: 'center',
                            border: `2px solid ${picked ? '#1A1A2E' : '#F0F0F0'}`,
                            background: picked ? '#1A1A2E' : '#FAFAFA',
                            cursor: live || isSubmitted ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                            <TeamLogo abbr={abbr} size={46} />
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, color: picked ? '#FFD700' : '#1A1A2E' }}>{name}</div>
                          <div style={{ fontSize: 9, color: picked ? 'rgba(255,215,0,0.5)' : '#CCC', marginTop: 3, fontFamily: "'Space Mono', monospace" }}>
                            {side === 'home' ? 'DOM' : 'EXT'}
                          </div>
                          {picked && !live && <div style={{ fontSize: 9, color: '#FFD700', marginTop: 4, fontFamily: "'Space Mono', monospace" }}>✓ MON PRONO</div>}
                        </button>
                      );
                    })}
                  </div>

                  {!live && prono?.vainqueur && !isSubmitted && (
                    <button onClick={() => submitProno(activeGameId, nextGame)} style={{
                      width: '100%', marginTop: 10, padding: '13px', borderRadius: 12, border: 'none',
                      background: '#1A1A2E', color: '#FFD700', fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    }}>🎯 Valider — 100 pts si correct !</button>
                  )}
                  {live && <div style={{ marginTop: 10, textAlign: 'center', fontSize: 11, color: '#E84545', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>🔴 MATCH EN COURS — PRONOS FERMÉS</div>}
                  {isSubmitted && !live && <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: '#059669', fontWeight: 700 }}>Prono soumis ✅ — Résultat cette nuit !</div>}
                </div>
              )}

              {!isEliminated && !nextGame && (
                <div style={{ padding: '14px', textAlign: 'center', color: '#CCC', fontSize: 13 }}>
                  Prochain match bientôt annoncé...
                </div>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#EF4444' : '#1A1A2E',
          color: toast.type === 'error' ? '#fff' : '#FFD700',
          padding: '12px 24px', borderRadius: 20, fontWeight: 700, fontSize: 14,
          fontFamily: "'Outfit', sans-serif", zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', whiteSpace: 'nowrap',
          animation: 'slideUp 0.3s ease',
        }}>{toast.msg}</div>
      )}
    </div>
  );
}
