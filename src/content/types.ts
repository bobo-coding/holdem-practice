import type { SkillTag } from '../lib/storage'
import type { Position } from '../data/ranges'

export type Block =
  | { t: 'h'; text: string }
  | { t: 'p'; text: string }
  | { t: 'list'; items: string[]; ordered?: boolean }
  | { t: 'key'; title: string; text: string }
  | { t: 'warn'; title: string; text: string }
  | { t: 'table'; head: string[]; rows: string[][] }
  /** 引用一张范围表并渲染 13×13 矩阵 */
  | { t: 'range'; tableId: string; position: Position }

export interface Question {
  id: string
  tag: SkillTag
  prompt: string
  options: string[]
  answer: number
  explain: string
}

export interface LessonContent {
  goal: string
  blocks: Block[]
  quiz: Question[]
}
