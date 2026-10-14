# storeit

## Build locally before pushing

Before any `git push` or `vercel deploy`, run the project's build (`npm run build`, or the equivalent for its package manager) and make sure it passes. Every push to `main` triggers a paid Vercel build, and failed builds still burn build minutes, so catch errors locally first.

- If the build fails, fix it before pushing. Don't push "to see if Vercel builds it."
- Batch related commits and push once, rather than pushing after every small change.
