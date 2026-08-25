-- A starter set of categories so the app is usable on first open.
-- user_id 'local' is the single-user fallback; see worker/auth.ts.
INSERT INTO categories (id, user_id, name, color, sort_order, created_at) VALUES
  ('cat-work',    'local', 'Work',    '#4A6FB8', 1, '2026-01-01T00:00:00.000Z'),
  ('cat-home',    'local', 'Home',    '#8B5FA8', 2, '2026-01-01T00:00:00.000Z'),
  ('cat-health',  'local', 'Health',  '#2E8267', 3, '2026-01-01T00:00:00.000Z'),
  ('cat-errands', 'local', 'Errands', '#A8722E', 4, '2026-01-01T00:00:00.000Z'),
  ('cat-admin',   'local', 'Admin',   '#5E7080', 5, '2026-01-01T00:00:00.000Z');
