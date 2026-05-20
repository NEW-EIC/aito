# Local Postgres setup — three zero-cost paths

Pick one. All three are free and all support the schema as-is.

## A. Docker Compose (recommended)

**Pros**: identical to production, easy reset, zero macOS-version concerns.
**Cons**: needs Docker Desktop installed (free, but ~1 GB).

```bash
# 1. Install Docker Desktop if you don't have it
#    https://www.docker.com/products/docker-desktop/

# 2. Boot the database
cd aito-alto-database
docker-compose up -d

# 3. Verify
docker-compose ps           # postgres should be "Up"
docker exec -it aito-alto-postgres psql -U aito -d aito_alto -c "select version();"

# 4. Apply migrations
cp .env.example .env
npm install
npx prisma migrate dev --name init

# 5. Seed
npx prisma db seed

# Optional: open Prisma Studio to browse data
npx prisma studio   # http://localhost:5555
```

**Reset to a clean slate**: `docker-compose down -v && docker-compose up -d && npx prisma migrate dev`.

## B. Postgres.app (macOS-native, no Docker)

**Pros**: lightweight, drag-to-install, runs as a normal Mac app.
**Cons**: Mac-only, you manage extensions manually.

```bash
# 1. Download https://postgresapp.com — drag to /Applications, click "Initialize"

# 2. Create our database
/Applications/Postgres.app/Contents/Versions/latest/bin/createdb aito_alto

# 3. Install required extensions (run once per fresh DB)
/Applications/Postgres.app/Contents/Versions/latest/bin/psql aito_alto <<SQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
SQL

# 4. Configure .env
cp .env.example .env
# Edit DATABASE_URL to:
#   postgresql://$USER@localhost:5432/aito_alto?schema=public

# 5. Apply migrations and seed
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

## C. Neon Free (cloud)

**Pros**: zero local install, accessible from anywhere.
**Cons**: requires internet, free tier has 0.5 GB storage, suspends after inactivity (cold start ~1s).

```bash
# 1. Sign up at https://neon.tech (no credit card)

# 2. Create a new project; it gives you a connection string like
#    postgresql://aito_owner:xxx@ep-foo.us-east-1.aws.neon.tech/aito_alto?sslmode=require

# 3. Configure .env
cp .env.example .env
# Paste the Neon string into DATABASE_URL
# For DIRECT_DATABASE_URL, use the "direct connection" variant Neon shows in
# its dashboard (no -pooler suffix). Migrations need a non-pooled connection.

# 4. Apply migrations and seed
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

**Note**: Neon's free tier auto-suspends after 5 minutes of idle. The first query after suspension takes ~1 second to wake up. For dev, that's fine. For production, you'd upgrade to a paid plan or self-host.

## Migration commands cheatsheet

| Command | What it does |
|---|---|
| `prisma migrate dev` | Compute diff, generate migration SQL, apply, regenerate client. **Dev only.** |
| `prisma migrate dev --create-only` | Generate migration SQL but don't apply. Edit it, then `prisma migrate dev` to apply. |
| `prisma migrate deploy` | Apply all pending migrations. **Production deploys use this.** |
| `prisma migrate reset` | Drop all data, reapply all migrations, run seed. **Destructive — local only.** |
| `prisma migrate resolve --applied <name>` | Mark a migration as applied without running it (for hand-applied SQL). |
| `prisma db pull` | Reverse-engineer schema from existing DB. Useful when adopting an existing database. |
| `prisma db push` | Sync schema to DB WITHOUT a migration file. **Prototype only — never use in CI.** |

## Inspecting what Prisma will do

```bash
# Show the SQL Prisma plans to run, without applying
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-url $DATABASE_URL \
  --script
```

Always run this before `migrate deploy` in CI.

## Common gotchas

- **`error: extension "citext" is not available`** — On a fresh database you may need to install it as superuser. Docker setup does this automatically. Postgres.app: see Option B step 3. Neon: install via the SQL editor in the Neon dashboard.
- **`Database "aito_alto" does not exist`** — `docker-compose up -d` creates it; if you used Option B you have to `createdb aito_alto` first.
- **Migrations failing on Neon** — Neon's pooled connection (`-pooler` host) doesn't support some Prisma migration operations. Use the direct (non-pooler) URL for `DIRECT_DATABASE_URL`.
