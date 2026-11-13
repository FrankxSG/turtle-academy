// The build's Chinese course setting (VITE_CHINESE_COURSE): one place decides which course the app serves.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CHINESE_COURSES, parseChineseCourse } from '../../src/chinese-course.ts'
import { CatalogueRegistry } from '../../src/catalogue/adapter.ts'
import { buildChineseContent } from '../../src/catalogue/chinese.ts'
import { installPublicBuilds, type CachedPublicBuild } from '../../src/catalogue/public-install.ts'
import { publicChinese } from '../engine/fixtures/public-chinese.ts'

test('unset or empty is the Pilot course: Higher Chinese', () => {
  assert.equal(parseChineseCourse(undefined), 'higher_chinese')
  assert.equal(parseChineseCourse(''), 'higher_chinese')
  assert.equal(parseChineseCourse('  '), 'higher_chinese')
  assert.equal(parseChineseCourse(' Chinese '), 'chinese')
  assert.equal(parseChineseCourse('higher_chinese'), 'higher_chinese')
})

test('an unknown course fails the build instead of silently serving another course', () => {
  assert.throws(() => parseChineseCourse('p2_higher_chinese'), /VITE_CHINESE_COURSE: unknown course "p2_higher_chinese"/)
  assert.throws(() => parseChineseCourse('hcl'), /unknown course "hcl"/)
})

test('each course names its mistake-pack course and the grade courses it practises', () => {
  assert.deepEqual(CHINESE_COURSES.higher_chinese, { pack: 'p2_higher_chinese', courses: ['p2_higher_chinese', 'p3_higher_chinese'] })
  assert.deepEqual(CHINESE_COURSES.chinese, { pack: 'p2_chinese', courses: ['p2_chinese', 'p3_chinese'] })
})

const memoryStore = () => {
  const builds = new Map<string, CachedPublicBuild>()
  return { all: async () => [...builds.values()], put: async (b: CachedPublicBuild) => { builds.set(b.version, b) } }
}

test('the default install is unchanged for existing devices, and the other course installs its own content', async () => {
  const content = publicChinese()
  const before = buildChineseContent({ courses: ['p2_higher_chinese', 'p3_higher_chinese'], ...content }).release.version
  const byDefault = new CatalogueRegistry()
  await installPublicBuilds(byDefault, memoryStore(), new Set(), content)
  assert.equal(byDefault.current('chinese')!.version, before, 'same content version: nothing re-downloads or resets')
  const higher = new CatalogueRegistry()
  await installPublicBuilds(higher, memoryStore(), new Set(), content, CHINESE_COURSES.higher_chinese.courses)
  assert.equal(higher.current('chinese')!.version, before)
  const standard = new CatalogueRegistry()
  await installPublicBuilds(standard, memoryStore(), new Set(), content, CHINESE_COURSES.chinese.courses)
  const release = standard.current('chinese')!
  assert.ok(release.items.length > 0)
  assert.ok(release.items.every((i) => i.course === 'p2_chinese' || i.course === 'p3_chinese'), 'only the chosen course is served')
})
