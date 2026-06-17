# PowerSync — Architecture & Deployment

## How it works

PowerSync is a sync engine that streams changes from Postgres to SQLite on the mobile client in real time. It replaces the old poll-based sync (content versioning) with continuous bidirectional sync.

### Data flow

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Admin App      │         │  PowerSync       │         │  Mobile App     │
│  (Next.js)      │         │  Service         │         │  (Expo/RN)      │
│                 │         │                  │         │                 │
│  Writes to ─────┼────►    │                  │    ◄────┼── Reads from    │
│  Postgres       │    │    │  Tails Postgres  │    │    │  local SQLite   │
│                 │    │    │  WAL stream      │    │    │                 │
└─────────────────┘    │    │                  │    │    │  Writes to ─────┼───┐
                       │    │  Streams changes │    │    │  local SQLite   │   │
                       │    │  to clients ─────┼────┘    │                 │   │
                       │    │                  │         └─────────────────┘   │
                       │    └──────────────────┘                               │
                       │                                                       │
                       │    ┌──────────────────┐                               │
                       └────┤  Postgres DB     │◄──────────────────────────────┘
                            │  (source of      │   Upload queue syncs writes
                            │   truth)         │   back via /api/sync endpoint
                            └──────────────────┘
```

### Key components

| Component | Purpose |
|-----------|---------|
| **Postgres** (`db`) | Source database. Must have `wal_level=logical` and a publication named `powersync`. |
| **MongoDB** (`mongo`) | Internal state storage for PowerSync (checkpoints, bucket data). Not user-facing. |
| **PowerSync Service** (`powersync`) | Reads Postgres WAL, evaluates sync rules, streams data to connected clients via WebSocket. |
| **Admin App** (`/api/auth/token`) | Issues JWTs that PowerSync verifies. Contains the user's ID for sync rule scoping. |
| **Admin App** (`/api/auth/jwks`) | Serves the RSA public key so PowerSync can verify token signatures. |
| **Admin App** (`/api/sync/[table]`) | Receives writes from the mobile client's upload queue and applies them to Postgres. |

### Sync rules

Defined in `powersync/sync-config.yaml`. Two streams:

- **`global`** — All content where `userId IS NULL` (admin-created). Auto-subscribes all clients.
- **`user_data`** — Content where `userId = auth.user_id()`. Only syncs to the user who created it.

### Authentication

1. Mobile app generates a persistent device UUID on first launch
2. App requests a JWT from `/api/auth/token?user_id=<device-id>`
3. JWT includes `sub: <device-id>` — PowerSync uses this for `auth.user_id()` in sync rules
4. PowerSync verifies the JWT signature against the JWKS endpoint

## Local development

```bash
# Start all services (Postgres, MongoDB, PowerSync)
docker-compose up -d

# Check PowerSync health
curl http://localhost:8090/probes/liveness

# View PowerSync logs
docker-compose logs -f powersync

# Restart PowerSync after config changes
docker-compose restart powersync
```

The admin app must be running (`npm run dev`) for PowerSync to verify tokens via the JWKS endpoint.

## Deploying to Coolify

PowerSync has [official Coolify documentation](https://docs.powersync.com/integration-guides/coolify). Below is specific to this project.

### Prerequisites

- Coolify instance running on your homelab
- A Postgres database accessible from Coolify (can be the same one the admin app uses)
- The Postgres database must have `wal_level=logical`

### Step 1: Create a Docker Compose resource

In your Coolify project, add a new **Docker Compose Empty** resource. Paste the following:

```yaml
version: "3.8"
services:
  mongo:
    image: mongo:7.0
    command: --replSet rs0 --bind_ip_all --quiet
    restart: unless-stopped
    volumes:
      - mongo_storage:/data/db

  mongo-rs-init:
    image: mongo:7.0
    depends_on:
      - mongo
    restart: on-failure
    entrypoint:
      - bash
      - -c
      - >
        mongosh --host mongo:27017 --eval
        'try{rs.status().ok && quit(0)} catch(e) {} rs.initiate({_id: "rs0", version: 1, members: [{ _id: 0, host: "mongo:27017" }]})'

  powersync:
    image: journeyapps/powersync-service:latest
    restart: unless-stopped
    command: ["start", "-r", "unified"]
    depends_on:
      mongo-rs-init:
        condition: service_completed_successfully
    environment:
      POWERSYNC_CONFIG_B64: ${POWERSYNC_CONFIG_B64}
      POWERSYNC_SYNC_CONFIG_B64: ${POWERSYNC_SYNC_CONFIG_B64}
      PS_DATA_SOURCE_URI: ${PS_DATA_SOURCE_URI}
      PS_MONGO_URI: "mongodb://mongo:27017/powersync"
      PS_JWKS_URL: ${PS_JWKS_URL}
      PS_PORT: "8080"
      NODE_OPTIONS: "--max-old-space-size=512"
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:8080/probes/liveness').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]
      interval: 5s
      timeout: 1s
      retries: 15

volumes:
  mongo_storage:
```

### Step 2: Set environment variables

In Coolify, set these environment variables:

| Variable | Value |
|----------|-------|
| `PS_DATA_SOURCE_URI` | `postgresql://<user>:<password>@<host>:<port>/quiz_admin?sslmode=disable` |
| `PS_JWKS_URL` | `https://<your-admin-app-domain>/api/auth/jwks` |
| `POWERSYNC_CONFIG_B64` | Base64-encoded `service.yaml` (see below) |
| `POWERSYNC_SYNC_CONFIG_B64` | Base64-encoded `sync-config.yaml` (see below) |

Generate the base64 values:

```bash
cat powersync/service.yaml | base64
cat powersync/sync-config.yaml | base64
```

### Step 3: Configure Postgres

Ensure your production Postgres has:

```sql
ALTER SYSTEM SET wal_level = 'logical';
-- Restart Postgres after this change

CREATE PUBLICATION powersync FOR TABLE "Category", "Question";
```

### Step 4: Generate RSA keys for production

```bash
npm run powersync:generate-keys
```

Deploy the public key via the admin app's `/api/auth/jwks` endpoint. The private key signs tokens — it must be available to the admin app at runtime (store it as an environment variable or secret in production).

### Step 5: Update mobile app config

Update the production URLs in `QuizYourself/lib/powersync/connector.ts`:

```typescript
// In the non-__DEV__ branches:
return 'https://your-admin-domain.com';      // backend URL
return 'https://your-powersync-domain.com';  // PowerSync URL
```

### Step 6: Deploy and verify

1. Deploy the Docker Compose stack in Coolify
2. Check health: `curl https://<powersync-domain>/probes/liveness`
3. Check logs for "Replicating" messages confirming data flow

## Troubleshooting

| Issue | Fix |
|-------|-----|
| PowerSync can't connect to Postgres | Verify `PS_DATA_SOURCE_URI` is reachable from the container. Check `sslmode`. |
| "Publication 'powersync' does not exist" | Run `CREATE PUBLICATION powersync FOR TABLE "Category", "Question";` on the database. |
| Token verification fails | Ensure `PS_JWKS_URL` is reachable from the PowerSync container and returns valid JWKS JSON. |
| Mobile app won't sync | Check that the token endpoint returns a JWT with the correct `sub` and `aud: "powersync-dev"`. |
| Config changes not picked up | PowerSync doesn't watch config files. Restart the container after changes. |
