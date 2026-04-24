import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Classement({ profile }) {
  const [classement, setClassement] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassement();
  }, []);

  const loadClassement = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('points', { ascending: false });
    
    if (data) setClassement(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#aaa' }}>
        Chargement du classement...
      </div>
    );
  }

  const filtered = filter === 'all' 
    ? classement 
    : classement.filter(p => p.equipe === filter);

  const myRank = filtered.findIndex(p => p.id === profile.id) + 1;

  // Get unique teams
  const equipes = ['all', ...new Set(classement.map(p => p.equipe))];

  return (
    <div style={{ padding: '0 16px 100px' }}>
      {/* Filter by team */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 11,
          color: '#aaa',
          fontFamily: "'DM Mono', monospace",
          marginBottom: 10,
          fontWeight: 700,
        }}>
          FILTRER PAR ÉQUIPE
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {equipes.map(eq => (
            <button
              key={eq}
              onClick={() => setFilter(eq)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'DM Mono', monospace",
                background: filter === eq ? 'linear-gradient(135deg, #FFD700, #c9a0dc)' : 'rgba(255, 255, 255, 0.06)',
                color: filter === eq ? '#1a0a2e' : '#888',
                transition: 'all 0.2s',
              }}
            >
              {eq === 'all' ? 'TOUT LE CLUB' : eq}
            </button>
          ))}
        </div>
      </div>

      {/* Your rank */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(201, 160, 220, 0.08))',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderRadius: 18,
        padding: '14px 16px',
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#aaa', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
            TON CLASSEMENT
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#FFD700', fontFamily: "'DM Mono', monospace" }}>
            #{myRank}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#aaa', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
            TES POINTS
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
            {profile.points}
          </div>
        </div>
      </div>

      {/* Podium */}
      {filtered.length >= 3 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          {[1, 0, 2].map(idx => {
            const user = filtered[idx];
            if (!user) return null;
            const heights = [80, 100, 64];
            const colors = ['#C0C0C0', '#FFD700', '#CD7F32'];
            const ranks = [2, 1, 3];

            return (
              <div key={idx} style={{ textAlign: 'center', animation: `slideUp 0.4s ease ${idx * 0.1}s both` }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{user.avatar}</div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: user.id === profile.id ? '#FFD700' : '#fff',
                  marginBottom: 8,
                  maxWidth: 70,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user.id === profile.id ? 'Toi' : user.pseudo}
                </div>
                <div style={{
                  width: 70,
                  height: heights[idx],
                  background: `linear-gradient(180deg, ${colors[idx]}33, ${colors[idx]}11)`,
                  border: `2px solid ${colors[idx]}`,
                  borderRadius: '10px 10px 0 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: colors[idx] }}>#{ranks[idx]}</div>
                  <div style={{ fontSize: 12, color: colors[idx], fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
                    {user.points}
                  </div>
                  <div style={{ fontSize: 8, color: `${colors[idx]}99`, fontFamily: "'DM Mono', monospace" }}>pts</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((user, i) => (
          <div
            key={user.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: user.id === profile.id
                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(201, 160, 220, 0.06))'
                : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${user.id === profile.id ? 'rgba(255, 215, 0, 0.35)' : 'rgba(255, 255, 255, 0.07)'}`,
              borderRadius: 16,
              padding: '12px 14px',
              animation: `slideUp 0.35s ease ${i * 0.05}s both`,
            }}
          >
            <div style={{
              width: 28,
              fontFamily: "'DM Mono', monospace",
              fontSize: 14,
              fontWeight: 800,
              color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#555',
              textAlign: 'center',
            }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
            </div>
            
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              background: 'rgba(255, 255, 255, 0.06)',
              border: user.id === profile.id ? '2px solid #FFD700' : '2px solid rgba(255, 255, 255, 0.1)',
              flexShrink: 0,
            }}>
              {user.avatar}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 800,
                fontSize: 13,
                color: user.id === profile.id ? '#FFD700' : '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user.id === profile.id ? 'Toi 👈' : user.pseudo}
              </div>
              <div style={{
                fontSize: 10,
                color: '#555',
                fontFamily: "'DM Mono', monospace",
                marginTop: 2,
              }}>
                {user.equipe} · {user.type === 'joueur' ? 'Joueur' : 'Parent'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 20,
                fontWeight: 800,
                color: user.id === profile.id ? '#FFD700' : '#fff',
                fontFamily: "'DM Mono', monospace",
              }}>
                {user.points}
              </div>
              <div style={{ fontSize: 9, color: '#555', fontFamily: "'DM Mono', monospace" }}>pts</div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <div style={{ fontSize: 16, color: '#aaa' }}>
            Aucun membre dans cette équipe
          </div>
        </div>
      )}
    </div>
  );
}
