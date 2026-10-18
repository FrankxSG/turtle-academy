// Presentation text for catalogue items: stems, options, hints, explanations and material bodies.
// The engine judges against keys in the catalogue release; this registry only supplies what the child reads.
// Development fixtures and reviewed subject content (public batches and a device-local private pack) all
// register here, keyed by item id or material ref.
import type { Response } from '../engine/types.ts'

export interface Exercise {
  stem: string
  options: { id: string; text: string }[]
  left?: { id: string; text: string }[]
  hint: string
  explanation: string
  key: Response
}

export interface MaterialText {
  title: string
  text: string
}

const exercises = new Map<string, Exercise>()
const materials = new Map<string, MaterialText>()

export function registerExercise(id: string, e: Exercise) {
  exercises.set(id, e)
}

export function registerMaterial(ref: string, m: MaterialText) {
  materials.set(ref, m)
}

export function exercise(id: string): Exercise {
  const e = exercises.get(id)
  if (!e) throw new Error('presentation_missing')
  return e
}

export function hasExercise(id: string): boolean {
  return exercises.has(id)
}

export function material(ref: string): MaterialText {
  const m = materials.get(ref)
  if (!m) throw new Error('material_missing')
  return m
}
