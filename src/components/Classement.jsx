import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

function getCategorieLabel(user) {
  if (!user?.role) return '';
  if (user.role === 'parent') return `Parent ${user.categorie || ''}`;
  return user.categorie || '';
}

export default function Classement({ profile }) {
  const [classement, setClassement] = useState([]);
  const [groupeClassement, setGroupeClassement] = useState([]);
  const [tab, setTab] = useState(profile.groupe_code ? 'groupe' : 'mondial');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassement();
    const channel = supabase.channel('classement-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => loadClassement())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const loadClassement = async () => {
    const { data: mondial } = await supabase.from('profiles').select('*').order('points', { ascending: false });
    if (mondial) setClassement(mondial);
    if (profile.groupe_code) {
      const { data: groupe } = await supabase.from('profiles').select('*').eq('groupe_code', profile.groupe_code).order('points', { ascending: false });
      if (groupe) setGroupeClassement(groupe);
    }
    setLoading(false);
  };

  const activeList = tab === 'groupe' ? groupeClassement : classement;
  const myRank = activeList.findIndex(p => p.id === profile.id) + 1;

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#BBB', fontFamily: "'Outfit', sans-serif" }}>Chargement...</div>;

  return (
    <div style={{ padding: '0 16px 100px', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#EBEBEB', borderRadius: 14, padding: 4, marginBottom: 20 }}>
        {profile.groupe_code && (
          <button onClick={() => setTab('groupe')} style={{ flex: 1, padding: '10px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: tab === 'groupe' ? '#fff' : 'transparent', color: tab === 'groupe' ? '#1A1A2E' : '#AAA', boxShadow: tab === 'groupe' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
            👥 {profile.groupe_nom || 'Mon groupe'}
          </button>
        )}
        <button onClick={() => setTab('mondial')} style={{ flex: 1, padding: '10px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: tab === 'mondial' ? '#fff' : 'transparent', color: tab === 'mondial' ? '#1A1A2E' : '#AAA', boxShadow: tab === 'mondial' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
          🌍 Classement général
        </button>
      </div>

      {/* Pas de groupe */}
      {tab === 'groupe' && !profile.groupe_code && (
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>Pas encore de groupe</div>
          <div style={{ fontSize: 13, color: '#BBB' }}>Crée ou rejoins un groupe depuis ton profil ⚙️</div>
        </div>
      )}

      {/* My rank */}
      <div style={{ background: '#1A1A2E', borderRadius: 20, padding: '18px 22px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 24px rgba(26,26,46,0.15)' }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,215,0,0.4)', fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>
            {tab === 'groupe' ? `DANS ${(profile.groupe_nom || 'TON GROUPE').toUpperCase()}` : 'CLASSEMENT GÉNÉRAL'}
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#FFD700', lineHeight: 1 }}>#{myRank}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, fontFamily: "'Space Mono', monospace" }}>
            sur {activeList.length} joueur{activeList.length > 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,215,0,0.4)', fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>TES POINTS</div>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{profile.points || 0}</div>
        </div>
      </div>

      {/* Invite groupe */}
      {tab === 'groupe' && profile.groupe_code && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: '#BBB', fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>CODE DU GROUPE</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#1A1A2E', letterSpacing: 3, fontFamily: "'Space Mono', monospace" }}>{profile.groupe_code}</div>
          </div>
          <button onClick={() => navigator.clipboard.writeText(`Rejoins-moi sur Hoop Prono ! 🏀\nCode du groupe : ${profile.groupe_code}\nhttps://hoop-prono.vercel.app`)} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: '#1A1A2E', color: '#FFD700', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
            📤 Inviter
          </button>
        </div>
      )}

      {/* Podium */}
      {activeList.length >= 3 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          {[1, 0, 2].map(idx => {
            const user = activeList[idx];
            if (!user) return null;
            const heights = [84, 108, 66];
            const colors = ['#C0C0C0', '#FFD700', '#CD7F32'];
            const ranks = [2, 1, 3];
            const isMe = user.id === profile.id;
            return (
              <div key={idx} style={{ textAlign: 'center', animation: `slideUp 0.4s ease ${idx * 0.08}s both` }}>
                <div style={{ fontSize: 26, marginBottom: 3 }}>{user.avatar}</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 2, color: isMe ? '#F59E0B' : '#1A1A2E', maxWidth: 76, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isMe ? 'Toi' : user.pseudo}
                </div>
                <div style={{ fontSize: 9, color: '#AAA', marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>{getCategorieLabel(user)}</div>
                <div style={{ width: 76, height: heights[idx], background: isMe ? '#1A1A2E' : '#F0F0F0', border: `2px solid ${colors[idx]}`, borderRadius: '12px 12px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: colors[idx] }}>#{ranks[idx]}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isMe ? '#FFD700' : colors[idx], fontFamily: "'Space Mono', monospace" }}>{user.points}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeList.map((user, i) => {
          const isMe = user.id === profile.id;
          return (
            <div key={user.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: isMe ? '#1A1A2E' : '#fff',
              borderRadius: 16, padding: '12px 16px',
              boxShadow: isMe ? '0 4px 20px rgba(26,26,46,0.15)' : '0 1px 6px rgba(0,0,0,0.05)',
              animation: `slideUp 0.35s ease ${i * 0.04}s both`,
            }}>
              <div style={{ width: 28, textAlign: 'center', fontSize: 16, fontWeight: 800, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#CCC', fontFamily: "'Space Mono', monospace" }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: isMe ? 'rgba(255,215,0,0.1)' : '#F8F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, border: isMe ? '2px solid rgba(255,215,0,0.3)' : '2px solid #F0F0F0' }}>
                {user.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: isMe ? '#FFD700' : '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isMe ? 'Toi 👈' : user.pseudo}
                </div>
                <div style={{ fontSize: 10, color: isMe ? 'rgba(255,215,0,0.4)' : '#CCC', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                  {getCategorieLabel(user)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: isMe ? '#FFD700' : '#1A1A2E', fontFamily: "'Space Mono', monospace" }}>{user.points}</div>
                <div style={{ fontSize: 9, color: isMe ? 'rgba(255,215,0,0.4)' : '#CCC', fontFamily: "'Space Mono', monospace" }}>pts</div>
              </div>
            </div>
          );
        })}
      </div>

      {activeList.length === 0 && (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 16, color: '#BBB' }}>
            {tab === 'groupe' ? 'Sois le premier dans ton groupe !' : 'Sois le premier à pronostiquer !'}
          </div>
        </div>
      )}
    </div>
  );
}
