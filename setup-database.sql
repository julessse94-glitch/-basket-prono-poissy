-- =====================================================
-- BASKET PRONO POISSY BC - DATABASE SETUP
-- =====================================================
-- Copie-colle ce fichier COMPLET dans Supabase SQL Editor
-- puis clique sur "Run"
-- =====================================================

-- 1. TABLE PROFILES (profils utilisateurs)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  pseudo TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('joueur', 'parent')),
  equipe TEXT NOT NULL,
  avatar TEXT DEFAULT '🏀',
  points INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. TABLE MATCHES (matchs)
CREATE TABLE IF NOT EXISTS matches (
  match_id SERIAL PRIMARY KEY,
  equipe TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'finished')),
  home_score INTEGER,
  away_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. TABLE PRONOSTICS
CREATE TABLE IF NOT EXISTS pronostics (
  prono_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id INTEGER REFERENCES matches(match_id) ON DELETE CASCADE,
  vainqueur TEXT CHECK (vainqueur IN ('home', 'away')),
  ecart INTEGER,
  submitted BOOLEAN DEFAULT FALSE,
  points_gagnes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronostics ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES

-- Profiles : chaque user peut lire tous les profils (pour le classement)
-- mais ne peut modifier que le sien
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (TRUE);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Matches : tout le monde peut lire, seuls les admins peuvent modifier
CREATE POLICY "Matches are viewable by everyone" 
  ON matches FOR SELECT 
  USING (TRUE);

CREATE POLICY "Admins can insert matches" 
  ON matches FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update matches" 
  ON matches FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete matches" 
  ON matches FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Pronostics : chaque user gère ses propres pronos
-- mais tous les pronos sont visibles (pour le classement)
CREATE POLICY "Pronostics are viewable by everyone" 
  ON pronostics FOR SELECT 
  USING (TRUE);

CREATE POLICY "Users can insert their own pronostics" 
  ON pronostics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pronostics" 
  ON pronostics FOR UPDATE 
  USING (auth.uid() = user_id);

-- 6. FUNCTION DE CALCUL AUTOMATIQUE DES POINTS
-- Appelée automatiquement quand un match passe en "finished"
CREATE OR REPLACE FUNCTION calculate_points_for_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement si le match vient de passer à "finished"
  IF NEW.status = 'finished' AND OLD.status = 'upcoming' THEN
    -- Pour chaque prono soumis sur ce match
    UPDATE pronostics
    SET points_gagnes = CASE
      -- Vainqueur correct = 100 pts de base
      WHEN vainqueur = (
        CASE WHEN NEW.home_score > NEW.away_score THEN 'home' ELSE 'away' END
      ) THEN (
        -- + 100 pts bonus si écart ±2 pts
        CASE 
          WHEN ecart IS NOT NULL 
            AND ABS(ecart - ABS(NEW.home_score - NEW.away_score)) <= 2 
          THEN 200
          ELSE 100
        END
      )
      -- Vainqueur incorrect = 0 pts
      ELSE 0
    END
    WHERE match_id = NEW.match_id
      AND submitted = TRUE;

    -- Mettre à jour les points totaux de chaque utilisateur
    UPDATE profiles p
    SET points = (
      SELECT COALESCE(SUM(points_gagnes), 0)
      FROM pronostics
      WHERE user_id = p.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGER pour calculer les points automatiquement
DROP TRIGGER IF EXISTS trigger_calculate_points ON matches;
CREATE TRIGGER trigger_calculate_points
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION calculate_points_for_match();

-- =====================================================
-- FIN DE L'INSTALLATION
-- =====================================================
-- Si tu vois "Success. No rows returned" en vert, c'est bon !
-- Toutes les tables et règles sont créées.
-- =====================================================
