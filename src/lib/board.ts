/**
 * 牌面结构分类。
 *
 * 分类维度是客观的（花色、是否配对、连接跨度、高张数量），
 * 「干燥/湿润」的分档是本项目采用的一套明确定义，不是行业标准术语 ——
 * 它的作用是让判断可复现、可训练，而不是精确复刻任何一本书的说法。
 */

const RANK_ORDER = 'AKQJT98765432'
export const SUIT_CHARS = ['♠', '♥', '♦', '♣'] as const

export interface Card {
  rank: string
  suit: string
  /** 2=0 … A=12 */
  val: number
}

export function parseCard(s: string): Card {
  const rank = s[0]!
  const suit = s.slice(1)
  return { rank, suit, val: 12 - RANK_ORDER.indexOf(rank) }
}

export type SuitPattern = 'rainbow' | 'twoTone' | 'monotone'
export type Connectivity = 'connected' | 'semi' | 'disconnected'
export type Wetness = 'dry' | 'medium' | 'wet'

export interface Texture {
  cards: Card[]
  suitPattern: SuitPattern
  paired: boolean
  trips: boolean
  connectivity: Connectivity
  /** T 及以上的张数 */
  broadwayCount: number
  /** 最大一张的点数 */
  topVal: number
  wetness: Wetness
  /** 湿润度打分明细，用于练习里的解析 */
  reasons: string[]
}

export const SUIT_LABEL: Record<SuitPattern, string> = {
  rainbow: '彩虹面（三种花色）',
  twoTone: '双色面（两张同花色）',
  monotone: '单色面（三张同花色）',
}

export const CONN_LABEL: Record<Connectivity, string> = {
  connected: '连接',
  semi: '半连接',
  disconnected: '断张',
}

export const WET_LABEL: Record<Wetness, string> = {
  dry: '干燥',
  medium: '中等',
  wet: '湿润',
}

/**
 * 连接性：看三张牌能落进多窄的顺子窗口。
 * A 可作 1，所以 A23 这类也算连接。
 */
function connectivityOf(vals: number[]): Connectivity {
  const uniq = [...new Set(vals)].sort((a, b) => a - b)
  if (uniq.length < 3) return 'disconnected' // 配对面单独处理
  const spans = [uniq[2]! - uniq[0]!]
  if (uniq.includes(12)) {
    // A 当 1 再算一次
    const low = uniq.map((v) => (v === 12 ? -1 : v)).sort((a, b) => a - b)
    spans.push(low[2]! - low[0]!)
  }
  const span = Math.min(...spans)
  if (span <= 4) return 'connected'
  if (span <= 6) return 'semi'
  return 'disconnected'
}

export function classify(boardStr: string[]): Texture {
  const cards = boardStr.map(parseCard)
  const vals = cards.map((c) => c.val)
  const suits = cards.map((c) => c.suit)
  const suitCounts = new Map<string, number>()
  for (const s of suits) suitCounts.set(s, (suitCounts.get(s) ?? 0) + 1)
  const maxSuit = Math.max(...suitCounts.values())
  const suitPattern: SuitPattern =
    maxSuit === 3 ? 'monotone' : maxSuit === 2 ? 'twoTone' : 'rainbow'

  const rankCounts = new Map<number, number>()
  for (const v of vals) rankCounts.set(v, (rankCounts.get(v) ?? 0) + 1)
  const maxRank = Math.max(...rankCounts.values())
  const paired = maxRank >= 2
  const trips = maxRank === 3

  const connectivity = paired ? 'disconnected' : connectivityOf(vals)
  const broadwayCount = vals.filter((v) => v >= 8).length // T=8
  const topVal = Math.max(...vals)

  const reasons: string[] = []
  let score = 0
  if (suitPattern === 'monotone') {
    score += 2
    reasons.push('单色面，同花已经成立或一张就成 +2')
  } else if (suitPattern === 'twoTone') {
    score += 1
    reasons.push('双色面，存在同花听牌 +1')
  }
  if (connectivity === 'connected') {
    score += 2
    reasons.push('三张落在很窄的顺子窗口内 +2')
  } else if (connectivity === 'semi') {
    score += 1
    reasons.push('存在卡顺一类的顺子可能 +1')
  }
  if (!paired && broadwayCount >= 2) {
    score += 1
    reasons.push('两张以上大牌，与双方范围交互多 +1')
  }
  if (paired) {
    reasons.push('配对面：听牌少，但葫芦/四条的可能改变了整棵下注树')
  }
  const wetness: Wetness = score >= 4 ? 'wet' : score >= 2 ? 'medium' : 'dry'

  return {
    cards,
    suitPattern,
    paired,
    trips,
    connectivity,
    broadwayCount,
    topVal,
    wetness,
    reasons,
  }
}

/** 随机发一个翻牌 */
export function randomFlop(): string[] {
  const deck: string[] = []
  for (const r of RANK_ORDER) for (const s of SUIT_CHARS) deck.push(r + s)
  const out: string[] = []
  while (out.length < 3) {
    const c = deck[Math.floor(Math.random() * deck.length)]!
    if (!out.includes(c)) out.push(c)
  }
  // 按点数从大到小显示，符合读牌习惯
  return out.sort((a, b) => parseCard(b).val - parseCard(a).val)
}
