import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1a21qYmdidWt4d212Z3ltaWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzY0MzAsImV4cCI6MjA5MjYxMjQzMH0.bZlq84ytBiD7f4K6Ji0Oa9bJfhsRh9r4ErfX1lt2bIk';
const SUPABASE_URL = 'https://aukmjbgbukxwmvgymiau.supabase.co';

const EQUIPES = ['Senior F', 'U18-1', 'U18-2', 'U15-1', 'U15-2', 'U13-2', 'U11 F', 'U9'];

const emptyForm = {
  equipe: '',
  home_team: '',
  away_team: '',
  match_date: '',
  status: 'upcoming',
  home_score: '',
  away_score: '',
};

export default function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
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

  const calculerPoints = async (matchId, homeScore, awayScore) => {
    const actualWinner = homeScore > awayScore ? 'home' : 'away';
    const realGap = Math.abs(homeScore - awayScore);

    const { data: pronos } = await supabase
      .from('pronostics')
      .select('*')
      .eq('id_match', matchId)
      .eq('submitted', true);

    if (!pronos || pronos.length === 0) return;

    for (const prono of pronos) {
      let pts = 0;
      if (prono.vainqueur === actualWinner) {
        pts = prono.ecart && Math.abs(prono.ecart - realGap) <= 2 ? 200 : 100;
      }

      await supabase
        .from('pronostics')
        .update({ points_gagnes: pts })
        .eq('id', prono.id);

      const { data: allPronos } = await supabase
        .from('pronostics')
        .select('points_gagnes')
        .eq('user_id', prono.user_id);

      const total = allPronos.reduce((sum, p) => sum + (p.points_gagnes || 0), 0);

      await supabase
        .from('profiles')
        .update({ points: total })
        .eq('id', prono.user_id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const matchData = {
      equipe: formData.equipe,
      home_team: formData.home_team,
      away_team: formData.away_team,
      match_date: formData.match_date.replace('T', ' '),
      status: formData.status,
      home_score: formData.home_score !== '' ? parseInt(formData.home_score) : null,
      away_score: formData.away_score !== '' ? parseInt(formData.away_score) : null,
    };

    try {
      if (editingId !== null) {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/matches?id=eq.${parseInt(editingId)}&apikey=${ANON_KEY}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': ANON_KEY,
              'Authorization': `Bearer ${ANON_KEY}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify(matchData),
          }
        );

        if (!response.ok) {
          const err = await response.text();
          throw new Error(err);
        }

        if (
          matchData.status === 'finished' &&
          matchData.home_score !== null &&
          matchData.away_score !== null
        ) {
          await calculerPoints(parseInt(editingId), matchData.home_score, matchData.away_score);
        }

        showToast('Match mis à jour ! ✅');
      } else {
        const { error } = await supabase.from('matches').insert([matchData]);
        if (error) throw error;
        showToast('Match ajouté ! ✅');
      }

      resetForm();
      loadMatches();
    } catch (err) {
      showToast('Erreur : ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteMatch = async (id) => {
    if (!confirm('Supprimer ce match ?')) return;
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) showToast('Erreur : ' + error.message, 'error');
    else {
      showToast('Match supprimé');
      loadMatches();
    }
  };

  const editMatch = (match) => {
    setEditingId(match.id);
    setFormData({
      equipe: match.equipe || '',
      home_team: match.home_team || '',
      away_team: match.away_team || '',
      match_date: match.match_date ? match.match_date.substring(0, 16) : '',
      status: match.status || 'upcoming',
      home_score: match.home_score ?? '',
      away_score: match.away_score ?? '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const inp = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: 14,
    fontFamily: "'Syne', sans-serif",
  };

  const lbl = {
    display: 'block',
    fontSize: 11,
    color: '#aaa',
    marginBottom: 6,
    fontFamily: "'DM Mono', monospace",
    fontWeight: 700,
  };

  return (
    <div style={{ padding: '0 16px 100px' }}>

      <button
        onClick={() => { resetForm(); setShowForm(!showForm); }}
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
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 20,
            padding: '20px',
            marginBottom: 20,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>ÉQUIPE</label>
            <select
              value={formData.equipe}
              onChange={e => setFormData({ ...formData, equipe: e.target.value })}
              required
              style={inp}
            >
              <option value="">Choisir une équipe</option>
              {EQUIPES.map(eq => (
                <option key={eq} value={eq} style={{ background: '#1a0a2e' }}>{eq}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>ÉQUIPE DOMICILE</label>
            <input
              type="text"
              value={formData.home_team}
              onChange={e => setFormData({ ...formData, home_team: e.target.value })}
              required
              style={inp}
              placeholder="Ex: Mon équipe"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>ÉQUIPE EXTÉRIEUR</label>
            <input
              type="text"
              value={formData.away_team}
              onChange={e => setFormData({ ...formData, away_team: e.target.value })}
              required
              style={inp}
              placeholder="Ex: Equipe adverse"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>DATE ET HEURE</label>
            <input
              type="datetime-local"
              value={formData.match_date}
              onChange={e => setFormData({ ...formData, match_date: e.target.value })}
              required
              style={inp}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>STATUT</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              style={inp}
            >
              <option value="upcoming" style={{ background: '#1a0a2e' }}>À venir</option>
              <option value="finished" style={{ background: '#1a0a2e' }}>Terminé</option>
            </select>
          </div>

          {formData.status === 'finished' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={lbl}>SCORE DOMICILE</label>
                <input
                  type="number"
                  min="0"
                  value={formData.home_score}
                  onChange={e => setFormData({ ...formData, home_score: e.target.value })}
                  style={inp}
                  placeholder="84"
                />
              </div>
              <div>
                <label style={lbl}>SCORE EXTÉRIEUR</label>
                <input
                  type="number"
                  min="0"
                  value={formData.away_score}
                  onChange={e => setFormData({ ...formData, away_score: e.target.value })}
                  style={inp}
                  placeholder="72"
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
            {loading ? 'Enregistrement...' : editingId ? '✅ Mettre à jour' : '➕ Ajouter le match'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {matches.map(match => (
          <div
            key={match.id}
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 16,
              padding: '14px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#c9a0dc', fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
                {match.equipe}
              </span>
              <span style={{ fontSize: 10, color: match.status === 'finished' ? '#10B981' : '#FFD700', fontFamily: "'DM Mono',monospace" }}>
                {match.status === 'finished' ? '✅ TERMINÉ' : '⏳ À VENIR'}
              </span>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              {match.home_team} vs {match.away_team}
            </div>

            {match.status === 'finished' && (
              <div style={{ fontSize: 22, fontWeight: 800, color: '#FFD700', marginBottom: 6 }}>
                {match.home_score} - {match.away_score}
              </div>
            )}

            <div style={{ fontSize: 11, color: '#555', fontFamily: "'DM Mono',monospace", marginBottom: 12 }}>
              {new Date(match.match_date).toLocaleString('fr-FR')}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => editMatch(match)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: '1px solid rgba(255,215,0,0.3)',
                  background: 'rgba(255,215,0,0.1)',
                  color: '#FFD700',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'Syne',sans-serif",
                }}
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => deleteMatch(match.id)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.1)',
                  color: '#ef4444',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'Syne',sans-serif",
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

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'error'
            ? 'linear-gradient(135deg,#ef4444,#dc2626)'
            : 'linear-gradient(135deg,#10B981,#059669)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: 20,
          fontWeight: 800,
          fontSize: 13,
          fontFamily: "'Syne',sans-serif",
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
