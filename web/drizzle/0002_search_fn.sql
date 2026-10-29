-- Búsqueda sin tildes (sin depender de la extensión unaccent).
CREATE OR REPLACE FUNCTION unaccent_es(text) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
$$ SELECT translate(lower($1), 'áéíóúüñàèìòù', 'aeiouunaeiou') $$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION unaccent_es(text) TO app_user;
