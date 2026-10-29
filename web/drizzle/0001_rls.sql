-- Aislamiento multitenant en la base: cada transacción fija app.tenant_id (ver withTenant en src/server/db/client.ts)
-- y las políticas solo dejan ver/escribir filas de ese tenant. El rol app_user no puede saltarse RLS.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['employees','users','sessions','employee_events','requests','posts','post_likes','documents','onboardings','onboarding_tasks','attendance_marks','reviews','objectives','favorites']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)',
      t);
  END LOOP;
END $$;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
