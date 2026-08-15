/**
 * 离线预计算：转牌对范围的影响，以及阻断牌的量化效应。
 *
 * 产出 src/data/postflop.ts，供 L4 课程正文使用。
 * 运行：node --experimental-strip-types scripts/precompute-postflop.ts
 *
 * 重要假设：双方范围都是「翻前范围」，未按翻后行动收窄。
 * 这样做的代价是绝对数值偏保守，好处是不引入任何关于翻后策略的假设 ——
 * 而本课要说明的是「转牌这张牌本身把范围推向了哪个方向」，方向不受此影响。
 */
import { parseRange, type HandCode } from '../src/lib/range.ts'
import { RFI_6MAX, BB_CALL_VS_CO } from '../src/data/ranges.ts'
import { writeFileSync } from 'node:fs'

type Card = number

function straightHigh(rs: number[]): number {
  const s = new Set(rs)
  for (let hi = 12; hi >= 4; hi--) {
    if (s.has(hi) && s.has(hi - 1) && s.has(hi - 2) && s.has(hi - 3) && s.has(hi - 4)) return hi
  }
  if (s.has(12) && s.has(0) && s.has(1) && s.has(2) && s.has(3)) return 3
  return -1
}

function evaluate(cards: Card[]): number {
  const rc = new Array(13).fill(0)
  const sc = new Array(4).fill(0)
  const bySuit: number[][] = [[], [], [], []]
  for (const c of cards) {
    const r = c >> 2
    const s = c & 3
    rc[r]++
    sc[s]++
    bySuit[s]!.push(r)
  }
  const fs = sc.findIndex((n) => n >= 5)
  let flushScore = -1
  if (fs >= 0) {
    const rs = [...new Set(bySuit[fs]!)].sort((a, b) => b - a)
    const sf = straightHigh(rs)
    if (sf >= 0) return 8e10 + sf
    flushScore = 5e10 + rs.slice(0, 5).reduce((a, r, i) => a + r * 13 ** (4 - i), 0)
  }
  const distinct = rc
    .map((n, r) => (n > 0 ? r : -1))
    .filter((r) => r >= 0)
    .sort((a, b) => b - a)
  const st = straightHigh(distinct)
  const quads = rc.findIndex((n) => n === 4)
  const trips = [...rc.keys()].filter((r) => rc[r] === 3).sort((a, b) => b - a)
  const pairs = [...rc.keys()].filter((r) => rc[r] === 2).sort((a, b) => b - a)
  const kick = (ex: number[], n: number) => distinct.filter((r) => !ex.includes(r)).slice(0, n)
  const pack = (base: number, rs: number[]) =>
    base + rs.reduce((a, r, i) => a + r * 13 ** (4 - i), 0)
  if (quads >= 0) return pack(7e10, [quads, ...kick([quads], 1)])
  if (trips.length && (trips.length > 1 || pairs.length))
    return pack(6e10, [trips[0]!, trips.length > 1 ? trips[1]! : pairs[0]!])
  if (flushScore >= 0) return flushScore
  if (st >= 0) return 4e10 + st
  if (trips.length) return pack(3e10, [trips[0]!, ...kick([trips[0]!], 2)])
  if (pairs.length >= 2)
    return pack(2e10, [pairs[0]!, pairs[1]!, ...kick([pairs[0]!, pairs[1]!], 1)])
  if (pairs.length === 1) return pack(1e10, [pairs[0]!, ...kick([pairs[0]!], 3)])
  return pack(0, distinct.slice(0, 5))
}

const RANKS = 'AKQJT98765432'
const RANK_VAL: Record<string, number> = {}
RANKS.split('').forEach((r, i) => (RANK_VAL[r] = 12 - i))
const SUITS = ['♠', '♥', '♦', '♣']
const toCard = (s: string): Card => RANK_VAL[s[0]!]! * 4 + SUITS.indexOf(s.slice(1))
const fromCard = (c: Card): string => RANKS[12 - (c >> 2)]! + SUITS[c & 3]!

function combosOf(code: HandCode): [Card, Card][] {
  const out: [Card, Card][] = []
  const r1 = RANK_VAL[code[0]!]!
  const r2 = RANK_VAL[code[1]!]!
  if (code.length === 2) {
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) out.push([r1 * 4 + a, r1 * 4 + b])
  } else if (code.endsWith('s')) {
    for (let s = 0; s < 4; s++) out.push([r1 * 4 + s, r2 * 4 + s])
  } else {
    for (let a = 0; a < 4; a++)
      for (let b = 0; b < 4; b++) if (a !== b) out.push([r1 * 4 + a, r2 * 4 + b])
  }
  return out
}

function rangeCombos(notation: string, dead: Set<Card>): [Card, Card][] {
  const out: [Card, Card][] = []
  for (const code of parseRange(notation)) {
    for (const c of combosOf(code)) if (!dead.has(c[0]) && !dead.has(c[1])) out.push(c)
  }
  return out
}

/** 两对及以上 */
const isStrong = (hole: [Card, Card], board: Card[]) =>
  Math.floor(evaluate([...hole, ...board]) / 1e10) >= 2

// ---------------------------------------------------------------- 转牌分析

const N = 200000

interface TurnRow {
  turn: string
  label: string
  coEq: number
  coStrong: number
  bbStrong: number
}

interface TurnCase {
  flop: string[]
  rows: TurnRow[]
}

function analyzeTurn(flopStr: string[], turns: [string, string][]): TurnCase {
  const flop = flopStr.map(toCard)
  const rows: TurnRow[] = []
  for (const [turnStr, label] of turns) {
    const turn = toCard(turnStr)
    const board = [...flop, turn]
    const dead = new Set(board)
    const co = rangeCombos(RFI_6MAX.ranges.CO, dead)
    const bb = rangeCombos(BB_CALL_VS_CO.notation, dead)
    const strongPct = (cs: [Card, Card][]) =>
      (cs.filter((h) => isStrong(h, board)).length / cs.length) * 100

    const deck: Card[] = []
    for (let c = 0; c < 52; c++) if (!dead.has(c)) deck.push(c)
    let win = 0
    let tie = 0
    let n = 0
    while (n < N) {
      const a = co[(Math.random() * co.length) | 0]!
      const b = bb[(Math.random() * bb.length) | 0]!
      if (a[0] === b[0] || a[0] === b[1] || a[1] === b[0] || a[1] === b[1]) continue
      const used = new Set([...board, ...a, ...b])
      let r: Card
      do r = deck[(Math.random() * deck.length) | 0]!
      while (used.has(r))
      const full = [...board, r]
      const sa = evaluate([...a, ...full])
      const sb = evaluate([...b, ...full])
      if (sa > sb) win++
      else if (sa === sb) tie++
      n++
    }
    rows.push({
      turn: turnStr,
      label,
      coEq: +(((win + tie / 2) / n) * 100).toFixed(1),
      coStrong: +strongPct(co).toFixed(1),
      bbStrong: +strongPct(bb).toFixed(1),
    })
  }
  return { flop: flopStr, rows }
}

// ---------------------------------------------------------------- 阻断牌分析

interface BlockerRow {
  hero: string[]
  desc: string
  /** 对手范围里符合条件的组合数 */
  combos: number
}

interface BlockerCase {
  board: string[]
  /** 统计的是对手范围里的什么牌 */
  target: string
  baseline: number
  rows: BlockerRow[]
}

function analyzeBlockers(
  boardStr: string[],
  target: string,
  match: (hole: [Card, Card], board: Card[]) => boolean,
  heroes: [string[], string][],
): BlockerCase {
  const board = boardStr.map(toCard)
  const count = (extraDead: Card[]) => {
    const dead = new Set([...board, ...extraDead])
    return rangeCombos(BB_CALL_VS_CO.notation, dead).filter((h) => match(h, board)).length
  }
  return {
    board: boardStr,
    target,
    baseline: count([]),
    rows: heroes.map(([hero, desc]) => ({
      hero,
      desc,
      combos: count(hero.map(toCard)),
    })),
  }
}

// ---------------------------------------------------------------- 运行

console.log('转牌分析（CO 开池范围 vs BB 跟注范围，未按翻后行动收窄）\n')

const turnCases = [
  analyzeTurn(
    ['K♠', '7♦', '2♣'],
    [
      ['A♥', 'A —— 高于顶张的高张'],
      ['K♥', 'K —— 配对顶张'],
      ['7♥', '7 —— 配对中张'],
      ['Q♥', 'Q —— 中高张'],
      ['8♥', '8 —— 空牌'],
      ['3♥', '3 —— 空牌'],
      ['5♠', '5 —— 带来同花听牌'],
    ],
  ),
  analyzeTurn(
    ['J♠', 'T♠', '9♦'],
    [
      ['A♥', 'A —— 高张'],
      ['Q♥', 'Q —— 完成顺子'],
      ['8♥', '8 —— 完成顺子'],
      ['2♠', '2 —— 完成同花'],
      ['4♥', '4 —— 空牌'],
    ],
  ),
]

for (const c of turnCases) {
  console.log(`翻牌 ${c.flop.join(' ')}`)
  for (const r of c.rows) {
    console.log(
      `  ${r.turn}  ${r.label.padEnd(22)} CO胜率 ${r.coEq.toFixed(1)}%  两对+ CO ${r.coStrong.toFixed(1)}% / BB ${r.bbStrong.toFixed(1)}%`,
    )
  }
  console.log()
}

console.log('阻断牌分析（对手 = BB 跟注范围）\n')

const isFlush = (hole: [Card, Card], board: Card[]) => {
  const all = [...hole, ...board]
  const sc = new Array(4).fill(0)
  for (const c of all) sc[c & 3]++
  return sc.some((n) => n >= 5)
}
const isNutFlush = (hole: [Card, Card], board: Card[]) => {
  if (!isFlush(hole, board)) return false
  const sc = new Array(4).fill(0)
  for (const c of [...hole, ...board]) sc[c & 3]++
  const fs = sc.findIndex((n) => n >= 5)
  // 坚果同花 = 持有该花色的 A（牌面上没有 A 的情况下）
  return hole.some((c) => (c & 3) === fs && c >> 2 === 12)
}

const blockerCases = [
  analyzeBlockers(
    ['Q♠', '8♠', '3♠', 'J♥', '2♦'],
    '已成同花的组合',
    isFlush,
    [
      [['A♠', 'K♦'], '持有 A♠'],
      [['K♠', 'Q♦'], '持有 K♠'],
      [['A♥', 'K♦'], '持有 A♥（不阻断黑桃）'],
    ],
  ),
  analyzeBlockers(
    ['Q♠', '8♠', '3♠', 'J♥', '2♦'],
    '坚果同花的组合',
    isNutFlush,
    [
      [['A♠', 'K♦'], '持有 A♠'],
      [['A♥', 'K♦'], '持有 A♥'],
    ],
  ),
  analyzeBlockers(
    ['A♠', 'K♦', '7♣', '4♥', '2♠'],
    '两对及以上的组合',
    (h, b) => isStrong(h, b),
    [
      [['A♥', 'Q♦'], '持有一张 A'],
      [['K♥', 'Q♦'], '持有一张 K'],
      [['Q♥', 'J♦'], '两张都不阻断'],
    ],
  ),
]

for (const c of blockerCases) {
  console.log(`牌面 ${c.board.join(' ')} —— ${c.target}：基准 ${c.baseline} 个组合`)
  for (const r of c.rows) {
    const pct = c.baseline ? ((1 - r.combos / c.baseline) * 100).toFixed(0) : '0'
    console.log(`  ${r.desc.padEnd(24)} ${r.combos} 个组合（减少 ${pct}%）`)
  }
  console.log()
}

const out = `/**
 * 自动生成，请勿手改。来源：scripts/precompute-postflop.ts
 *
 * 双方范围为翻前范围（CO 开池 / BB 跟注），未按翻后行动收窄。
 * 绝对数值因此偏保守，但「转牌把范围推向哪个方向」的结论不受影响。
 */

export interface TurnRow {
  turn: string
  label: string
  /** CO 的胜率（%） */
  coEq: number
  /** 两对及以上的组合占比（%） */
  coStrong: number
  bbStrong: number
}

export interface TurnCase {
  flop: string[]
  rows: TurnRow[]
}

export interface BlockerRow {
  hero: string[]
  desc: string
  combos: number
}

export interface BlockerCase {
  board: string[]
  target: string
  baseline: number
  rows: BlockerRow[]
}

export const TURNS: TurnCase[] = ${JSON.stringify(turnCases, null, 2)}

export const BLOCKERS: BlockerCase[] = ${JSON.stringify(blockerCases, null, 2)}
`
writeFileSync(new URL('../src/data/postflop.ts', import.meta.url), out)
console.log('已写入 src/data/postflop.ts')
