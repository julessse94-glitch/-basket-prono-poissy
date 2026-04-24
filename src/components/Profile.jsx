import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const EQUIPES = [
  'Senior F',
  'U18-1',
  'U18-2',
  'U15-1',
  'U15-2',
  'U13-2',
  'U11 F',
  'U9',
];

const AVATARS = ['🏀', '🔥', '⭐', '⚡', '🦁', '🌙', '💫', '🎯', '👑', '🦅'];

export default function Profile({ userId, existingProfile, onProfileCreated, onProfileUpdated, onSignOut }) {
  const [pseudo, setPseudo] = useState('');
  const [type, setType] = useState('joueur');
  const [equipe, setEquipe] = useState('');
  const [avatar, setAvatar] = useState('🏀');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (existingProfile) {
      setPseudo(existingProfile.pseudo || '');
      setType(existingProfile.type || 'joueur');
      setEquipe(existingProfile.equipe || '');
      setAvatar(existingProfile.avatar || '🏀');
    }
  }, [existingProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const profileData = {
        id: userId,
        pseudo,
        type,
        equipe,
        avatar,
        points: existingProfile?.points || 0,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) throw error;

      if (existingProfile) {
        onProfileUpdated && onProfileUpdated(data);
      } else {
        onProfileCreated && onProfileCreated(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!existingProfile;

  return (
    <div style={{
      minHeight: isEditing ? 'auto' : '100vh',
      background: isEditing ? 'transparent' : 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)',
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
        padding: '32px 24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        {!isEditing && (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              Créer mon profil
            </div>
            <div style={{ fontSize: 13, color: '#aaa' }}>
              Quelques infos pour commencer
            </div>
          </div>
        )}

        {isEditing && (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{avatar}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
              Mon profil
            </div>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              color: '#aaa',
              marginBottom: 8,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
            }}>PSEUDO</label>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              required
              maxLength={20}
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
              placeholder="Comment veux-tu apparaître ?"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              color: '#aaa',
              marginBottom: 8,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
            }}>JE SUIS</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['joueur', 'parent'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: type === t ? '2px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: type === t ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    color: type === t ? '#FFD700' : '#aaa',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'Syne', sans-serif",
                    textTransform: 'capitalize',
                  }}
                >
                  {t === 'joueur' ? '🏀 Joueur' : '👨‍👩‍👧 Parent'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              color: '#aaa',
              marginBottom: 8,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
            }}>{type === 'joueur' ? 'MON ÉQUIPE' : "ÉQUIPE DE MON ENFANT"}</label>
            <select
              value={equipe}
              onChange={(e) => setEquipe(e.target.value)}
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
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>Choisir une équipe</option>
              {EQUIPES.map(eq => (
                <option key={eq} value={eq} style={{ background: '#1a0a2e', color: '#fff' }}>
                  {eq}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              color: '#aaa',
              marginBottom: 8,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
            }}>AVATAR</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {AVATARS.map(av => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  style={{
                    padding: '12px',
                    borderRadius: 12,
                    border: avatar === av ? '2px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: avatar === av ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    fontSize: 24,
                    cursor: 'pointer',
                  }}
                >
                  {av}
                </button>
              ))}
            </div>
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
            {loading ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer mon profil'}
          </button>
        </form>

        {isEditing && onSignOut && (
          <button
            onClick={onSignOut}
            style={{
              width: '100%',
              marginTop: 12,
              padding: '12px',
              borderRadius: 14,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Se déconnecter
          </button>
        )}
      </div>
    </div>
  );
}
