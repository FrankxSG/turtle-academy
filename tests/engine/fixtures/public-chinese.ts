// Reads the real public Chinese content files (generic curriculum content, no learner data).
import { readFileSync, readdirSync } from 'node:fs'
import type { RawBatch, TargetLists } from '../../../src/catalogue/chinese.ts'

const root = new URL('../../../content/chinese/', import.meta.url)
const json = (p: string) => JSON.parse(readFileSync(new URL(p, root), 'utf8'))

export function publicChinese() {
  const curriculum = json('curriculum.json')
  const review = json('review-characters.json')
  const lists: TargetLists = {
    manifest_version: curriculum.manifest_version, characters: curriculum.characters, skill_targets: curriculum.skill_targets,
    review_characters: review.characters, extra_characters: review.extra_characters,
  }
  const batches: RawBatch[] = readdirSync(new URL('batches/', root)).filter((f) => f.endsWith('.json')).sort()
    .map((f) => json(`batches/${f}`))
  return { lists, batches }
}

