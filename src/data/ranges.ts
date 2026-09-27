/**
 * 范围表。
 *
 * 内容正确性原则（见 docs/curriculum.md 第七节）：
 * 每张表必须标注「适用条件」与「性质」。性质分两类：
 *   - consensus  : 广泛采用的共识标准
 *   - simplified : 为便于记忆做过简化的近似，会说明简化代价
 * 不标注来源的精确数字不进表。
 */

import { parseRange } from '../lib/range'

export type Position = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB'

export const POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB']

export const POSITION_LABEL: Record<Position, string> = {
  UTG: 'UTG（枪口位）',
  HJ: 'HJ（劫机位）',
  CO: 'CO（关煞位）',
  BTN: 'BTN（按钮位）',
  SB: 'SB（小盲）',
}

export interface RangeTable {
  id: string
  name: string
  /** 适用条件：人数、筹码深度、是否有 ante、抽水环境 */
  conditions: string
  nature: 'consensus' | 'simplified'
  /** 简化代价说明（nature 为 simplified 时必填） */
  caveat?: string
  ranges: Record<Position, string>
}

export const RFI_6MAX: RangeTable = {
  id: 'rfi-6max-100bb',
  name: '6-max 无限注现金局 首入加注范围（RFI）',
  conditions: '6 人桌 · 100bb 深度 · 无 ante · 中低抽水环境',
  nature: 'simplified',
  caveat:
    '这是便于记忆的硬边界近似表。真实均衡策略在边缘手牌上是混合频率（例如 UTG 的 A9s 可能是 60% 加注 / 40% 弃牌），而本表把它压成「要么加要么弃」。边缘手打错的 EV 损失很小，但需要知道边界本身是模糊的。SB 采用纯加注体系（不 limp）。',
  ranges: {
    UTG: '22+, A7s+, A5s-A4s, K9s+, QTs+, JTs, T9s, 98s, ATo+, KQo',
    HJ: '22+, A5s+, K8s+, Q9s+, J9s+, T8s+, 97s+, 87s, 76s, A9o+, KJo+, QJo',
    CO: '22+, A2s+, K7s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 76s, 65s, 54s, A9o+, KTo+, QTo+, JTo',
    BTN: '22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 95s+, 85s+, 74s+, 63s+, 53s+, A2o+, K8o+, Q9o+, J9o+, T9o, 98o',
    SB: '22+, A2s+, K2s+, Q6s+, J7s+, T7s+, 96s+, 86s+, 75s+, 64s+, 54s, A7o+, A5o-A2o, K9o+, Q9o+, JTo, T9o',
  },
}

/** 单个范围（非按位置分的表） */
export interface SimpleRange {
  id: string
  name: string
  conditions: string
  nature: 'consensus' | 'simplified'
  caveat?: string
  notation: string
}

export const BB_CALL_VS_CO: SimpleRange = {
  id: 'bb-call-vs-co',
  name: 'BB 面对 CO 开池的跟注范围',
  conditions: '6 人桌 · 100bb · 无 ante · 对手开 2.5bb · 已扣除 3bet 部分',
  nature: 'simplified',
  caveat:
    '这是「跟注」范围，不含 BB 的 3bet 范围（QQ+、AK 等强牌走 3bet 那条线），所以它的上限天然被削。翻后所有关于 BB 范围的判断都要记住这一点。真实策略在边缘手上是混合频率，本表压成了硬边界。',
  notation:
    '22-JJ, A2s-AJs, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 74s+, 63s+, 53s+, 43s, A2o-AJo, K7o+, Q8o+, J8o+, T8o+, 97o+, 87o, 76o',
}

export const RANGE_TABLES: RangeTable[] = [RFI_6MAX]
export const SIMPLE_RANGES: SimpleRange[] = [BB_CALL_VS_CO]

export function findTable(id: string): RangeTable | undefined {
  return RANGE_TABLES.find((t) => t.id === id)
}

/**
 * 分层着色：一手牌最早从哪个位置开始开池。越早开池的牌越强。
 * 按 POSITIONS 顺序找第一个包含它的位置；都不开返回 null。
 * 当前 6-max 表里 SB 范围完全包含在 BTN 之内，所以实际只有四层。
 */
export function openTier(t: RangeTable, code: string): Position | null {
  for (const p of POSITIONS) if (parseRange(t.ranges[p]).has(code)) return p
  return null
}

/** 各层的颜色深度（0..1），UTG 最深 */
export const TIER_SHADE: Record<Position, number> = {
  UTG: 1,
  HJ: 0.7,
  CO: 0.45,
  BTN: 0.2,
  SB: 0.05,
}

/** 预先算好一张表的分层，供矩阵着色 */
export function tierShading(t: RangeTable): {
  shade: (code: string) => number
  tiers: { label: string; t: number }[]
} {
  const tier = new Map<string, Position>()
  for (const p of [...POSITIONS].reverse())
    for (const c of parseRange(t.ranges[p])) tier.set(c, p)
  const used = POSITIONS.filter((p) => [...tier.values()].includes(p))
  return {
    shade: (code) => {
      const p = tier.get(code)
      return p ? TIER_SHADE[p] : 0
    },
    tiers: used.map((p) => ({ label: `${p} 起开`, t: TIER_SHADE[p] })),
  }
}
