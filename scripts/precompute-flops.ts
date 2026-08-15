/**
 * 离线预计算：一组代表性翻牌上，CO 开池范围 vs BB 跟注范围的对抗数据。
 *
 * 产出 src/data/flops.ts，供 L3 课程正文和 Board Texture 练习使用。
 * 运行：node --experimental-strip-types scripts/precompute-flops.ts
 *
 * 为什么要离线算：范围对范围的胜率无法在手机上实时算（组合数太大），
 * 但把数字写死在课程里又必须保证它是真算出来的 —— 所以固定一组牌面预计算。
 */
import { parseRange, type HandCode } from '../src/lib/range.ts'
import { RFI_6MAX, BB_CALL_VS_CO } from '../src/data/ranges.ts'
import { writeFileSync } from 'node:fs'

// ---------------------------------------------------------------- 牌力评估

type Card = number // 0..51，r = c>>2（0=2 … 12=A），s = c&3

function straightHigh(rs: number[]): number {
  const s = new Set(rs)
  for (let hi = 12; hi >= 4; hi--) {
    if (s.has(hi) && s.has(hi - 1) && s.has(hi - 2) && s.has(hi - 3) && s.has(hi - 4)) return hi
  }
  if (s.has(12) && s.has(0) && s.has(1) && s.has(2) && s.has(3)) return 3 // 轮子
  return -1
}

/** 返回可比较的牌力分数；同花顺 > 四条 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 一对 > 高牌 */
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

// ---------------------------------------------------------------- 牌面表示

const RANKS = 'AKQJT98765432'
const RANK_VAL: Record<string, number> = {}
RANKS.split('').forEach((r, i) => (RANK_VAL[r] = 12 - i))
const SUITS = ['♠', '♥', '♦', '♣']

const toCard = (s: string): Card => RANK_VAL[s[0]!]! * 4 + SUITS.indexOf(s.slice(1))

/** 把 169 个代号展开成具体的两张牌组合 */
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
    for (const c of combosOf(code)) {
      if (!dead.has(c[0]) && !dead.has(c[1])) out.push(c)
    }
  }
  return out
}

// ---------------------------------------------------------------- 成牌分类

/** 翻牌圈的成牌档位 */
function madeClass(hole: [Card, Card], board: Card[]): 'strong' | 'topPair' | 'weakPair' | 'air' {
  const score = evaluate([...hole, ...board])
  const cat = Math.floor(score / 1e10)
  if (cat >= 2) return 'strong' // 两对及以上
  const boardRanks = board.map((c) => c >> 2)
  const topBoard = Math.max(...boardRanks)
  const h1 = hole[0] >> 2
  const h2 = hole[1] >> 2
  if (cat === 1) {
    // 一对：区分超对 / 顶对 / 其他
    if (h1 === h2) return h1 > topBoard ? 'topPair' : 'weakPair'
    const paired = boardRanks.includes(h1) ? h1 : boardRanks.includes(h2) ? h2 : -1
    return paired === topBoard ? 'topPair' : 'weakPair'
  }
  return 'air'
}

// ---------------------------------------------------------------- 牌面清单

const FLOPS: [string, string[]][] = [
  ['干燥高张', ['K♠', '7♦', '2♣']],
  ['干燥高张', ['A♠', '8♦', '3♣']],
  ['干燥高张', ['Q♠', '6♦', '2♣']],
  ['干燥中低', ['9♠', '5♦', '2♣']],
  ['干燥低张', ['7♠', '4♦', '2♣']],
  ['配对面', ['K♠', 'K♦', '7♣']],
  ['配对面', ['7♠', '7♦', '2♣']],
  ['配对面', ['J♠', 'J♦', '4♣']],
  ['配对面', ['2♠', '2♦', '9♣']],
  ['双色连接', ['J♠', 'T♠', '9♦']],
  ['双色连接', ['9♠', '8♠', '6♦']],
  ['双色连接', ['7♠', '6♠', '5♦']],
  ['双色干燥', ['A♠', '9♠', '4♦']],
  ['双色干燥', ['K♠', '8♠', '3♦']],
  ['单色', ['J♠', '8♠', '3♠']],
  ['单色', ['A♠', 'Q♠', '5♠']],
  ['单色', ['9♠', '6♠', '2♠']],
  ['大牌面', ['A♠', 'K♦', 'Q♣']],
  ['大牌面', ['K♠', 'Q♦', 'J♣']],
  ['大牌面', ['A♠', 'J♦', 'T♣']],
  ['中张连接', ['9♠', '8♦', '7♣']],
  ['中张连接', ['T♠', '9♦', '8♣']],
  ['低张连接', ['6♠', '5♦', '4♣']],
  ['低张连接', ['5♠', '4♦', '3♣']],
]

// ---------------------------------------------------------------- 计算

const N = 300000

interface Result {
  board: string[]
  group: string
  /** CO 的胜率（含平分的一半） */
  coEq: number
  /** 两对及以上的组合占比 */
  coStrong: number
  bbStrong: number
  /** 顶对 / 超对及以上的组合占比 */
  coTop: number
  bbTop: number
}

function analyze(group: string, boardStr: string[]): Result {
  const board = boardStr.map(toCard)
  const dead = new Set(board)
  const co = rangeCombos(
    // CO 开池后被 BB 跟注，CO 的范围就是它的开池范围
    RFI_6MAX.ranges.CO,
    dead,
  )
  const bb = rangeCombos(BB_CALL_VS_CO.notation, dead)

  // 成牌分布：遍历全部组合，精确
  const dist = (combos: [Card, Card][]) => {
    let strong = 0
    let top = 0
    for (const h of combos) {
      const c = madeClass(h, board)
      if (c === 'strong') strong++
      if (c === 'strong' || c === 'topPair') top++
    }
    return { strong: (strong / combos.length) * 100, top: (top / combos.length) * 100 }
  }
  const dCo = dist(co)
  const dBb = dist(bb)

  // 胜率：蒙特卡洛（组合对 × 转河，全枚举过大）
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
    let t: Card, r: Card
    do t = deck[(Math.random() * deck.length) | 0]!
    while (used.has(t))
    used.add(t)
    do r = deck[(Math.random() * deck.length) | 0]!
    while (used.has(r))
    const full = [...board, t, r]
    const sa = evaluate([...a, ...full])
    const sb = evaluate([...b, ...full])
    if (sa > sb) win++
    else if (sa === sb) tie++
    n++
  }

  return {
    board: boardStr,
    group,
    coEq: ((win + tie / 2) / n) * 100,
    coStrong: dCo.strong,
    bbStrong: dBb.strong,
    coTop: dCo.top,
    bbTop: dBb.top,
  }
}

const results: Result[] = []
for (const [group, board] of FLOPS) {
  const r = analyze(group, board)
  results.push(r)
  console.log(
    `${group.padEnd(6)} ${board.join(' ').padEnd(12)} CO胜率 ${r.coEq.toFixed(1)}%  ` +
      `两对+ CO ${r.coStrong.toFixed(1)}% / BB ${r.bbStrong.toFixed(1)}%  ` +
      `顶对+ CO ${r.coTop.toFixed(1)}% / BB ${r.bbTop.toFixed(1)}%`,
  )
}

const out = `/**
 * 自动生成，请勿手改。来源：scripts/precompute-flops.ts
 *
 * CO 开池范围（${RFI_6MAX.id}）对 BB 跟注范围（${BB_CALL_VS_CO.id}）在各翻牌上的对抗数据。
 * 胜率为 ${N.toLocaleString()} 次蒙特卡洛（含平分的一半），成牌分布为全组合精确统计。
 */

export interface FlopData {
  board: string[]
  group: string
  /** CO 的胜率（%），BB 的等于 100 减去它 */
  coEq: number
  /** 两对及以上的组合占比（%） */
  coStrong: number
  bbStrong: number
  /** 顶对 / 超对及以上的组合占比（%） */
  coTop: number
  bbTop: number
}

export const FLOPS: FlopData[] = ${JSON.stringify(
  results.map((r) => ({
    board: r.board,
    group: r.group,
    coEq: +r.coEq.toFixed(1),
    coStrong: +r.coStrong.toFixed(1),
    bbStrong: +r.bbStrong.toFixed(1),
    coTop: +r.coTop.toFixed(1),
    bbTop: +r.bbTop.toFixed(1),
  })),
  null,
  2,
)}
`
writeFileSync(new URL('../src/data/flops.ts', import.meta.url), out)
console.log('\n已写入 src/data/flops.ts')
