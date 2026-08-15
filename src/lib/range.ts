/**
 * 起手牌范围记法解析。
 *
 * 支持的 token：
 *   - 对子：      "77"、"22+"、"TT+"、"88-55"
 *   - 同花：      "AJs"、"A2s+"、"K9s+"、"T7s-T5s"
 *   - 不同花：    "AJo"、"KTo+"、"Q9o-Q7o"
 * token 之间用逗号分隔，空白忽略。
 *
 * "+" 的含义遵循通用约定：
 *   对子   "88+"  → 88,99,TT,JJ,QQ,KK,AA
 *   非对子 "A7s+" → A7s,A8s,A9s,ATs,AJs,AQs,AKs（固定高张，抬高低张）
 */

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const
export type Rank = (typeof RANKS)[number]

/** 牌力索引：A=0 最大，2=12 最小 */
const idx = (r: string): number => RANKS.indexOf(r as Rank)

/** 169 个起手牌代号，如 "AA" / "AKs" / "AKo" */
export type HandCode = string

/** 该起手牌代号占多少个具体组合（对子 6，同花 4，不同花 12） */
export function comboCount(code: HandCode): number {
  if (code.length === 2) return 6
  return code.endsWith('s') ? 4 : 12
}

export const TOTAL_COMBOS = 1326

/** 生成 13×13 网格的代号：grid[r][c]，对角线为对子，右上同花，左下不同花 */
export function gridCodes(): HandCode[][] {
  return RANKS.map((hi, r) =>
    RANKS.map((lo, c) => {
      if (r === c) return `${hi}${hi}`
      return r < c ? `${hi}${lo}s` : `${lo}${hi}o`
    }),
  )
}

/** 两端顺序任意，"22-JJ" 和 "JJ-22" 等价 */
function pairsFrom(a: string, b: string): HandCode[] {
  const out: HandCode[] = []
  const from = Math.min(idx(a), idx(b))
  const to = Math.max(idx(a), idx(b))
  for (let i = from; i <= to; i++) out.push(`${RANKS[i]}${RANKS[i]}`)
  return out
}

function nonPairsFrom(hi: string, lowFrom: string, lowTo: string, suited: boolean): HandCode[] {
  const out: HandCode[] = []
  const suffix = suited ? 's' : 'o'
  const from = Math.min(idx(lowFrom), idx(lowTo))
  const to = Math.max(idx(lowFrom), idx(lowTo))
  for (let i = from; i <= to; i++) {
    const low = RANKS[i]!
    if (low === hi) continue
    out.push(`${hi}${low}${suffix}`)
  }
  return out
}

function expandToken(tokenRaw: string): HandCode[] {
  const token = tokenRaw.trim()
  if (!token) return []

  // 区间写法： "88-55" / "A9s-A5s"
  if (token.includes('-')) {
    const [a, b] = token.split('-').map((s) => s.trim())
    if (!a || !b) throw new Error(`范围记法错误: ${tokenRaw}`)
    if (a.length === 2 && a[0] === a[1]) return pairsFrom(b[0]!, a[0]!)
    const hi = a[0]!
    const suited = a.endsWith('s')
    return nonPairsFrom(hi, a[1]!, b[1]!, suited)
  }

  const plus = token.endsWith('+')
  const body = plus ? token.slice(0, -1) : token

  // 对子
  if (body.length === 2 && body[0] === body[1]) {
    return plus ? pairsFrom(body[0]!, 'A') : [body]
  }

  // 非对子
  if (body.length === 3) {
    const hi = body[0]!
    const lo = body[1]!
    const suited = body[2] === 's'
    if (!plus) return [`${hi}${lo}${suited ? 's' : 'o'}`]
    // 抬高低张，直到紧邻高张
    const stopAt = RANKS[idx(hi) + 1]
    if (!stopAt) return []
    return nonPairsFrom(hi, lo, stopAt, suited)
  }

  throw new Error(`范围记法错误: ${tokenRaw}`)
}

/** 把范围记法字符串解析成起手牌代号集合 */
export function parseRange(notation: string): Set<HandCode> {
  const set = new Set<HandCode>()
  for (const tok of notation.split(',')) {
    for (const code of expandToken(tok)) set.add(code)
  }
  return set
}

/** 该范围占全部 1326 组合的百分比 */
export function rangePercent(codes: Set<HandCode>): number {
  let n = 0
  for (const c of codes) n += comboCount(c)
  return (n / TOTAL_COMBOS) * 100
}

/** 按组合数加权随机抽一手牌（贴近真实发牌频率，而非 169 等概率） */
export function randomHandWeighted(rng: () => number = Math.random): HandCode {
  let roll = rng() * TOTAL_COMBOS
  for (const row of gridCodes()) {
    for (const code of row) {
      roll -= comboCount(code)
      if (roll <= 0) return code
    }
  }
  return 'AA'
}

/** 拆成可显示的两张牌，例如 "AKs" → ["A♠","K♠"] 用于卡牌可视化 */
export function toCards(code: HandCode): [string, string, boolean] {
  const hi = code[0]!
  const lo = code[1]!
  const suited = code.endsWith('s')
  return [hi, lo, suited]
}
