-- F-100D Super Sabre joins the module list. Idempotent: modules.name is unique,
-- so replaying it (or adding the module by hand first) is harmless.
INSERT INTO "modules" ("name", "category")
VALUES ('F-100D', 'western_fixed')
ON CONFLICT ("name") DO NOTHING;
