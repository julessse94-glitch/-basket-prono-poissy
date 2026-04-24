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

export default function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [formData, setFormData] = useState({
    equipe: '',
    home_team: '',
    away_team: '',
    match_date: '',
    status: 'upcoming',
    home_score: null,
    away_score: null,
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false });
    
    if (data) setMatches(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const matchData = {
        ...formData,
        home_score: formData.home_score || null,
        away_score: formData.away_score || null,
      };

      if (editingMatch) {
        const { error } = await supabase
          .from('matches')
          .update(matchData)
          .eq('match_id', editingMatch.match_id);
        
        if (error) throw error;
        showToast('Match mis à jour !');
      } else {
        const { error } = await supabase
          .from('matches')
          .insert([matchData]);
        
        if (error) throw error;
        showToast('Match ajouté !');
      }

      resetForm();
      loadMatches();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteMatch = async (matchId) => {
    if (!confirm('Supprimer ce match ?')) return;

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('match_id', matchId);
      
      if (error) throw error;
      showToast('Match supprimé');
      loadMatches();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const editMatch = (match) => {
    setEditingMatch(match);
    setFormData({
      equipe: match.equipe,
      home_team: match.home_team,
      away_team: match.away_team,
      match_date: match.match_date.substring(0, 16),
      status: match.status,
      home_score: match.home_score,
      away_score: match.away_score,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      equipe: '',
      home_team: '',
      away_team: '',
      match_date: '',
      status: 'upcoming',
      home_score: null,
      away_score: null,
    });
    setEditingMatch(null);
    setShowForm(false);
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div style={{ padding: '0 16px 100px' }}>
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 14,
          border: 'none',
          background: 'linear-gradient(135deg, #FFD700, #c9a0dc)',
          color: '#1a0a2e',
          fontSize: 14,
          fontWeight: 800,
          cursor: 'pointer',
          marginBottom: 20,
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {showForm ? '✕ Annuler' : '➕ Ajouter un match'}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 20,
            padding: '20px',
            marginBottom: 20,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#aaa',
              marginBottom: 6,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
            }}>ÉQUIPE</label>
            <select
              value={formData.equipe}
              onChange={(e) => setFormData({ ...formData, equipe: e.target.value })}
              required
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
            >
              <option value="">Choisir</option>
              {EQUIPES.map(eq => (
                <option key={eq} value={eq} style={{ background: '#1a0a2e' }}>{eq}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#aaa',
              marginBottom: 6,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
            }}>ÉQUIPE DOMICILE (Poissy)</label>
            <input
              type="text"
              value={formData.home_team}
              onChange={(e) => setFormData({ ...formData, home_team: e.target.value })}
              required
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
              placeholder="Ex: Poissy U18-1"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#aaa',
              marginBottom: 6,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
            }}>ÉQUIPE EXTÉRIEUR (Adversaire)</label>
            <input
              type="text"
              value={formData.away_team}
              onChange={(e) => setFormData({ ...formData, away_team: e.target.value })}
              required
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
              placeholder="Ex: Versailles BC"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#aaa',
              marginBottom: 6,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
            }}>DATE ET HEURE DU MATCH</label>
            <input
              type="datetime-local"
              value={formData.match_date}
              onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
              required
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
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block',
              fontSize: 11,
              color: '#aaa',
              marginBottom: 6,
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
            }}>STATUT</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
            >
              <option value="upcoming" style={{ background: '#1a0a2e' }}>À venir</option>
              <option value="finished" style={{ background: '#1a0a2e' }}>Terminé</option>
            </select>
          </div>

          {formData.status === 'finished' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 11,
                  color: '#aaa',
                  marginBottom: 6,
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 700,
                }}>SCORE DOMICILE</label>
                <input
                  type="number"
                  min="0"
                  value={formData.home_score || ''}
                  onChange={(e) => setFormData({ ...formData, home_score: parseInt(e.target.value) || null })}
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
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 11,
                  color: '#aaa',
                  marginBottom: 6,
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 700,
                }}>SCORE EXTÉRIEUR</label>
                <input
                  type="number"
                  min="0"
                  value={formData.away_score || ''}
                  onChange={(e) => setFormData({ ...formData, away_score: parseInt(e.target.value) || null })}
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
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontFamily: "'Syne', sans-serif",
            }}
          >
            {loading ? 'Enregistrement...' : editingMatch ? 'Mettre à jour' : 'Ajouter le match'}
          </button>
        </form>
      )}

      {/* Matches list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {matches.map(match => (
          <div
            key={match.match_id}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 16,
              padding: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{
                fontSize: 11,
                color: '#c9a0dc',
                fontFamily: "'DM Mono', monospace",
                fontWeight: 700,
              }}>
                {match.equipe}
              </div>
              <div style={{
                fontSize: 10,
                color: match.status === 'finished' ? '#10B981' : '#888',
                fontFamily: "'DM Mono', monospace",
              }}>
                {match.status === 'finished' ? 'TERMINÉ' : 'À VENIR'}
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              {match.home_team} vs {match.away_team}
            </div>

            {match.status === 'finished' && (
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FFD700', marginBottom: 8 }}>
                {match.home_score} - {match.away_score}
              </div>
            )}

            <div style={{ fontSize: 11, color: '#666', fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>
              {new Date(match.match_date).toLocaleString('fr-FR')}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => editMatch(match)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  background: 'rgba(255, 215, 0, 0.1)',
                  color: '#FFD700',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => deleteMatch(match.match_id)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 10,
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {matches.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#aaa' }}>
          Aucun match pour le moment
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'error'
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'linear-gradient(135deg, #10B981, #059669)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: 20,
          fontWeight: 800,
          fontSize: 13,
          fontFamily: "'Syne', sans-serif",
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
