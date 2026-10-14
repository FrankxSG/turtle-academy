import type { CharacterData } from './strokeMath'
// Generic sample characters only (not from any worksheet or learner record).
// Data: hanzi-writer-data (from Make Me a Hanzi / Arphic fonts), Arphic Public
// License — see ./data/ARPHICPL.TXT and ./README.md. Bundled so the trial works offline.
import ren from './data/人.json'
import da from './data/大.json'
import shan from './data/山.json'
import shui from './data/水.json'
import mu from './data/木.json'
import zi from './data/字.json'

export const SAMPLE_CHARACTERS: { character: string; pinyin: string; data: CharacterData }[] = [
  { character: '人', pinyin: 'rén', data: ren },
  { character: '大', pinyin: 'dà', data: da },
  { character: '山', pinyin: 'shān', data: shan },
  { character: '木', pinyin: 'mù', data: mu },
  { character: '水', pinyin: 'shuǐ', data: shui },
  { character: '字', pinyin: 'zì', data: zi },
]
