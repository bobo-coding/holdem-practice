/**
 * 范围表。
 *
 * 内容正确性原则（见 docs/curriculum.md 第七节）：
 * 每张表必须标注「适用条件」与「性质」。性质分两类：
 *   - consensus  : 广泛采用的共识标准
 *   - simplified : 为便于记忆做过简化的近似，会说明简化代价
 * 不标注来源的精确数字不进表。
 */

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

export const RANGE_TABLES: RangeTable[] = [RFI_6MAX]

export function findTable(id: string): RangeTable | undefined {
  return RANGE_TABLES.find((t) => t.id === id)
}
