This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Local Database (Docker + pgAdmin)

The local PostgreSQL database and a bundled pgAdmin instance are managed with Docker Compose.

### Start / stop

```bash
npm run db:up     # docker-compose up -d
npm run db:down   # docker-compose down
```

| Service | URL | Credentials |
| --- | --- | --- |
| PostgreSQL | `localhost:5433` | user `postgres`, password `password`, database `quiz_admin` |
| pgAdmin | http://localhost:5050 | email `admin@example.com`, password `adminpassword` |

The app connects via `DATABASE_URL` in `.env`:

```
postgresql://postgres:password@localhost:5433/quiz_admin?schema=public
```

### Browsing the database with pgAdmin

1. Start the stack with `npm run db:up`, then open http://localhost:5050.
2. Log in with the pgAdmin credentials above.
3. Expand **Servers → Quiz Admin (local)**. This connection is pre-configured, so there is no need to add a server manually. (If you use pgAdmin's own "Register Server" dialog instead, the host is `db` and the port is `5432` — the internal Docker network address, not `localhost:5433`.)
4. The first time you connect, pgAdmin asks for the database password — enter `password` and tick **Save password** so you are not asked again.
5. Expand **Databases → quiz_admin → Schemas → public → Tables**, then right-click a table and choose **View/Edit Data → All Rows** to inspect rows.

### How the connection is pre-configured

- `pgadmin/servers.json` defines the server and is re-imported on every startup (`PGADMIN_REPLACE_SERVERS_ON_STARTUP=True`).
- `pgadmin/pgpass` supplies the password; `PGPASS_FILE` copies it into the container.
- pgAdmin's own state is kept in the `pgadmin_data` Docker volume.

> **Note:** `PGPASS_FILE` is only applied during the container's first initialization, so an already-initialized volume keeps its existing pgpass. To re-apply a changed password (or reset pgAdmin), remove the volume and start again:
>
> ```bash
> docker-compose rm -sf pgadmin
> docker volume rm quiz-yourself-admin_pgadmin_data
> npm run db:up
> ```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

http://localhost:3000/api/content?user_id=<device-or-auth0-id>
https://quiz-yourself-admin.ohapps.com/api/content?user_id=<device-or-auth0-id>
