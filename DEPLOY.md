# Deploying to Railway

This deploys two services in a single Railway project. The MCP server runs on a private network — only the web app can reach it. Pushes to `main` auto-deploy both services.

## Prerequisites

- [Railway account](https://railway.com) (free trial gives $5 credit)
- GitHub repo pushed with the latest code

## 1. Create the Project

1. Go to [railway.com/new](https://railway.com/new)
2. Click **Deploy from GitHub repo** and select this repo
3. Authorize Railway to access your GitHub account if prompted

This creates your first service — we'll configure it as the **web** service. Auto-deploy from `main` is enabled by default.

## 2. Configure the Web Service

1. Click the service → **Settings**
2. Under **Build**, set **Dockerfile Path** to `Dockerfile`
3. Under **Networking**, Railway auto-generates a public domain — keep it
4. Go to **Variables** and add:

| Variable | Value |
|----------|-------|
| `MCP_URL` | `http://mcp.railway.internal:8888/mcp` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | your API key |
| `BASIC_AUTH_USER` | pick a username |
| `BASIC_AUTH_PASSWORD` | pick a password |

## 3. Add the MCP Service

1. Click **+ New** → **GitHub Repo** (select the same repo)
2. Rename the service to **mcp** (important — this sets the internal hostname to `mcp.railway.internal`)
3. Click the service → **Settings**
4. Under **Build**, set **Dockerfile Path** to `Dockerfile.mcp`
5. Under **Networking**, **remove the public domain** — this keeps it private-only
6. Go to **Variables** and add:

| Variable | Value |
|----------|-------|
| `PROJECT_KEY` | your commercetools project key |
| `CLIENT_ID` | your commercetools client ID |
| `CLIENT_SECRET` | your commercetools client secret |
| `AUTH_URL` | `https://auth.europe-west1.gcp.commercetools.com` |
| `API_URL` | `https://api.europe-west1.gcp.commercetools.com` |

## 4. Deploy

Click **Deploy** or push to `main` — both services will build and start automatically.

## Auto-Deploy

Railway watches the `main` branch by default. Every push triggers a redeploy of both services. No GitHub Actions or webhooks needed.

To also get preview environments for PRs, enable **PR Environments** in project settings — each PR gets its own isolated environment with both services.

## How Security Works

- **Web app**: Protected by basic auth (username/password prompt in browser)
- **MCP server**: No public domain = not reachable from the internet. Only services within the same Railway project can reach it via `mcp.railway.internal`
- **commercetools credentials**: Only exist on the MCP service, never exposed to the browser
- **`.env.local` files**: Excluded from git and Docker builds — credentials are only set via Railway's environment variables

## Local Podman Builds

If testing container builds locally behind a corporate proxy:

```bash
# Web app (disable SSL verification for yarn behind corporate proxy)
podman build --build-arg YARN_ENABLE_STRICT_SSL=false -t ct-web -f Dockerfile .

# MCP server
podman build -t ct-mcp -f Dockerfile.mcp .
```

The `YARN_ENABLE_STRICT_SSL` arg defaults to `true` and is only needed locally if you're behind a TLS-intercepting proxy. Railway builds won't need it.

## Troubleshooting

- **MCP connection errors**: Make sure the MCP service is named exactly `mcp` (this determines the `*.railway.internal` hostname)
- **Build fails**: Check that the Dockerfile paths are set correctly in each service's settings
- **Auth not working**: Verify `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD` are set on the web service
- **SSL errors in local builds**: Use `--build-arg YARN_ENABLE_STRICT_SSL=false`
