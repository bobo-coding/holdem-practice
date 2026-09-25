/**
 * 离线预计算：单挑（SB vs BB）Push/Fold 纳什均衡表。
 *
 * 产出 src/data/pushfold.ts，供 L7 课程正文和 Push/Fold 训练使用。
 * 运行：pnpm tsx scripts/precompute-pushfold.ts（约 1–2 分钟）
 *
 * 两步：
 *   1. 169×169 起手牌胜率矩阵（蒙特卡洛），以及每对起手牌之间不冲突的具体组合数（精确）
 *   2. 对每个筹码深度，用虚拟对弈（fictitious play）迭代求 SB 全下 / BB 跟注的均衡
 *
 * 模型：SB 只能全下或弃牌，BB 只能跟注或弃牌。盲注 0.5/1。
 * 「有 ante」版本按 BB ante 计：底池里多 1bb 死钱，由 BB 支付。
 */
import { gridCodes, type HandCode } from '../src/lib/range.ts'
import { writeFileSync } from 'node:fs'

// ---------------------------------------------------------------- 快速 7 张牌评估

type Card = number // 0..51，r = c>>2（0=2 … 12=A），s = c&3

const popcount = (x: number) => {
  let n = 0
  while (x) {
    x &= x - 1
    n++
  }
  return n
}

/** STRAIGHT[mask]：该点数集合里最高顺子的顶张，无顺子为 -1 */
const STRAIGHT = new Int8Array(8192).fill(-1)
/** TOP5[mask]：取最高 5 个点数打包成可比较的数 */
const TOP5 = new Int32Array(8192)
for (let m = 0; m < 8192; m++) {
  for (let hi = 12; hi >= 4; hi--) {
    const need = 0b11111 << (hi - 4)
    if ((m & need) === need) {
      STRAIGHT[m] = hi
      break
    }
  }
  if (STRAIGHT[m] === -1 && (m & 0b1000000001111) === 0b1000000001111) STRAIGHT[m] = 3
  let v = 0
  let k = 0
  for (let r = 12; r >= 0 && k < 5; r--) {
    if (m & (1 << r)) {
      v = v * 13 + r
      k++
    }
  }
  while (k < 5) {
    v *= 13
    k++
  }
  TOP5[m] = v
}

const rc = new Int8Array(13)
const sm = new Int32Array(4)

/** 与 precompute-flops.ts 的 evaluate 同序：类别 × 1e7 + 踢脚 */
function eval7(cards: Card[]): number {
  rc.fill(0)
  sm.fill(0)
  let all = 0
  for (let i = 0; i < 7; i++) {
    const c = cards[i]!
    const r = c >> 2
    rc[r]++
    sm[c & 3] |= 1 << r
    all |= 1 << r
  }
  for (let s = 0; s < 4; s++) {
    if (popcount(sm[s]!) >= 5) {
      const sf = STRAIGHT[sm[s]!]!
      if (sf >= 0) return 8e7 + sf
      // 同花：7 张里最多一个花色能成同花，且此时不可能有四条或葫芦以外的更大牌型
      let quads = false
      let trips = 0
      let pairs = 0
      for (let r = 0; r < 13; r++) {
        if (rc[r] === 4) quads = true
        else if (rc[r] === 3) trips++
        else if (rc[r] === 2) pairs++
      }
      if (!quads && !(trips && (trips > 1 || pairs))) return 5e7 + TOP5[sm[s]!]!
    }
  }
  let q = -1
  let t1 = -1
  let t2 = -1
  let p1 = -1
  let p2 = -1
  for (let r = 12; r >= 0; r--) {
    const n = rc[r]!
    if (n === 4) q = r
    else if (n === 3) {
      if (t1 < 0) t1 = r
      else if (t2 < 0) t2 = r
    } else if (n === 2) {
      if (p1 < 0) p1 = r
      else if (p2 < 0) p2 = r
    }
  }
  if (q >= 0) {
    let k = -1
    for (let r = 12; r >= 0; r--) if (r !== q && rc[r]! > 0) { k = r; break }
    return 7e7 + q * 13 + k
  }
  if (t1 >= 0 && (t2 >= 0 || p1 >= 0)) return 6e7 + t1 * 13 + Math.max(t2, p1)
  for (let s = 0; s < 4; s++) if (popcount(sm[s]!) >= 5) return 5e7 + TOP5[sm[s]!]!
  const st = STRAIGHT[all]!
  if (st >= 0) return 4e7 + st
  if (t1 >= 0) return 3e7 + t1 * 169 + (TOP5[all & ~(1 << t1)]! / 2197 | 0)
  if (p1 >= 0 && p2 >= 0) {
    const rest = all & ~(1 << p1) & ~(1 << p2)
    let k = -1
    for (let r = 12; r >= 0; r--) if (rest & (1 << r)) { k = r; break }
    return 2e7 + p1 * 169 + p2 * 13 + k
  }
  if (p1 >= 0) return 1e7 + p1 * 2197 + (TOP5[all & ~(1 << p1)]! / 169 | 0)
  return TOP5[all]!
}

// 自检：几手已知牌型的相对大小
{
  const RV: Record<string, number> = {}
  'AKQJT98765432'.split('').forEach((r, i) => (RV[r] = 12 - i))
  const S = 'shdc'
  const cs = (s: string) => s.split(' ').map((x) => RV[x[0]!]! * 4 + S.indexOf(x[1]!))
  const order = [
    'Ah Kh Qh Jh Th 2c 3d', // 同花顺
    'Ah Ad Ac As Kh 2c 3d', // 四条
    'Ah Ad Ac Ks Kh 2c 3d', // 葫芦
    'Ah 9h 7h 4h 2h Kc Kd', // 同花
    'Ah Kd Qc Js Th 2c 2d', // 顺子
    '5h 4d 3c 2s Ah Kc Kd', // 轮子顺
    'Ah Ad Ac 9s 8h 2c 3d', // 三条
    'Ah Ad Kc Ks 8h 2c 3d', // 两对
    'Ah Ad Kc Qs 8h 2c 3d', // 一对
    'Ah Qd Tc 8s 6h 4c 2d', // 高牌
  ]
  for (let i = 1; i < order.length; i++) {
    if (!(eval7(cs(order[i - 1]!)) > eval7(cs(order[i]!))))
      throw new Error(`评估器自检失败：${order[i - 1]} 应大于 ${order[i]}`)
  }
  if (eval7(cs('Ah Ad Kc Qs 8h 2c 3d')) <= eval7(cs('Ah Ad Kc Js 8h 2c 3d')))
    throw new Error('评估器自检失败：踢脚')
  if (eval7(cs('As Ks Qs Js 9s 2c 3d')) !== eval7(cs('As Ks Qs Js 9s 2h 3h')))
    throw new Error('评估器自检失败：同花平分')
}

// ---------------------------------------------------------------- 起手牌

const RV: Record<string, number> = {}
'AKQJT98765432'.split('').forEach((r, i) => (RV[r] = 12 - i))

function combosOf(code: HandCode): [Card, Card][] {
  const out: [Card, Card][] = []
  const r1 = RV[code[0]!]!
  const r2 = RV[code[1]!]!
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

const CODES = gridCodes().flat()
const H = CODES.length
const COMBOS = CODES.map(combosOf)

// ---------------------------------------------------------------- 胜率矩阵

const TRIALS = 25000
const EQ = new Float64Array(H * H)
const W = new Float64Array(H * H)

const t0 = Date.now()
const board = new Array<Card>(5)
const a7 = new Array<Card>(7)
const b7 = new Array<Card>(7)
const used = new Uint8Array(52)

for (let i = 0; i < H; i++) {
  for (let j = i; j < H; j++) {
    const pairs: [Card, Card, Card, Card][] = []
    for (const a of COMBOS[i]!)
      for (const b of COMBOS[j]!)
        if (a[0] !== b[0] && a[0] !== b[1] && a[1] !== b[0] && a[1] !== b[1])
          pairs.push([a[0], a[1], b[0], b[1]])
    W[i * H + j] = W[j * H + i] = pairs.length
    let score = 0
    for (let n = 0; n < TRIALS; n++) {
      const p = pairs[n % pairs.length]!
      used.fill(0)
      used[p[0]] = used[p[1]] = used[p[2]] = used[p[3]] = 1
      for (let k = 0; k < 5; k++) {
        let c: Card
        do c = (Math.random() * 52) | 0
        while (used[c])
        used[c] = 1
        board[k] = c
      }
      a7[0] = p[0]; a7[1] = p[1]
      b7[0] = p[2]; b7[1] = p[3]
      for (let k = 0; k < 5; k++) a7[k + 2] = b7[k + 2] = board[k]!
      const sa = eval7(a7)
      const sb = eval7(b7)
      score += sa > sb ? 1 : sa === sb ? 0.5 : 0
    }
    EQ[i * H + j] = score / TRIALS
    EQ[j * H + i] = 1 - score / TRIALS
  }
  if (i % 20 === 0) console.log(`胜率矩阵 ${i}/${H}  ${((Date.now() - t0) / 1000).toFixed(0)}s`)
}

const eqOf = (a: string, b: string) => EQ[CODES.indexOf(a) * H + CODES.indexOf(b)]!
// 参照值：同一评估器 100 万次蒙特卡洛；AA vs KK 与公开数据一致
for (const [a, b, want] of [
  ['AA', 'KK', 81.9],
  ['AKo', 'QQ', 43.2],
  ['AKs', 'QQ', 46.1],
  ['AKo', '22', 47.4],
  ['JTs', 'AKo', 40.5],
] as const) {
  const got = eqOf(a, b) * 100
  console.log(`抽查 ${a} vs ${b}：${got.toFixed(1)}%（参照 ${want}%）`)
  if (Math.abs(got - want) > 1.5) throw new Error(`胜率矩阵偏差过大：${a} vs ${b}`)
}

// ---------------------------------------------------------------- 纳什求解

/**
 * S：有效筹码（含盲注），d：底池死钱（BB ante）。
 * 返回 SB 全下频率与 BB 跟注频率（逐手，0..1）。
 */
function solve(S: number, d: number): { push: Float64Array; call: Float64Array } {
  const push = new Float64Array(H).fill(1)
  const call = new Float64Array(H).fill(1)
  const ITER = 1000
  for (let k = 1; k <= ITER; k++) {
    // BB 对当前平均全下范围的最优反应
    const brCall = new Float64Array(H)
    for (let j = 0; j < H; j++) {
      let num = 0
      let den = 0
      for (let i = 0; i < H; i++) {
        const w = W[i * H + j]! * push[i]!
        if (!w) continue
        num += w * ((2 * S + d) * (1 - EQ[i * H + j]!) - S - d)
        den += w
      }
      brCall[j] = den > 0 && num / den > -1 - d ? 1 : 0
    }
    for (let j = 0; j < H; j++) call[j]! += (brCall[j]! - call[j]!) / (k + 1)

    // SB 对当前平均跟注范围的最优反应
    const brPush = new Float64Array(H)
    for (let i = 0; i < H; i++) {
      let num = 0
      let den = 0
      for (let j = 0; j < H; j++) {
        const w = W[i * H + j]!
        const c = call[j]!
        num += w * (c * ((2 * S + d) * EQ[i * H + j]! - S) + (1 - c) * (1 + d))
        den += w
      }
      brPush[i] = num / den > -0.5 ? 1 : 0
    }
    for (let i = 0; i < H; i++) push[i]! += (brPush[i]! - push[i]!) / (k + 1)
  }
  return { push, call }
}

const pct = (f: Float64Array) => {
  let n = 0
  for (let i = 0; i < H; i++) n += (f[i]! >= 0.5 ? 1 : 0) * COMBOS[i]!.length
  return (n / 1326) * 100
}

const STACKS: number[] = []
for (let s = 1; s <= 20; s += 0.5) STACKS.push(s)

interface Variant {
  id: string
  name: string
  d: number
  push: Record<string, number>
  call: Record<string, number>
  pushPct: number[]
  callPct: number[]
  nonMonotone: string[]
  irregular: string[]
}

function build(id: string, name: string, d: number): Variant {
  const pushAt: boolean[][] = []
  const callAt: boolean[][] = []
  const pushPct: number[] = []
  const callPct: number[] = []
  for (const S of STACKS) {
    const r = solve(S, d)
    pushAt.push(CODES.map((_, i) => r.push[i]! >= 0.5))
    callAt.push(CODES.map((_, i) => r.call[i]! >= 0.5))
    pushPct.push(+pct(r.push).toFixed(1))
    callPct.push(+pct(r.call).toFixed(1))
    console.log(`${id} ${S}bb  SB 全下 ${pct(r.push).toFixed(1)}%  BB 跟注 ${pct(r.call).toFixed(1)}%`)
  }
  const nonMonotone: string[] = []
  const irregular: string[] = []
  // 阈值 = 最大的 S，使得所有 ≤ S 的深度都执行该动作；0 表示 1bb 也不做
  const thresh = (at: boolean[][], role: string) => {
    const out: Record<string, number> = {}
    CODES.forEach((c, i) => {
      let t = 0
      for (let k = 0; k < STACKS.length; k++) {
        if (at[k]![i]) t = STACKS[k]!
        else break
      }
      const later = at.findIndex((row, k) => row[i] && STACKS[k]! > t)
      if (later >= 0) {
        nonMonotone.push(`${role} ${c}：≤${t}bb 执行，${STACKS[later]}bb 又执行`)
        irregular.push(c)
      }
      out[c] = t
    })
    return out
  }
  return {
    id,
    name,
    d,
    push: thresh(pushAt, '全下'),
    call: thresh(callAt, '跟注'),
    pushPct,
    callPct,
    nonMonotone,
    irregular,
  }
}

const variants = [build('hu', '无 ante', 0), build('hu-ante', 'BB ante（1bb 死钱）', 1)]
for (const v of variants) {
  if (v.nonMonotone.length) {
    console.log(`\n${v.id} 非单调（${v.nonMonotone.length} 处，按首个断点截断）：`)
    for (const m of v.nonMonotone.slice(0, 20)) console.log('  ' + m)
  }
}

const out = `/**
 * 自动生成，请勿手改。来源：scripts/precompute-pushfold.ts
 *
 * 单挑 Push/Fold 纳什均衡：SB 只能全下或弃牌，BB 只能跟注或弃牌，盲注 0.5/1。
 * 起手牌胜率为每对 ${TRIALS.toLocaleString()} 次蒙特卡洛（单对标准误约 ±0.3%），
 * 组合冲突（blocker）按具体组合精确计数。均衡用虚拟对弈迭代 1000 轮求得。
 *
 * push[hand] / call[hand]：该手牌在「有效筹码 ≤ 这个值」时执行动作。
 * 20 表示 20bb 及以上仍执行（表只算到 20bb）；0 表示 1bb 也不执行。
 * 筹码深度网格为 1–20bb、步长 0.5bb。
 */

export interface PushFoldTable {
  id: string
  name: string
  conditions: string
  nature: 'computed'
  caveat: string
  /** 底池死钱（bb） */
  dead: number
  stacks: number[]
  push: Record<string, number>
  call: Record<string, number>
  /** 阈值不单调的手牌（在某个深度弃、更深反而又执行），练习里不出这些题 */
  irregular: string[]
  /** 各深度下 SB 全下 / BB 跟注的组合占比（%） */
  pushPct: number[]
  callPct: number[]
}

export const PUSHFOLD: PushFoldTable[] = ${JSON.stringify(
  variants.map((v) => ({
    id: v.id,
    name: `单挑 Push/Fold 纳什表 · ${v.name}`,
    conditions:
      'SB 对 BB 单挑（前面所有人已弃牌）· 盲注 0.5/1 · ' +
      (v.d ? 'BB 支付 1bb ante' : '无 ante') +
      ' · 筹码 = 有效筹码（含已下的盲注）',
    nature: 'computed',
    caveat:
      '纳什均衡假设对手也按均衡打。它是「不会被剥削」的下限，不是对任何对手都最优。桌上还有其他人时（UTG、CO 全下）范围要紧得多；锦标赛有 ICM 压力时跟注范围也要收紧。',
    dead: v.d,
    stacks: STACKS,
    push: v.push,
    call: v.call,
    irregular: v.irregular,
    pushPct: v.pushPct,
    callPct: v.callPct,
  })),
  null,
  1,
)}
`
writeFileSync(new URL('../src/data/pushfold.ts', import.meta.url), out)
console.log(`\n已写入 src/data/pushfold.ts  总耗时 ${((Date.now() - t0) / 1000).toFixed(0)}s`)
