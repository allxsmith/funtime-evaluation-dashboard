# Deployment

The site deploys to GitHub Pages via `.github/workflows/deploy.yml` on every push to `main`.

## One-time setup (repo owner)

1. Push this repo to GitHub under the name **`funtime-evaluation-dashboard`** (matches the Vite-equivalent `publicPath` in `build.ts`).
2. In GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The next push to `main` will run the workflow and publish to `https://<your-username>.github.io/funtime-evaluation-dashboard/`.

## If you change the repo name

Update `publicPath` in `build.ts`:
```ts
const publicPath = isPages ? "/<new-repo-name>/" : "/";
```

For a custom domain or user-page (`<user>.github.io`), set `publicPath` to `"/"`.

## Manual local build

```bash
bun install
GITHUB_PAGES=true bun run build
# Output in dist/, serve with any static server, e.g.:
bunx serve dist
```
