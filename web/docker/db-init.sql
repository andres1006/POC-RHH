-- Rol de la aplicación: sin superusuario ni BYPASSRLS, para que las políticas RLS sí apliquen.
CREATE ROLE app_user LOGIN PASSWORD 'app_user';
GRANT CONNECT ON DATABASE nexorh TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
