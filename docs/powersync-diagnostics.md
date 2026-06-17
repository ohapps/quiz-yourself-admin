# PowerSync Sync Diagnostics

## What it is

The [PowerSync Diagnostics App](https://diagnostics-app.powersync.com/) is a browser-based tool that connects directly to your PowerSync instance as a sync client. It lets you:

- Verify that your PowerSync service is reachable and authenticating correctly
- See which tables and rows are being synced
- Inspect the data flowing through sync streams in real time
- Confirm that changes in Postgres propagate to clients
- Debug sync rule/stream configuration issues

## How to connect

### 1. Get a token

With the admin app running locally (`npm run dev`), generate a JWT:

```bash
curl http://localhost:3000/api/auth/token
```

Copy the `token` value from the JSON response.

### 2. Open the diagnostics app

Go to https://diagnostics-app.powersync.com/

### 3. Enter connection details

| Field | Value |
|-------|-------|
| **PowerSync URL** | `http://localhost:8090` |
| **Token** | The JWT from step 1 |

Click connect.

## Notes

- Tokens expire after 1 hour. Generate a new one if the connection fails with an auth error.
- The diagnostics app runs in your browser, so `localhost:8090` works as long as PowerSync is running (`npm run powersync:up`).
- If the browser blocks the connection (HTTPS page → HTTP localhost), try opening the diagnostics app via HTTP directly or allow insecure localhost in Chrome (`chrome://flags/#allow-insecure-localhost`).
- This tool acts as a real sync client — it will show the same data your mobile app would receive.
