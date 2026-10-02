/**
 * 离线预计算：一个完整求解的河牌局面，供 L6 GTO 与剥削课程使用。
 *
 * 产出 src/data/river.ts。运行：pnpm tsx scripts/precompute-river.ts（几秒）
 *
 * 局面：CO 开池、BB 跟注，CO 翻牌、转牌连续下注，BB 两次跟注。
 *   公牌 K♦ 8♣ 4♠ 7♥ 2♣，底池 20bb，有效筹码 80bb，BB 过牌。
 *   CO 可以过牌，或下注 10 / 20 / 40bb（1/2、1 倍、2 倍池）；BB 只能跟注或弃牌。
 *
 * 双方的河牌范围是课程设定的示意范围（见 RANGES），不是从翻前逐街求解得到的；
 * 但在这两个范围之下，均衡是用 CFR+ 精确迭代求出的，可剥削度会一并输出。
 * 算法没有随机性，重复运行结果完全一致。
 */
import { parseRange } from '../src/lib/range.ts'
import { eval7, combosOf, type Card } from './poker.ts'
import { writeFileSync } from 'node:fs'

// ---------------------------------------------------------------- 局面

const RV: Record<string, number> = {}
'AKQJT98765432'.split('').forEach((r, i) => (RV[r] = 12 - i))
const SUITS = ['♠', '♥', '♦', '♣']
const toCard = (s: string): Card => RV[s[0]!]! * 4 + SUITS.indexOf(s.slice(1))
const cardStr = (c: Card) => 'AKQJT98765432'[12 - (c >> 2)]! + SUITS[c & 3]

const BOARD_STR = ['K♦', '8♣', '4♠', '7♥', '2♣']
const BOARD = BOARD_STR.map(toCard)
const POT = 20
const STACK = 80
const SIZES = [10, 20, 40]

const RANGES = {
  /** CO 两次下注后的河牌范围：价值牌 + 没中的听牌和高张 */
  co: 'AA, KK, 88, 77, 44, AKs, AKo, KQs, KQo, KJs, KTs, K8s, 87s, 65s, T9s, J9s, JTs, QJs, QTs, AQs, AJs, ATs, 54s',
  /** BB 两次跟注后的河牌范围：以抓诈唬牌为主，少量强牌，少量没中的听牌 */
  bb: 'K9s, K7s-K2s, K9o, K7o, A8s, Q8s, J8s, T8s, 98s, 86s, 76s, 75s, 65s, 98o, 87o, 76o, 44, 77, 22, T9s, T9o, 96s',
}

const dead = new Set(BOARD)
function combos(notation: string): { code: string; cards: [Card, Card] }[] {
  const out: { code: string; cards: [Card, Card] }[] = []
  for (const code of parseRange(notation))
    for (const c of combosOf(code)) if (!dead.has(c[0]) && !dead.has(c[1])) out.push({ code, cards: c })
  return out
}

const IP = combos(RANGES.co)
const OOP = combos(RANGES.bb)
const NI = IP.length
const NO = OOP.length

// 摊牌结果矩阵：S[i][j] = IP 赢 1 / 平 0.5 / 输 0；W[i][j] = 两手牌是否冲突（0/1）
const S = new Float64Array(NI * NO)
const W = new Float64Array(NI * NO)
{
  const ipScore = IP.map((h) => eval7([...h.cards, ...BOARD]))
  const oopScore = OOP.map((h) => eval7([...h.cards, ...BOARD]))
  for (let i = 0; i < NI; i++)
    for (let j = 0; j < NO; j++) {
      const a = IP[i]!.cards
      const b = OOP[j]!.cards
      if (a[0] === b[0] || a[0] === b[1] || a[1] === b[0] || a[1] === b[1]) continue
      W[i * NO + j] = 1
      S[i * NO + j] = ipScore[i]! > oopScore[j]! ? 1 : ipScore[i]! === oopScore[j]! ? 0.5 : 0
    }
}

// ---------------------------------------------------------------- 博弈

/** IP 动作：0 = 过牌，1.. = SIZES[k-1] */
type Strat = { ip: Float64Array; oop: Float64Array } // ip[i*A+a]，oop[j*K+k] = 跟注概率

const A = SIZES.length + 1
const K = SIZES.length

/** IP 手牌 i 采取动作 a、对 OOP 策略 call 时的期望（IP 视角，单位 bb，以河牌开始时为 0 点，赢得底池记 +POT 份额） */
function ipActionValues(oop: Float64Array, sizes: number[] = SIZES): Float64Array {
  const v = new Float64Array(NI * A)
  for (let i = 0; i < NI; i++) {
    let wsum = 0
    const acc = new Float64Array(A)
    for (let j = 0; j < NO; j++) {
      const w = W[i * NO + j]!
      if (!w) continue
      wsum += w
      const s = S[i * NO + j]!
      acc[0]! += POT * s
      for (let k = 0; k < K; k++) {
        const b = sizes[k]!
        const c = oop[j * K + k]!
        acc[k + 1]! += c * ((POT + 2 * b) * s - b) + (1 - c) * POT
      }
    }
    for (let a = 0; a < A; a++) v[i * A + a] = acc[a]! / wsum
  }
  return v
}

/** OOP 手牌 j 面对尺度 k 时，跟注相对弃牌的收益（OOP 视角），按 IP 下注到达概率加权 */
function oopCallGain(ip: Float64Array, sizes: number[] = SIZES): { gain: Float64Array; reach: Float64Array } {
  const gain = new Float64Array(NO * K)
  const reach = new Float64Array(NO * K)
  for (let j = 0; j < NO; j++) {
    for (let k = 0; k < K; k++) {
      const b = sizes[k]!
      let g = 0
      let r = 0
      for (let i = 0; i < NI; i++) {
        const w = W[i * NO + j]!
        if (!w) continue
        const p = ip[i * A + k + 1]!
        if (!p) continue
        // 跟注：OOP 拿到 (POT+2b)(1−s) − b；弃牌：0
        g += w * p * ((POT + 2 * b) * (1 - S[i * NO + j]!) - b)
        r += w * p
      }
      gain[j * K + k] = g
      reach[j * K + k] = r
    }
  }
  return { gain, reach }
}

/** CFR+ 求解。allowed[a] 为 false 的动作被禁用（用于「只用一种尺度」的简化）；lockOop 给定时 OOP 不更新 */
function solve(opts: { allowed?: boolean[]; lockOop?: Float64Array; iters?: number } = {}): Strat {
  const allowed = opts.allowed ?? new Array(A).fill(true)
  const iters = opts.iters ?? 4000
  const rIp = new Float64Array(NI * A)
  const rOop = new Float64Array(NO * K * 2)
  const sumIp = new Float64Array(NI * A)
  const sumOop = new Float64Array(NO * K)
  const cur: Strat = { ip: new Float64Array(NI * A), oop: new Float64Array(NO * K).fill(0.5) }
  if (opts.lockOop) cur.oop.set(opts.lockOop)

  const matchIp = () => {
    for (let i = 0; i < NI; i++) {
      let tot = 0
      for (let a = 0; a < A; a++) if (allowed[a]) tot += Math.max(rIp[i * A + a]!, 0)
      for (let a = 0; a < A; a++)
        cur.ip[i * A + a] = !allowed[a] ? 0 : tot > 0 ? Math.max(rIp[i * A + a]!, 0) / tot : 1 / allowed.filter(Boolean).length
    }
  }
  const matchOop = () => {
    if (opts.lockOop) return
    for (let x = 0; x < NO * K; x++) {
      const c = Math.max(rOop[x * 2]!, 0)
      const f = Math.max(rOop[x * 2 + 1]!, 0)
      cur.oop[x] = c + f > 0 ? c / (c + f) : 0.5
    }
  }

  matchIp()
  for (let t = 1; t <= iters; t++) {
    // IP 更新
    const v = ipActionValues(cur.oop)
    for (let i = 0; i < NI; i++) {
      let ev = 0
      for (let a = 0; a < A; a++) ev += cur.ip[i * A + a]! * v[i * A + a]!
      for (let a = 0; a < A; a++) if (allowed[a]) rIp[i * A + a] = Math.max(rIp[i * A + a]! + v[i * A + a]! - ev, 0)
    }
    matchIp()
    for (let x = 0; x < NI * A; x++) sumIp[x]! += t * cur.ip[x]!

    // OOP 更新（交替更新，用 IP 的最新策略）
    if (!opts.lockOop) {
      const { gain } = oopCallGain(cur.ip)
      for (let x = 0; x < NO * K; x++) {
        const c = cur.oop[x]!
        const g = gain[x]!
        // 跟注收益 g，弃牌收益 0，当前期望 c·g
        rOop[x * 2] = Math.max(rOop[x * 2]! + g - c * g, 0)
        rOop[x * 2 + 1] = Math.max(rOop[x * 2 + 1]! - c * g, 0)
      }
      matchOop()
      for (let x = 0; x < NO * K; x++) sumOop[x]! += t * cur.oop[x]!
    }
  }

  const ip = new Float64Array(NI * A)
  for (let i = 0; i < NI; i++) {
    let tot = 0
    for (let a = 0; a < A; a++) tot += sumIp[i * A + a]!
    for (let a = 0; a < A; a++) ip[i * A + a] = sumIp[i * A + a]! / tot
  }
  let oop: Float64Array
  if (opts.lockOop) oop = opts.lockOop
  else {
    oop = new Float64Array(NO * K)
    const norm = (iters * (iters + 1)) / 2
    for (let x = 0; x < NO * K; x++) oop[x] = sumOop[x]! / norm
  }
  return { ip, oop }
}

// ---------------------------------------------------------------- 评估

/** 每手 IP 组合不冲突的 OOP 组合数：整体 EV 必须按「组合对」加权，双方的目标函数才一致 */
const WI = Array.from({ length: NI }, (_, i) => {
  let w = 0
  for (let j = 0; j < NO; j++) w += W[i * NO + j]!
  return w
})
const WTOT = WI.reduce((a, b) => a + b, 0)

/** IP 整体 EV：对所有不冲突的（IP 组合, OOP 组合）对平均 */
function ipEV(st: Strat): number {
  const v = ipActionValues(st.oop)
  let tot = 0
  for (let i = 0; i < NI; i++) {
    let ev = 0
    for (let a = 0; a < A; a++) ev += st.ip[i * A + a]! * v[i * A + a]!
    tot += WI[i]! * ev
  }
  return tot / WTOT
}

/** IP 对固定 OOP 策略的最优反应（纯策略），返回策略与 EV */
function ipBestResponse(oop: Float64Array, allowed = new Array(A).fill(true)): Strat {
  const v = ipActionValues(oop)
  const ip = new Float64Array(NI * A)
  for (let i = 0; i < NI; i++) {
    let best = -1
    for (let a = 0; a < A; a++) if (allowed[a] && (best < 0 || v[i * A + a]! > v[i * A + best]! + 1e-9)) best = a
    ip[i * A + best] = 1
  }
  return { ip, oop }
}

/** OOP 对固定 IP 策略的最优反应 */
function oopBestResponse(ip: Float64Array): Strat {
  const { gain } = oopCallGain(ip)
  const oop = new Float64Array(NO * K)
  for (let x = 0; x < NO * K; x++) oop[x] = gain[x]! > 1e-9 ? 1 : 0
  return { ip, oop }
}

/** 可剥削度：双方各自对对方的最优反应所能多赢的量之和的一半（bb） */
function exploitability(st: Strat): number {
  const v = ipEV(st)
  const brIp = ipEV(ipBestResponse(st.oop))
  const brOop = ipEV(oopBestResponse(st.ip))
  return (brIp - v + (v - brOop)) / 2
}

// ---------------------------------------------------------------- 汇总

/** 每手 IP 组合对 OOP 河牌范围的摊牌胜率 */
const ipShowdown = IP.map((_, i) => {
  let s = 0
  let w = 0
  for (let j = 0; j < NO; j++) {
    s += W[i * NO + j]! * S[i * NO + j]!
    w += W[i * NO + j]!
  }
  return s / w
})
const oopShowdown = OOP.map((_, j) => {
  let s = 0
  let w = 0
  for (let i = 0; i < NI; i++) {
    s += W[i * NO + j]! * (1 - S[i * NO + j]!)
    w += W[i * NO + j]!
  }
  return s / w
})

/** IP 按起手牌代号汇总：组合数、摊牌胜率、各动作频率、EV */
function ipByCode(st: Strat) {
  const v = ipActionValues(st.oop)
  const m = new Map<string, { n: number; eq: number; freq: number[]; ev: number; act: number[] }>()
  IP.forEach((h, i) => {
    const r = m.get(h.code) ?? { n: 0, eq: 0, freq: new Array(A).fill(0), ev: 0, act: new Array(A).fill(0) }
    r.n++
    r.eq += ipShowdown[i]!
    let ev = 0
    for (let a = 0; a < A; a++) {
      r.freq[a] += st.ip[i * A + a]!
      r.act[a] += v[i * A + a]!
      ev += st.ip[i * A + a]! * v[i * A + a]!
    }
    r.ev += ev
    m.set(h.code, r)
  })
  return [...m.entries()]
    .map(([code, r]) => ({
      code,
      combos: r.n,
      showdown: +((r.eq / r.n) * 100).toFixed(1),
      freq: r.freq.map((f) => +((f / r.n) * 100).toFixed(1)),
      ev: +(r.ev / r.n).toFixed(2),
      /** 每个动作单独的 EV：过牌 / 各尺度 */
      actionEV: r.act.map((x) => +(x / r.n).toFixed(2)),
    }))
    .sort((a, b) => b.showdown - a.showdown)
}

/** 整体动作分布、各尺度下注范围里「价值 / 诈唬」的组合占比（价值 = 被跟注时赢超过一半） */
function ipSummary(st: Strat) {
  const total = NI
  const freq = new Array(A).fill(0)
  const bluffShare = new Array(K).fill(0)
  for (let i = 0; i < NI; i++) for (let a = 0; a < A; a++) freq[a] += st.ip[i * A + a]!
  for (let k = 0; k < K; k++) {
    // 以 OOP 跟注范围为准判断价值或诈唬
    let bluff = 0
    let all = 0
    for (let i = 0; i < NI; i++) {
      const p = st.ip[i * A + k + 1]!
      if (p < 1e-6) continue
      let s = 0
      let w = 0
      for (let j = 0; j < NO; j++) {
        const c = W[i * NO + j]! * st.oop[j * K + k]!
        s += c * S[i * NO + j]!
        w += c
      }
      if (w > 0 && s / w < 0.5) bluff += p
      all += p
    }
    bluffShare[k] = all > 0 ? +((bluff / all) * 100).toFixed(1) : 0
  }
  return { freq: freq.map((f) => +((f / total) * 100).toFixed(1)), bluffShare }
}

/** OOP 面对各尺度的跟注率（组合加权，按 IP 下注时 OOP 各手的到达概率）与 MDF */
function oopCallRate(st: Strat) {
  const { reach } = oopCallGain(st.ip)
  return SIZES.map((b, k) => {
    let c = 0
    let r = 0
    for (let j = 0; j < NO; j++) {
      c += reach[j * K + k]! * st.oop[j * K + k]!
      r += reach[j * K + k]!
    }
    return { size: b, call: r > 0 ? +((c / r) * 100).toFixed(1) : 0, mdf: +((POT / (POT + b)) * 100).toFixed(1) }
  })
}

/** OOP 按代号汇总面对某尺度的跟注率 */
function oopByCode(st: Strat, k: number) {
  const m = new Map<string, { n: number; c: number; eq: number }>()
  OOP.forEach((h, j) => {
    const r = m.get(h.code) ?? { n: 0, c: 0, eq: 0 }
    r.n++
    r.c += st.oop[j * K + k]!
    r.eq += oopShowdown[j]!
    m.set(h.code, r)
  })
  return [...m.entries()]
    .map(([code, r]) => ({
      code,
      combos: r.n,
      showdown: +((r.eq / r.n) * 100).toFixed(1),
      call: +((r.c / r.n) * 100).toFixed(1),
    }))
    .sort((a, b) => b.showdown - a.showdown)
}

/**
 * 节点锁定：把 OOP 在每个尺度的跟注率整体移动 delta（−0.15 = 多弃 15 个百分点）。
 * 多弃时从最弱的跟注牌开始弃，多跟时从最强的弃牌开始加 —— 这是人的典型偏离方式。
 */
function shiftOop(st: Strat, delta: number): Float64Array {
  const out = new Float64Array(st.oop)
  const { reach } = oopCallGain(st.ip)
  for (let k = 0; k < K; k++) {
    const order = [...OOP.keys()].sort((a, b) => oopShowdown[a]! - oopShowdown[b]!) // 弱 → 强
    let totalReach = 0
    for (const j of order) totalReach += reach[j * K + k]!
    let budget = Math.abs(delta) * totalReach
    const seq = delta < 0 ? order : [...order].reverse()
    for (const j of seq) {
      if (budget <= 0) break
      const r = reach[j * K + k]!
      if (!r) continue
      const cur = out[j * K + k]!
      const room = delta < 0 ? cur : 1 - cur
      if (room <= 0) continue
      const take = Math.min(room, budget / r)
      out[j * K + k] = cur + (delta < 0 ? -take : take)
      budget -= take * r
    }
  }
  return out
}

// ---------------------------------------------------------------- 运行

const t0 = Date.now()
const eq = solve()
const eqEV = ipEV(eq)
const expl = exploitability(eq)
console.log(`组合：CO ${NI}  BB ${NO}`)
console.log(`均衡：CO EV ${eqEV.toFixed(3)}bb，可剥削度 ${expl.toFixed(4)}bb（${((expl / POT) * 100).toFixed(3)}% 底池）`)
const sum = ipSummary(eq)
console.log('CO 动作分布（过牌 / 10 / 20 / 40）', sum.freq, '诈唬占比', sum.bluffShare)
console.log('BB 跟注率', oopCallRate(eq))

// 只能过牌 / 河牌一种尺度：分别看三种
const single = SIZES.map((b, k) => {
  const allowed = new Array(A).fill(false)
  allowed[0] = true
  allowed[k + 1] = true
  const st = solve({ allowed })
  const ev = ipEV(st)
  console.log(`只用 ${b}bb：CO EV ${ev.toFixed(3)}，比三种尺度少 ${(eqEV - ev).toFixed(3)}bb`)
  return { size: b, ev: +ev.toFixed(2), loss: +(eqEV - ev).toFixed(2), freq: ipSummary(st).freq }
})
// 完全不下注
const checkOnly = (() => {
  const allowed = [true, false, false, false]
  const ev = ipEV(solve({ allowed }))
  return +ev.toFixed(2)
})()

// 节点锁定
function lock(delta: number) {
  const locked = shiftOop(eq, delta)
  const eqVsLocked = ipEV({ ip: eq.ip, oop: locked })
  const br = ipBestResponse(locked)
  const brEV = ipEV(br)
  // 对手发现后反剥削：OOP 对 CO 的剥削策略做最优反应
  const counter = ipEV(oopBestResponse(br.ip))
  // 读错了：对手其实按均衡打
  const vsEq = ipEV({ ip: br.ip, oop: eq.oop })
  const s = ipSummary(br)
  console.log(
    `锁定 BB 跟注率 ${delta > 0 ? '+' : ''}${delta * 100}pp：均衡策略 ${eqVsLocked.toFixed(2)}，最优剥削 ${brEV.toFixed(2)}，被反剥削 ${counter.toFixed(2)}；` +
      `剥削策略动作 ${s.freq}，诈唬占比 ${s.bluffShare}`,
  )
  return {
    delta,
    callRate: oopCallRate({ ip: eq.ip, oop: locked }),
    eqStrategyEV: +eqVsLocked.toFixed(2),
    exploitEV: +brEV.toFixed(2),
    counteredEV: +counter.toFixed(2),
    vsEquilibriumEV: +vsEq.toFixed(2),
    summary: s,
    byCode: ipByCode(br),
  }
}
const overfold = lock(-0.15)
const overcall = lock(0.15)
const lockSeries = [-0.15, -0.1, -0.05, 0.05, 0.1, 0.15].map((d) => {
  const r = d === -0.15 ? overfold : d === 0.15 ? overcall : lock(d)
  return {
    delta: d,
    eqStrategyEV: r.eqStrategyEV,
    exploitEV: r.exploitEV,
    counteredEV: r.counteredEV,
    vsEquilibriumEV: r.vsEquilibriumEV,
  }
})

/**
 * 一条人能执行的规则：三条和顺子下注 2 倍池；诈唬只用 54s、QJs、AQs，也下 2 倍池；其余全部过牌。
 * 看它对均衡 BB 的 EV，以及最坏情况（BB 针对它做最优反应）。
 */
const RULE_VALUE = new Set(['65s', 'KK', '88', '77', '44'])
const RULE_BLUFF = new Set(['54s', 'QJs', 'AQs'])
const ruleIp = new Float64Array(NI * A)
IP.forEach((h, i) => {
  const a = RULE_VALUE.has(h.code) || RULE_BLUFF.has(h.code) ? 3 : 0
  ruleIp[i * A + a] = 1
})
const rule = {
  value: [...RULE_VALUE],
  bluff: [...RULE_BLUFF],
  vsEquilibrium: +ipEV({ ip: ruleIp, oop: eq.oop }).toFixed(2),
  worstCase: +ipEV(oopBestResponse(ruleIp)).toFixed(2),
  summary: ipSummary({ ip: ruleIp, oop: oopBestResponse(ruleIp).oop }),
}
console.log('规则化策略', rule)

const out = `/**
 * 自动生成，请勿手改。来源：scripts/precompute-river.ts
 *
 * L6 的完整求解河牌局面。CFR+ 迭代 4000 轮，无随机性，重复运行结果一致。
 * EV 单位为 bb，以河牌开始时为 0 点：CO 的 EV 是他从这个 ${POT}bb 底池里平均拿走多少。
 */

export const RIVER = ${JSON.stringify(
  {
    board: BOARD_STR,
    pot: POT,
    stack: STACK,
    sizes: SIZES,
    ranges: RANGES,
    combos: { co: NI, bb: NO },
    equilibrium: {
      ev: +eqEV.toFixed(2),
      exploitability: +expl.toFixed(4),
      summary: sum,
      callRate: oopCallRate(eq),
      co: ipByCode(eq),
      bb: SIZES.map((_, k) => oopByCode(eq, k)),
    },
    single,
    checkOnly,
    overfold,
    overcall,
    lockSeries,
    rule,
  },
  null,
  1,
)} as const

export type RiverData = typeof RIVER
`
writeFileSync(new URL('../src/data/river.ts', import.meta.url), out)
console.log(`已写入 src/data/river.ts  ${((Date.now() - t0) / 1000).toFixed(1)}s`)
void cardStr
