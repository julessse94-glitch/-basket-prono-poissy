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
      minHeight: '100vh', background: '#0A0A0A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏀</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#555' }}>Chargement...</div>
      </div>
    </div>
  );

  if (!session) return <Auth />;
  if (!profile) return <Profile userId={session.user.id} onProfileCreated={setProfile} />;

  const TABS = [
    { id: 'matches', icon: '🏀', label: 'NBA' },
    { id: 'classement', icon: '🏆', label: 'Classement' },
    { id: 'profil', icon: '👤', label: 'Profil' },
  ];

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      background: '#0D0D0D',
      minHeight: '100vh',
      color: '#fff',
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
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(183,148,244,0.3) } 50% { box-shadow: 0 0 40px rgba(183,148,244,0.6) } }
      `}</style>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(183,148,244,0.1)',
        padding: '12px 20px 10px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mini logo */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#141414',
              border: '1px solid rgba(183,148,244,0.3)',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img src="/logo-cslr.png" alt="CSLR" style={{ width: '85%', height: '85%', objectFit: 'contain' }}
                onError={e => { e.target.style.display='none'; }} />
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#B794F4', fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                HOOP PRONO · CSLR
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginTop: 1 }}>
                {activeTab === 'matches' && 'NBA Playoffs 🏀'}
                {activeTab === 'classement' && 'Classement 🏆'}
                {activeTab === 'profil' && 'Mon Profil'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeTab === 'profil' && (
              <button onClick={() => setShowSettings(true)} style={{
                width: 38, height: 38, borderRadius: '50%',
                background: '#1A1A1A', border: '1px solid rgba(183,148,244,0.2)',
                cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>⚙️</button>
            )}
            <div style={{
              background: 'linear-gradient(135deg, #B794F4, #9B6FD4)',
              borderRadius: 14, padding: '6px 14px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: '0 4px 16px rgba(183,148,244,0.3)',
            }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 1 }}>PTS</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{profile.points || 0}</div>
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
        background: 'rgba(10,10,10,0.97)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(183,148,244,0.15)',
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
                width: 46, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, fontSize: 20,
                background: active ? 'linear-gradient(135deg, #B794F4, #9B6FD4)' : 'transparent',
                boxShadow: active ? '0 4px 16px rgba(183,148,244,0.4)' : 'none',
                transition: 'all 0.2s',
              }}>{t.icon}</div>
              <span style={{
                fontSize: 9, fontWeight: active ? 700 : 500,
                fontFamily: "'Space Mono', monospace",
                color: active ? '#B794F4' : '#444',
                letterSpacing: 0.5,
              }}>{t.label.toUpperCase()}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
