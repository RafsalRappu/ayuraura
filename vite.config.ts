import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * `npm run dev` starts Vite on its own, which has no serverless functions.
 * Left alone it resolves /api/* to the TypeScript sources under api/ and serves
 * them to the browser as modules. Answer with a clear error instead — the real
 * endpoints come from `npm run dev:api` (vercel dev), which routes /api before
 * anything reaches Vite.
 */
const apiUnavailableInVite = (): Plugin => ({
  name: 'api-unavailable-in-vite',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/api/')) return next()

      res.statusCode = 501
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          message:
            'The /api routes are not served by `npm run dev`. Stop it and run `npm run dev:api` instead.',
        })
      )
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiUnavailableInVite()],
})
