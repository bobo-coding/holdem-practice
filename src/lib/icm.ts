/**
 * ICM（Independent Chip Model，Malmuth-Harville 模型）。
 *
 * 假设：每个玩家拿到第一名的概率 = 他的筹码占比；
 * 拿掉第一名之后，剩下的人按同样的规则分第二名，依此类推。
 * 这是锦标赛里把筹码折算成奖金期望的通用标准模型。
 */

/**
 * 返回每个玩家的奖金期望，与 stacks 同序。
 * payouts 按名次从高到低，长度可以小于人数（没进钱圈的名次奖金为 0）。
 */
export function icm(stacks: number[], payouts: number[]): number[] {
  const n = stacks.length
  const ev = new Array<number>(n).fill(0)
  const places = Math.min(payouts.length, n)

  // 递归枚举名次顺序；used 为已占名次的玩家位掩码，prob 为走到这一步的概率
  const go = (used: number, rest: number, place: number, prob: number) => {
    if (place >= places || prob === 0) return
    for (let i = 0; i < n; i++) {
      if (used & (1 << i) || stacks[i]! <= 0) continue
      const p = (prob * stacks[i]!) / rest
      ev[i]! += p * payouts[place]!
      go(used | (1 << i), rest - stacks[i]!, place + 1, p)
    }
  }
  const total = stacks.reduce((a, b) => a + Math.max(b, 0), 0)
  if (total > 0) go(0, total, 0, 1)
  return ev
}

/**
 * 泡沫期跟注全下所需的最低胜率（忽略盲注与死钱）。
 * hero 跟注 villain 的全下，villain 筹码 ≥ hero；输了 hero 出局。
 */
export function callThreshold(
  stacks: number[],
  payouts: number[],
  hero: number,
  villain: number,
): { need: number; fold: number; win: number; lose: number } {
  const h = stacks[hero]!
  const fold = icm(stacks, payouts)[hero]!
  const winStacks = [...stacks]
  winStacks[hero] = h * 2
  winStacks[villain] = stacks[villain]! - h
  const win = icm(winStacks, payouts)[hero]!
  const loseStacks = [...stacks]
  loseStacks[hero] = 0
  loseStacks[villain] = stacks[villain]! + h
  // 出局者拿剩下名次里最低的一个：泡沫期即 0
  const out = stacks.filter((s) => s > 0).length
  const lose = out - 1 < payouts.length ? payouts[out - 1]! : 0
  return { need: (fold - lose) / (win - lose), fold, win, lose }
}
