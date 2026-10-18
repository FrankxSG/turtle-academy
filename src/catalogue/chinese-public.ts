// The public Chinese content bundled with the app (generic curriculum content only; no learner records).
import curriculum from '../../content/chinese/curriculum.json'
import review from '../../content/chinese/review-characters.json'
import type { RawBatch, TargetLists } from './chinese.ts'

const batchFiles = import.meta.glob('../../content/chinese/batches/*.json', { eager: true, import: 'default' })

export function publicChineseContent(): { lists: TargetLists; batches: RawBatch[] } {
  const lists: TargetLists = {
    manifest_version: curriculum.manifest_version,
    characters: curriculum.characters,
    skill_targets: curriculum.skill_targets,
    review_characters: review.characters,
    extra_characters: review.extra_characters,
  }
  const batches = Object.keys(batchFiles).sort().map((k) => batchFiles[k] as RawBatch)
  return { lists, batches }
}
