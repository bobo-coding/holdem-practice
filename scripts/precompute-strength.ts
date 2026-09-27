/**
 * 离线预计算：169 种起手牌对一手随机牌的翻前全下胜率。
 *
 * 产出 src/data/strength.ts，用作范围矩阵的「强弱度」着色。
 * 运行：pnpm tsx scripts/precompute-strength.ts（约 1 分钟）
 *
 * 为什么选这个指标：它客观、可复现、不依赖任何人的范围表。
 * 它不等于「翻后可玩性」—— K2o 的全下胜率高于 65s，但 65s 在深筹码下更好打。
 * 课程里着色处都会注明这一点。
 */
import { gridCodes } from '../src/lib/range.ts'
import { eval7, combosOf, type Card } from './poker.ts'
import { writeFileSync } from 'node:fs'

const TRIALS = 300_000
const CODES = gridCodes().flat()
const used = new Uint8Array(52)
const a7 = new Array<Card>(7)
const b7 = new Array<Card>(7)
const eq: Record<string, number> = {}

const t0 = Date.now()
for (const code of CODES) {
  const combos = combosOf(code)
  let score = 0
  for (let n = 0; n < TRIALS; n++) {
    const h = combos[n % combos.length]!
    used.fill(0)
    used[h[0]] = used[h[1]] = 1
    const draw = () => {
      let c: Card
      do c = (Math.random() * 52) | 0
      while (used[c])
      used[c] = 1
      return c
    }
    a7[0] = h[0]
    a7[1] = h[1]
    b7[0] = draw()
    b7[1] = draw()
    for (let k = 2; k < 7; k++) a7[k] = b7[k] = draw()
    const x = eval7(a7)
    const y = eval7(b7)
    score += x > y ? 1 : x === y ? 0.5 : 0
  }
  eq[code] = +((score / TRIALS) * 100).toFixed(1)
}

// 参照值：公开的翻前胜率表（对随机牌），允许 ±0.5 的蒙特卡洛误差
for (const [h, want] of [
  ['AA', 85.2],
  ['KK', 82.4],
  ['AKs', 67.0],
  ['72o', 34.6],
  ['32o', 32.3],
] as const) {
  console.log(`抽查 ${h}：${eq[h]}%（参照 ${want}%）`)
  if (Math.abs(eq[h]! - want) > 0.5) throw new Error(`偏差过大：${h}`)
}

const out = `/**
 * 自动生成，请勿手改。来源：scripts/precompute-strength.ts
 *
 * 每种起手牌对一手随机牌的翻前全下胜率（%，含平分的一半），
 * 每种 ${TRIALS.toLocaleString()} 次蒙特卡洛，误差约 ±0.1%。
 *
 * 用作范围矩阵的强弱度着色。注意它衡量的是「全下时的原始牌力」，
 * 不是翻后可玩性：同花连张的实战价值高于这个数字所体现的。
 */
export const EQ_VS_RANDOM: Record<string, number> = ${JSON.stringify(eq)}
`
writeFileSync(new URL('../src/data/strength.ts', import.meta.url), out)
console.log(`已写入 src/data/strength.ts  ${((Date.now() - t0) / 1000).toFixed(0)}s`)
