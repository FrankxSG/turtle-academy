// Scan the actual default build, including lazy chunks and service-worker precache files.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
const root = resolve(process.argv[2] ?? 'dist')
const forbidden = ['turtle-academy-private-', 'DexiePrivateStore', 'MistakeProgram',
  'mistake-pack', 'mistake-export', 'turtle-private-pack/1', 'turtle-private-export/1',
  'Save progress file for the private repository']
let count = 0
function scan(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) scan(path)
    else {
      count++
      const text = readFileSync(path).toString('utf8')
      if (forbidden.some((marker) => text.includes(marker)))
        throw new Error(`Private-pack surface found in public artifact: ${path}`)
    }
  }
}
scan(root)
if (!count) throw new Error('No public artifacts checked')
console.log(`PASS public bundle: ${count} artifacts; no private-pack code or controls`)
