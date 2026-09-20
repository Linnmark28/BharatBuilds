import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function officerScraperApi() {
  return {
    name: 'officer-scraper-api',
    configureServer(server) {
      server.middlewares.use('/api/scrape-officers', async (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end(JSON.stringify({ error: 'Use POST' }))
          return
        }

        const scraper = spawn(process.execPath, ['scripts/scrape-officers.mjs'], {
          cwd: process.cwd(),
          windowsHide: true,
        })
        let errorOutput = ''
        scraper.stderr.on('data', (chunk) => { errorOutput += chunk })
        scraper.on('close', async (code) => {
          response.setHeader('Content-Type', 'application/json')
          if (code !== 0) {
            response.statusCode = 422
            response.end(JSON.stringify({ error: errorOutput.trim() || 'Scraper failed' }))
            return
          }
          try {
            const records = JSON.parse(await readFile('public/data/officers.json', 'utf8'))
            response.end(JSON.stringify({ count: records.length, records }))
          } catch {
            response.statusCode = 500
            response.end(JSON.stringify({ error: 'Scraper completed but output could not be read' }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), officerScraperApi()],
  server: {
    // `sam build` writes locked temp files under backend/, which crashed the watcher on Windows.
    watch: { ignored: ['**/backend/**', '**/data/seed/**'] },
  },
})
