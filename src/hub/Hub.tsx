import { useState } from 'react'
import type { LearningEngine } from '../engine/engine.ts'
import type { Subject } from '../engine/types.ts'
import { names, subjects, type Language } from '../ui/development.ts'

export function Hub({ engine, language, start, busy }: { engine: LearningEngine; language: Language; start: (s: Subject) => void; busy: boolean }) {
  const [position, setPosition] = useState({ x: 48, y: 65 })
  const [dialogue, setDialogue] = useState('')
  const zh = language === 'zh'
  const status = engine.dailyStatus()
  const move = (x: number, y: number) => setPosition({ x: Math.min(90, Math.max(10, x)), y: Math.min(82, Math.max(35, y)) })
  return <>
    <section className="hub-heading"><div><p className="eyebrow">{zh ? '小海龟学院 · 开发预览' : 'TURTLE ACADEMY · DEVELOPMENT PREVIEW'}</p><h1>{zh ? '每一次发现，都是新冒险。' : 'A little discovery. A new adventure.'}</h1><p>{zh ? '选一个科目，或回来继续上次的练习。' : 'Choose a trail, or pick up where you left off.'}</p></div><span className="date-pill">{status.date}</span></section>
    <section className="hub-map" aria-label={zh ? '可探索的小岛' : 'Explorable island'}>
      <div className="island-path" aria-hidden="true" /><span className="map-tree tree-one" aria-hidden="true">♣</span><span className="map-tree tree-two" aria-hidden="true">♣</span>
      <button className="map-object library" onClick={() => { move(25, 45); setDialogue(zh ? '图书馆里，每个问题都值得慢慢想。' : 'The library keeps a place for every curious question.') }} aria-label={zh ? '走到图书馆' : 'Walk to the library'}>⌂<span>{zh ? '图书馆' : 'Library'}</span></button>
      <button className="map-object pond" onClick={() => { move(75, 70); setDialogue(zh ? '池塘很安静。看看水面的波纹。' : 'A quiet pond. Watch the ripples for a moment.') }} aria-label={zh ? '走到池塘' : 'Walk to the pond'}>≈<span>{zh ? '池塘' : 'Pond'}</span></button>
      <button className="map-object companion" onClick={() => { move(62, 45); setDialogue(engine.state.story.ended ? (zh ? '我们的灯塔亮起来了！今天想去哪里看看？' : 'Our lantern is glowing! Where shall we wander today?') : (zh ? '你好！我是小海龟。先观察，再尝试，我会陪着你。' : 'Hello, explorer. I am Moss. Look closely, take your time. I am here with you.')) }} aria-label={zh ? '和小海龟聊天' : 'Talk to Moss'}><img src="/turtle.svg" alt="" /><span>{zh ? '小海龟' : 'Moss'}</span></button>
      <span className="avatar" role="img" aria-label={zh ? '你的位置' : 'Your explorer'} style={{ left: `${position.x}%`, top: `${position.y}%` }}>✦</span>
      {engine.state.story.world_flags.includes('lantern-lit') && <span className="lantern" aria-label={zh ? '已点亮的灯塔' : 'Lit lantern'}>☀</span>}
    </section>
    <div className="map-controls" aria-label={zh ? '移动方向' : 'Movement controls'}>{([['←', -8, 0], ['↑', 0, -8], ['↓', 0, 8], ['→', 8, 0]] as const).map(([label, x, y]) => <button key={label} onClick={() => move(position.x + x, position.y + y)} aria-label={`${zh ? '移动' : 'Move'} ${label}`}>{label}</button>)}<p>{zh ? '点击地点或方向键移动。' : 'Tap a place or use the direction buttons to move.'}</p></div>
    {dialogue && <p className="speech" role="status">{dialogue}</p>}
    <div className="trails">{subjects.map((s, i) => {
      const complete = status.subjects.find((row) => row.subject === s)?.complete
      const task = engine.openTask(s)
      const remaining = task ? Math.max(0, task.planned_total - engine.answeredCount(task)) : engine.xFor(s)
      return <article className={`trail trail-${s}`} key={s}><span className="trail-number">0{i + 1}</span><h2>{names[language][s]}</h2><p className="dev-label">{zh ? '开发用模拟内容' : 'Synthetic development content'}</p><p>{complete ? (zh ? '今天已完成' : 'Complete today') : task ? `${remaining} ${zh ? '题待完成' : 'questions remaining'}` : `${zh ? '至少' : 'At least'} ${remaining} ${zh ? '题 · 语言材料可能更多' : 'questions · language materials may add more'}`}</p><button disabled={busy || status.rest} onClick={() => start(s)}>{complete ? (zh ? '额外练习' : 'Optional practice') : task ? (zh ? '继续' : 'Resume') : (zh ? '开始' : 'Start')} {names[language][s]} →</button></article>
    })}</div>
    <section className="exploration"><h2>{zh ? '自由探索' : 'Wander a little'}</h2><p role="status">{status.rest ? (zh ? '今天休息。没有学习完成记录或故事奖励。' : 'A rest day. No learning completion or story credit.') : status.explorationUnlocked ? (zh ? '今天的必修任务完成了，可以自由探索！' : 'Today’s required trails are complete. Exploration is open!') : (zh ? '完成所有开放科目的今日任务，即可自由探索。' : 'Complete today’s work in every available subject to unlock exploration.')}</p><button disabled={!status.explorationUnlocked} onClick={() => setDialogue(zh ? '你发现了一片像小船的叶子。下一次还可以回来看看。' : 'You found a leaf shaped like a little boat. Come back whenever you like.')}>{zh ? '探索小岛' : 'Explore the island'}</button></section>
  </>
}
