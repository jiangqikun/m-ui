import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const missing = []

for (const [name, target] of Object.entries(packageJson.exports)) {
  const files = typeof target === 'string' ? [target] : Object.values(target)

  for (const file of files) {
    if (typeof file !== 'string' || !file.startsWith('./dist/')) {
      continue
    }

    if (!existsSync(resolve(root, file))) {
      missing.push(`${name} -> ${file}`)
    }
  }
}

if (missing.length > 0) {
  console.error('Missing exported files:')
  for (const item of missing) {
    console.error(`- ${item}`)
  }
  process.exit(1)
}

console.log(`Verified ${Object.keys(packageJson.exports).length} package exports.`)
