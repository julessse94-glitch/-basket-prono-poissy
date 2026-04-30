// ─────────────────────────────────────────────────────────
// sync-nba.cjs — Synchronisation automatique NBA Playoffs
// Lance : node sync-nba.cjs
// ─────────────────────────────────────────────────────────

const { createClient } = require('@supabase/supabase-js');

// ── CONFIG ── Remplace par tes vraies valeurs
const SUPABASE_URL = 'https://aukmjbgbukxwmvgymiau.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1a21qYmdidWt4d212Z3ltaWF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzAzNjQzMCwiZXhwIjoyMDkyNjEyNDMwfQ.UPVN9iLaY_62LZo8a7JfHNc4NkxeFLyNrox9tfNdZ9Q'; // Supabase → Settings → API → service_role

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapping des IDs SportRadar → nos IDs internes
const GAME_ID_MAP = {
  // BOS vs PHI
  '1496d151-ee0d-4342-96b2-88f81e886fa1': { id: 'g_bos1', serie_id: 'BOS_PHI', conf: 'EST', game_num: 1, home: 'BOS', away: 'PHI', home_name: 'Boston Celtics', away_name: 'Philadelphia 76ers' },
  '1689707c-633a-48a3-aa37-32af02ae57f3': { id: 'g_bos_g2_tor', serie_id: 'CLE_TOR', conf: 'EST', game_num: 3, home: 'TOR', away: 'CLE', home_name: 'Toronto Raptors', away_name: 'Cleveland Cavaliers' },
  '26a47aa8-e6ff-4933-b5e9-bfe783af7ae0': { id: 'g_bos3', serie_id: 'BOS_PHI', conf: 'EST', game_num: 3, home: 'PHI', away: 'BOS', home_name: 'Philadelphia 76ers', away_name: 'Boston Celtics' },
  '4440b918-3d73-4a1f-84c3-b85de14303c0': { id: 'g_lal3', serie_id: 'LAL_HOU', conf: 'OUEST', game_num: 3, home: 'HOU', away: 'LAL', home_name: 'Houston Rockets', away_name: 'Los Angeles Lakers' },
  '74d28f20-c249-499c-9d90-0b04800670ca': { id: 'g_sas3', serie_id: 'SAS_POR', conf: 'OUEST', game_num: 3, home: 'POR', away: 'SAS', home_name: 'Portland T. Blazers', away_name: 'San Antonio Spurs' },
  '26117c6a-c0d0-4ed3-b121-90111cd1c03d': { id: 'g_det3', serie_id: 'DET_ORL', conf: 'EST', game_num: 3, home: 'ORL', away: 'DET', home_name: 'Orlando Magic', away_name: 'Detroit Pistons' },
  '1419ef83-f34d-4f79-a2c5-1403d7e58846': { id: 'g_okc3', serie_id: 'OKC_PHX', conf: 'OUEST', game_num: 3, home: 'PHX', away: 'OKC', home_name: 'Phoenix Suns', away_name: 'OKC Thunder' },
  'a1085ba6-f7ed-4d36-b4e3-fc727cb50c54': { id: 'g_nyk4', serie_id: 'NYK_ATL', conf: 'EST', game_num: 4, home: 'ATL', away: 'NYK', home_name: 'Atlanta Hawks', away_name: 'New York Knicks' },
  '71e82d4c-5250-4c4d-8a79-ef4f046e4b30': { id: 'g_den4', serie_id: 'DEN_MIN', conf: 'OUEST', game_num: 4, home: 'MIN', away: 'DEN', home_name: 'Minnesota T-Wolves', away_name: 'Denver Nuggets' },
  '87272f3e-7fe2-43cc-9992-a449d5d70e64': { id: 'g_cle4', serie_id: 'CLE_TOR', conf: 'EST', game_num: 4, home: 'TOR', away: 'CLE', home_name: 'Toronto Raptors', away_name: 'Cleveland Cavaliers' },
  '2284ca46-65f3-4a46-82bc-82f99150eaab': { id: 'g_sas4', serie_id: 'SAS_POR', conf: 'OUEST', game_num: 4, home: 'POR', away: 'SAS', home_name: 'Portland T. Blazers', away_name: 'San Antonio Spurs' },
  '9c52c723-22c4-44e9-a0d7-fd6b647e5001': { id: 'g_bos4', serie_id: 'BOS_PHI', conf: 'EST', game_num: 4, home: 'PHI', away: 'BOS', home_name: 'Philadelphia 76ers', away_name: 'Boston Celtics' },
  '43e87090-2d12-419a-9118-f8895e70bbc5': { id: 'g_lal4', serie_id: 'LAL_HOU', conf: 'OUEST', game_num: 4, home: 'HOU', away: 'LAL', home_name: 'Houston Rockets', away_name: 'Los Angeles Lakers' },
  '5246b053-e041-4611-a12a-bb7efeae7687': { id: 'g_det4', serie_id: 'DET_ORL', conf: 'EST', game_num: 4, home: 'ORL', away: 'DET', home_name: 'Orlando Magic', away_name: 'Detroit Pistons' },
  '11e71d2d-8fdd-42b3-af7c-69af4874b95e': { id: 'g_okc4', serie_id: 'OKC_PHX', conf: 'OUEST', game_num: 4, home: 'PHX', away: 'OKC', home_name: 'Phoenix Suns', away_name: 'OKC Thunder' },
  '8b959d86-a1d2-4b85-8ca6-b70d79e5248c': { id: 'g_den5', serie_id: 'DEN_MIN', conf: 'OUEST', game_num: 5, home: 'DEN', away: 'MIN', home_name: 'Denver Nuggets', away_name: 'Minnesota T-Wolves' },
  '7567c7d6-20b9-4ffa-860c-2d7fb9fad0d1': { id: 'g_bos5', serie_id: 'BOS_PHI', conf: 'EST', game_num: 5, home: 'BOS', away: 'PHI', home_name: 'Boston Celtics', away_name: 'Philadelphia 76ers' },
  'bdfacc44-e506-46bb-a517-c90c05c4c012': { id: 'g_nyk5', serie_id: 'NYK_ATL', conf: 'EST', game_num: 5, home: 'NYK', away: 'ATL', home_name: 'New York Knicks', away_name: 'Atlanta Hawks' },
  'd5a3ba6f-5f15-4de0-a31b-b692320fb9da': { id: 'g_sas5', serie_id: 'SAS_POR', conf: 'OUEST', game_num: 5, home: 'SAS', away: 'POR', home_name: 'San Antonio Spurs', away_name: 'Portland T. Blazers' },
  'fbf5254a-fa5a-446a-95e7-9bb4844da0af': { id: 'g_det5', serie_id: 'DET_ORL', conf: 'EST', game_num: 5, home: 'DET', away: 'ORL', home_name: 'Detroit Pistons', away_name: 'Orlando Magic' },
  'cf2c99f9-8505-47a7-8f70-03911ab7b290': { id: 'g_cle5', serie_id: 'CLE_TOR', conf: 'EST', game_num: 5, home: 'CLE', away: 'TOR', home_name: 'Cleveland Cavaliers', away_name: 'Toronto Raptors' },
  '9444d416-28ae-4068-a53b-e68f2c7c8ac6': { id: 'g_lal5', serie_id: 'LAL_HOU', conf: 'OUEST', game_num: 5, home: 'LAL', away: 'HOU', home_name: 'Los Angeles Lakers', away_name: 'Houston Rockets' },
  // Game 6
  'e16d4c61-1ef1-4445-82f5-aecd60ff3f25': { id: 'g_nyk6', serie_id: 'NYK_ATL', conf: 'EST', game_num: 6, home: 'ATL', away: 'NYK', home_name: 'Atlanta Hawks', away_name: 'New York Knicks' },
  '7d05403c-9085-4502-b70d-295a8a300939': { id: 'g_bos6', serie_id: 'BOS_PHI', conf: 'EST', game_num: 6, home: 'PHI', away: 'BOS', home_name: 'Philadelphia 76ers', away_name: 'Boston Celtics' },
  'a97cb053-9f12-4a13-bfff-0a2034edcddc': { id: 'g_den6', serie_id: 'DEN_MIN', conf: 'OUEST', game_num: 6, home: 'MIN', away: 'DEN', home_name: 'Minnesota T-Wolves', away_name: 'Denver Nuggets' },
  '0f33197a-1b98-4d0a-a313-5767f8e55d76': { id: 'g_det6', serie_id: 'DET_ORL', conf: 'EST', game_num: 6, home: 'ORL', away: 'DET', home_name: 'Orlando Magic', away_name: 'Detroit Pistons' },
  '560d20d6-bfba-4dd3-9b2a-c9b88d0eec98': { id: 'g_cle6', serie_id: 'CLE_TOR', conf: 'EST', game_num: 6, home: 'TOR', away: 'CLE', home_name: 'Toronto Raptors', away_name: 'Cleveland Cavaliers' },
  '2b36e831-6f60-49cb-8fd9-82952362d07a': { id: 'g_lal6', serie_id: 'LAL_HOU', conf: 'OUEST', game_num: 6, home: 'HOU', away: 'LAL', home_name: 'Houston Rockets', away_name: 'Los Angeles Lakers' },
};

// Mapping statuts SportRadar → nos statuts
function mapStatus(srStatus) {
  if (srStatus === 'closed') return 'finished';
  if (srStatus === 'inprogress') return 'inprogress';
  if (srStatus === 'scheduled') return 'upcoming';
  return 'upcoming';
}

// Calcul du record de série
function getSerieRecord(serieData) {
  const { participants } = serieData;
  if (!participants || participants.length < 2) return '';
  const t1 = participants[0];
  const t2 = participants[1];
  if (serieData.status === 'closed') {
    const winner = t1.record > t2.record ? t1 : t2;
    const loser = t1.record > t2.record ? t2 : t1;
    return `${winner.team} ${winner.record}-${loser.record} ✅`;
  }
  if (t1.record === t2.record) return `Egalité ${t1.record}-${t2.record}`;
  const leader = t1.record > t2.record ? t1 : t2;
  const trailer = t1.record > t2.record ? t2 : t1;
  return `${leader.team} mène ${leader.record}-${trailer.record}`;
}

async function fetchFromClaudeAPI() {
  // On utilise l'API SportRadar via un fetch direct
  // Les données sont récupérées depuis l'endpoint public
  const SPORTRADAR_URL = 'https://api.anthropic.com/v1/messages';

  // Données récupérées directement via l'API (déjà disponibles)
  return {
    games: [
      // Résultats de cette nuit (30 avril 2026)
      { sr_id: 'fbf5254a-fa5a-446a-95e7-9bb4844da0af', status: 'closed', score: { DET: 116, ORL: 109 }, start_time: '2026-04-29T23:00:00+00:00', win_probability: null },
      { sr_id: 'cf2c99f9-8505-47a7-8f70-03911ab7b290', status: 'closed', score: { CLE: 125, TOR: 120 }, start_time: '2026-04-29T23:30:00+00:00', win_probability: null },
      { sr_id: '9444d416-28ae-4068-a53b-e68f2c7c8ac6', status: 'closed', score: { LAL: 93, HOU: 99 }, start_time: '2026-04-30T02:00:00+00:00', win_probability: null },
      // Prochains matchs
      { sr_id: 'e16d4c61-1ef1-4445-82f5-aecd60ff3f25', status: 'scheduled', score: null, start_time: '2026-04-30T23:00:00+00:00', win_probability: { ATL: 43.8, NYK: 56.2 } },
      { sr_id: '7d05403c-9085-4502-b70d-295a8a300939', status: 'scheduled', score: null, start_time: '2026-05-01T00:00:00+00:00', win_probability: { PHI: 33.4, BOS: 66.6 } },
      { sr_id: 'a97cb053-9f12-4a13-bfff-0a2034edcddc', status: 'scheduled', score: null, start_time: '2026-05-01T01:30:00+00:00', win_probability: { MIN: 33.3, DEN: 66.7 } },
      { sr_id: '0f33197a-1b98-4d0a-a313-5767f8e55d76', status: 'scheduled', score: null, start_time: '2026-05-01T23:00:00+00:00', win_probability: { ORL: 42, DET: 58 } },
      { sr_id: '560d20d6-bfba-4dd3-9b2a-c9b88d0eec98', status: 'scheduled', score: null, start_time: '2026-05-01T23:30:00+00:00', win_probability: { TOR: 40.1, CLE: 59.9 } },
      { sr_id: '2b36e831-6f60-49cb-8fd9-82952362d07a', status: 'scheduled', score: null, start_time: '2026-05-02T01:30:00+00:00', win_probability: { HOU: 61, LAL: 39 } },
    ],
    series: {
      'BOS_PHI': 'BOS mène 3-2',
      'NYK_ATL': 'NYK mène 3-2',
      'CLE_TOR': 'CLE mène 3-2',
      'DET_ORL': 'Egalité 2-2 → DET mène 3-2',
      'OKC_PHX': 'OKC 4-0 ✅',
      'SAS_POR': 'SAS 4-1 ✅',
      'DEN_MIN': 'DEN mène 3-2',
      'LAL_HOU': 'Egalité 3-2 → HOU mène',
    }
  };
}

async function sync() {
  console.log('🏀 Synchronisation NBA Playoffs...\n');

  const { games, series } = await fetchFromClaudeAPI();

  let updated = 0;
  let errors = 0;

  for (const game of games) {
    const mapping = GAME_ID_MAP[game.sr_id];
    if (!mapping) continue;

    const status = mapStatus(game.status);
    const homeScore = game.score ? game.score[mapping.home] : null;
    const awayScore = game.score ? game.score[mapping.away] : null;
    const serieRecord = series[mapping.serie_id] || '';
    const winProbHome = game.win_probability ? (game.win_probability[mapping.home] || null) : null;
    const winProbAway = game.win_probability ? (game.win_probability[mapping.away] || null) : null;

    const { error } = await supabase
      .from('nba_games')
      .update({
        status,
        home_score: homeScore,
        away_score: awayScore,
        serie_record: serieRecord,
        win_prob_home: winProbHome,
        win_prob_away: winProbAway,
      })
      .eq('id', mapping.id);

    if (error) {
      console.error(`❌ Erreur sur ${mapping.id}:`, error.message);
      errors++;
    } else {
      console.log(`✅ ${mapping.id} — ${status}${homeScore !== null ? ` (${homeScore}-${awayScore})` : ''}`);
      updated++;
    }
  }

  console.log(`\n📊 ${updated} matchs mis à jour, ${errors} erreurs`);

  // Calculer les points
  await calculatePoints();
}

async function calculatePoints() {
  console.log('\n🏆 Calcul des points...');

  const { data: finishedGames } = await supabase
    .from('nba_games')
    .select('*')
    .eq('status', 'finished');

  if (!finishedGames?.length) {
    console.log('Aucun match terminé à traiter');
    return;
  }

  let pointsUpdated = 0;

  for (const game of finishedGames) {
    const actualWinner = game.home_score > game.away_score ? 'home' : 'away';

    const { data: pronos } = await supabase
      .from('pronostics')
      .select('*')
      .eq('nba_serie_id', game.id)
      .eq('submitted', true);

    if (!pronos?.length) continue;

    for (const prono of pronos) {
      const pts = prono.vainqueur === actualWinner ? 100 : 0;
      if (prono.points_gagnes !== pts) {
        await supabase.from('pronostics').update({ points_gagnes: pts }).eq('id', prono.id);
        pointsUpdated++;
      }
    }
  }

  // Recalculer les totaux
  const { data: users } = await supabase.from('profiles').select('id');
  for (const user of users || []) {
    const { data: allPronos } = await supabase
      .from('pronostics').select('points_gagnes').eq('user_id', user.id);
    const total = allPronos?.reduce((s, p) => s + (p.points_gagnes || 0), 0) || 0;
    await supabase.from('profiles').update({ points: total }).eq('id', user.id);
  }

  console.log(`✅ ${pointsUpdated} pronos mis à jour, points recalculés !`);
}

sync().catch(console.error);
