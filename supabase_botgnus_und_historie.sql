-- ============================================================================
-- SUPABASE UPDATE-SKRIPT: BOTGNUS KONSOLIDIERUNG & ZUGHISTORIE (move_history)
-- Einfach im Supabase SQL-Editor einfügen und mit "Run" ausführen.
-- ============================================================================

-- 1. Bot "Botgnus" anlegen (oder aktualisieren) und alte Bots zusammenführen
INSERT INTO players (name, elo, wins, draws, losses, is_bot, bot_level)
VALUES ('Botgnus', 800, 0, 0, 0, true, 2)
ON CONFLICT (name) DO UPDATE
SET is_bot = true;

-- Bestehende Partien gegen alte Bots auf "Botgnus" umschreiben (damit die Historie erhalten bleibt)
UPDATE games
SET white_player = 'Botgnus'
WHERE white_player IN (SELECT name FROM players WHERE is_bot = true AND name <> 'Botgnus');

UPDATE games
SET black_player = 'Botgnus'
WHERE black_player IN (SELECT name FROM players WHERE is_bot = true AND name <> 'Botgnus');

-- Alte mehrfache Bot-Einträge aus der players-Tabelle entfernen
DELETE FROM players
WHERE is_bot = true AND name <> 'Botgnus';

-- 2. Neue Spalte "move_history" (Text mit Leerzeichen-getrennten UCI-Zügen wie "e2e4 e7e5 g1f3")
ALTER TABLE games
ADD COLUMN IF NOT EXISTS move_history TEXT DEFAULT '';

-- 3. In deiner Funktion rpc_make_move nur 1 Zeile beim UPDATE ergänzen:
-- Falls deine rpc_make_move Standard-Update-Logik nutzt, stelle sicher, dass beim
-- UPDATE auf "games" folgende Zuweisung enthalten ist:
--
--   move_history = CASE
--       WHEN COALESCE(move_history, '') = '' THEN p_move_uci
--       ELSE move_history || ' ' || p_move_uci
--   END,
--
-- Zudem kannst du in rpc_start_game optional eine serverseitige Sperre ergänzen,
-- falls bereits ein aktives Botgnus-Spiel für p_creator existiert.
