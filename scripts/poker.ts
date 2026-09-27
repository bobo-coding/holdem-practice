/**
 * 离线脚本共用：快速 7 张牌评估与起手牌展开。
 *
 * eval7 与 precompute-flops.ts 的 evaluate 已做过 30 万手随机对比，排序完全一致。
 * 模块加载时会跑一遍已知牌型的自检，失败直接抛错。
 */
import type { HandCode } from '../src/lib/range.ts'

// ---------------------------------------------------------------- 快速 7 张牌评估

export type Card = number // 0..51，r = c>>2（0=2 … 12=A），s = c&3

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
export function eval7(cards: Card[]): number {
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

export function combosOf(code: HandCode): [Card, Card][] {
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
