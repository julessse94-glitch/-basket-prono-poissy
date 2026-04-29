import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Matches from './components/Matches';
import Classement from './components/Classement';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel(`profile-${profile.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'profiles', filter: `id=eq.${profile.id}`,
      }, payload => setProfile(payload.new))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [profile?.id]);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
    setLoading(false);
  };

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#F8F7F4',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏀</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#BBB' }}>Chargement...</div>
      </div>
    </div>
  );

  if (!session) return <Auth />;
  if (!profile) return <Profile userId={session.user.id} onProfileCreated={setProfile} />;

  const TABS = [
    { id: 'matches', icon: '🏀', label: 'Matchs' },
    { id: 'classement', icon: '🏆', label: 'Classement' },
    { id: 'profil', icon: '👤', label: 'Profil' },
  ];

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      background: '#F8F7F4',
      minHeight: '100vh',
      color: '#1A1A2E',
      maxWidth: 480,
      margin: '0 auto',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { outline: none; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(248,247,244,0.96)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '14px 20px 12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{
              fontSize: 10, letterSpacing: 2, color: '#CCC',
              fontFamily: "'Space Mono', monospace", fontWeight: 700, marginBottom: 2,
            }}>HOOP PRONO</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1A2E', lineHeight: 1.2 }}>
              {activeTab === 'matches' && 'NBA Playoffs 🏀'}
              {activeTab === 'classement' && 'Classement 🏆'}
              {activeTab === 'profil' && 'Mon Profil'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Roue paramètres — uniquement sur l'onglet profil */}
            {activeTab === 'profil' && (
              <button
                onClick={() => setShowSettings(true)}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#fff', border: '1px solid #F0F0F0',
                  cursor: 'pointer', fontSize: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s',
                }}
              >⚙️</button>
            )}

            {/* Compteur de points */}
            <div style={{
              background: '#1A1A2E', borderRadius: 16, padding: '8px 16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{ fontSize: 9, color: 'rgba(255,215,0,0.5)', fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 1 }}>PTS</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFD700', lineHeight: 1 }}>{profile.points || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 0', minHeight: 'calc(100vh - 140px)', animation: 'fadeIn 0.3s ease' }}>
        {activeTab === 'matches' && <Matches profile={profile} />}
        {activeTab === 'classement' && <Classement profile={profile} />}
        {activeTab === 'profil' && (
          <Profile
            userId={session.user.id}
            existingProfile={profile}
            onProfileUpdated={setProfile}
            showSettings={showSettings}
            onCloseSettings={() => setShowSettings(false)}
            onSignOut={() => supabase.auth.signOut()}
          />
        )}
      </div>

      {/* Bottom Nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', justifyContent: 'space-around',
        padding: '10px 0 24px', zIndex: 200,
      }}>
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '4px 20px', transition: 'all 0.2s',
            }}>
              <div style={{
                width: 44, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, fontSize: 20,
                background: active ? '#1A1A2E' : 'transparent',
                transition: 'all 0.2s',
              }}>{t.icon}</div>
              <span style={{
                fontSize: 9, fontWeight: active ? 700 : 500,
                fontFamily: "'Space Mono', monospace",
                color: active ? '#1A1A2E' : '#CCC',
                letterSpacing: 0.5,
              }}>{t.label.toUpperCase()}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
