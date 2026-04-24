import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Matches from './components/Matches';
import Classement from './components/Classement';
import AdminMatches from './components/AdminMatches';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setProfile(data);
    setLoading(false);
  };

  const handleProfileCreated = (newProfile) => {
    setProfile(newProfile);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Syne', sans-serif",
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏀</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Chargement...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (!profile) {
    return <Profile userId={session.user.id} onProfileCreated={handleProfileCreated} />;
  }

  const TABS = [
    { id: 'matches', icon: '🏀', label: 'Matchs' },
    { id: 'classement', icon: '🏆', label: 'Classement' },
    { id: 'profil', icon: '👤', label: 'Profil' },
  ];

  // Add admin tab if user is admin
  if (profile.is_admin) {
    TABS.push({ id: 'admin', icon: '⚙️', label: 'Admin' });
  }

  return (
    <div style={{
      fontFamily: "'Syne', sans-serif",
      background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)',
      minHeight: '100vh',
      color: '#fff',
      maxWidth: 480,
      margin: '0 auto',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { outline: none; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>

      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(26, 10, 46, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px 16px 12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{
              fontSize: 9,
              letterSpacing: 3,
              color: '#FFD700',
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
            }}>POISSY BASKET</div>
            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, marginTop: 1 }}>
              {activeTab === 'matches' && 'Les Matchs 🏀'}
              {activeTab === 'classement' && 'Classement 🏆'}
              {activeTab === 'profil' && 'Mon Profil 👤'}
              {activeTab === 'admin' && 'Administration ⚙️'}
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #FFD700, #c9a0dc)',
            borderRadius: 14,
            padding: '7px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{
              fontSize: 8,
              color: 'rgba(26, 10, 46, 0.6)',
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
              letterSpacing: 1,
            }}>MES PTS</div>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#1a0a2e',
              lineHeight: 1,
            }}>{profile.points || 0}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 0', minHeight: 'calc(100vh - 160px)', animation: 'fadeIn 0.3s ease' }}>
        {activeTab === 'matches' && <Matches profile={profile} />}
        {activeTab === 'classement' && <Classement profile={profile} />}
        {activeTab === 'profil' && (
          <Profile
            userId={session.user.id}
            existingProfile={profile}
            onProfileUpdated={setProfile}
            onSignOut={() => supabase.auth.signOut()}
          />
        )}
        {activeTab === 'admin' && profile.is_admin && <AdminMatches />}
      </div>

      {/* Bottom Nav */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: 'rgba(26, 10, 46, 0.98)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 0 24px',
        zIndex: 200,
      }}>
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '4px 12px',
                borderRadius: 12,
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 38,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                fontSize: 18,
                background: active ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                transition: 'all 0.2s',
              }}>{t.icon}</div>
              <span style={{
                fontSize: 9,
                fontWeight: active ? 800 : 600,
                fontFamily: "'DM Mono', monospace",
                color: active ? '#FFD700' : '#666',
                transition: 'all 0.2s',
                letterSpacing: 0.5,
              }}>{t.label.toUpperCase()}</span>
              {active && <div style={{ width: 4, height: 4, borderRadius: 2, background: '#FFD700' }} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
