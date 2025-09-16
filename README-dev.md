Development notes: Vercel Function Runtimes

If Vercel shows the error "Function Runtimes must have a valid version…":

1. Verify repo config:

   - Only one `vercel.json` exists at the repo root.
   - No legacy keys like `builds`, `routes`, or `runtimes` are present.
   - FFmpeg vendor binaries are included via `includeFiles: "vendor/ffmpeg/**"`.

2. Check Vercel Project settings:

   - In Project → Settings → Functions → Function Runtimes, remove any custom entries.
   - Ensure route-level exports handle runtime, e.g. `export const runtime = 'nodejs'`.

3. Redeploy with Clear build cache.

This repository uses route-level runtime configuration and Next.js file tracing for FFmpeg assets.
