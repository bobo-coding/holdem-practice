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
  /** 手牌走读：逐街回放，每一步带决策注解 */
  | { t: 'replay'; setup: string; hero: string[]; steps: ReplayStep[] }
  /** 引用预计算的翻牌对抗数据，boards 用 "K♠ 7♦ 2♣" 形式 */
  | { t: 'flops'; boards: string[]; caption?: string }
  /** 引用预计算的转牌数据，flop 用 "K♠ 7♦ 2♣" 形式 */
  | { t: 'turns'; flop: string; caption?: string }
  /** 引用预计算的阻断牌数据 */
  | { t: 'blockers'; board: string; target: string; caption?: string }
  /** 引用预计算的 Push/Fold 纳什表，渲染某一深度下的范围矩阵 */
  | { t: 'pushfold'; tableId: string; role: 'push' | 'call'; stack: number }

export interface ReplayStep {
  /** 街名，如 "翻牌 Flop" */
  street: string
  /** 该街的公牌（累计写全） */
  board?: string[]
  /** 该街结束时的底池，单位 bb */
  pot?: string
  /** 发生的行动 */
  action: string
  /** 决策注解：为什么这么打 */
  note?: string
}

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
