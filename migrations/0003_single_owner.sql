-- Collapse the app onto a single owner.
--
-- Identity used to be the Cloudflare Access email, gated on an ENVIRONMENT
-- variable. Both moved: Access signs in automatically and asserts whichever
-- address it likes, and `wrangler deploy` replaces a Worker's vars with what
-- the committed config declares, so a deploy could drop the variable and send
-- every query to the fallback user. Rows ended up split across two addresses
-- while the app looked under a third name and showed an empty list.
--
-- worker/auth.ts now pins identity to the constant 'owner'. This brings the
-- rows that already exist across to it. Every query stays scoped by user_id,
-- so nothing about the schema changes.

-- There is one person using this app, and all of it is theirs.
UPDATE tasks SET user_id = 'owner';

-- One set of categories accumulated per address. Keep every category a task
-- actually points at, and of the leftovers keep one per name — so no reference
-- is broken and no name vanishes, whichever set the tasks happen to use.
DELETE FROM categories
 WHERE id NOT IN (SELECT category_id FROM tasks WHERE category_id IS NOT NULL)
   AND rowid NOT IN (
     SELECT MIN(rowid) FROM categories c
      WHERE NOT EXISTS (
        SELECT 1 FROM categories referenced
          JOIN tasks t ON t.category_id = referenced.id
         WHERE referenced.name = c.name
      )
      GROUP BY name
   );

UPDATE categories SET user_id = 'owner';
