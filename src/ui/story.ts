import type { LearningEngine } from '../engine/engine.ts'
import type { Checkpoint } from '../engine/types.ts'

export const stories = {
  en: [
    'Moss finds a tiny lantern beside the library. Its light is sleeping. “Shall we look for its lost glow?”',
    'By the pond, a ripple reflects a golden spark. Moss carries the spark gently back to the lantern.',
    'A breeze turns the lantern toward the island path. Its glow reaches the library door.',
    'The little lantern shines again. The island keeps its light, and Moss is ready for quiet visits and new discoveries.',
  ],
  zh: [
    '小海龟在图书馆旁找到一盏小灯。灯光睡着了。“我们一起找回它的光，好吗？”',
    '池塘的波纹映出一颗金色的光点。小海龟轻轻把光点带回小灯旁。',
    '微风把小灯转向岛上的小路。温暖的光一直照到图书馆门口。',
    '小灯又亮起来了。小岛会一直保留这份光。小海龟也会陪你聊天，一起发现新事物。',
  ],
}

export async function deliverStory(
  engine: LearningEngine,
  pending: Checkpoint,
) {
  await engine.deliverCheckpoint(pending.id)
  engine.state.story.chapter = Math.max(
    engine.state.story.chapter,
    Math.min(pending.story_seq + 1, stories.en.length),
  )
  if (pending.story_seq >= stories.en.length - 1) {
    engine.state.story.ended = true
    if (!engine.state.story.world_flags.includes('lantern_lit'))
      engine.state.story.world_flags.push('lantern_lit')
  }
  return engine.flush()
}
