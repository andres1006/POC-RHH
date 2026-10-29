# POC-RHH

POC de plataforma de RR. HH. multiempresa (Nexo RH).

- `web/` — app Next.js 15 + Postgres (Drizzle). Corre en http://localhost:3100
- `POC2/` — prototipo v0 + Supabase (Andina). Corre en http://localhost:3010

## Web (Eficacia, Andina, Café Montaña)

```bash
cd web
docker compose up -d --build
```

Cuentas demo de Eficacia, contraseña `Demo1234!`:
- Empleado: tomas.cardona@eficacia.com
- Líder: manuela.mejia@eficacia.com
- RR. HH.: paula.martinez@eficacia.com
- Admin: andres.agudelo@eficacia.com
