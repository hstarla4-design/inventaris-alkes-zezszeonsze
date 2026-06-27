import cron from 'node-cron'
import { spawn } from 'child_process'
import path from 'path'

const MAILER_PATH = path.resolve(
  process.cwd(),
  'backend/src/integrations/gmail/gmail-vendor-mailer.mjs'
)

export function startEmailScheduler() {
  console.log('[EMAIL-SCHEDULER] started')

  cron.schedule('* * * * *', async () => {
    console.log('[EMAIL-SCHEDULER] checking queue...')

    try {
      const child = spawn('node', [MAILER_PATH], {
        stdio: 'inherit',
        shell: false,
      })

      child.on('close', (code) => {
        if (code === 0) {
          console.log('[EMAIL-SCHEDULER] email processing completed')
        } else {
          console.error(
            `[EMAIL-SCHEDULER] process exited with code ${code}`
          )
        }
      })
    } catch (error) {
      console.error('[EMAIL-SCHEDULER] failed:', error.message)
    }
  })
}