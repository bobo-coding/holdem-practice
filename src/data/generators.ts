/**
 * 计算题生成器。
 * 题目和答案都由公式实时算出，不写死内容 —— 保证答案与解析永远一致。
 */
import type { SkillTag } from '../lib/storage'

export interface GenQuestion {
  prompt: string
  /** 补充条件，分行显示 */
  facts?: string[]
  options: string[]
  answer: number
  explain: string
  tag: SkillTag
  /** 用于错题本去重的稳定标识 */
  key: string
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!

/** 洗牌并返回正确答案的新下标 */
function shuffle(options: string[], correct: string): { options: string[]; answer: number } {
  const uniq = [...new Set(options)]
  for (let i = uniq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[uniq[i], uniq[j]] = [uniq[j]!, uniq[i]!]
  }
  return { options: uniq, answer: uniq.indexOf(correct) }
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`

// ---------------------------------------------------------------- 底池赔率

const SIZES: [string, number][] = [
  ['1/3 池', 1 / 3],
  ['1/2 池', 1 / 2],
  ['2/3 池', 2 / 3],
  ['满池', 1],
  ['1.5 倍池', 1.5],
]

export function oddsQuestion(): GenQuestion {
  const pot = pick([40, 60, 80, 100, 120, 150, 200, 240])
  const [, frac] = pick(SIZES)
  const bet = Math.round(pot * frac)
  // 跟注前底池已包含对手的下注
  const potBefore = pot + bet
  const correct = bet / (potBefore + bet)

  const { options, answer } = shuffle(
    [
      pct(correct),
      pct(bet / potBefore), // 经典错误：忘了把自己的跟注算进分母
      pct(bet / pot), // 忘了对手的注也在底池里
      pct(correct * 1.45),
    ],
    pct(correct),
  )

  return {
    prompt: `底池 ${pot}，对手下注 ${bet}。你跟注需要的最低胜率是？`,
    options,
    answer,
    explain: `跟注前底池 P = ${pot} + ${bet} = ${potBefore}，跟注额 C = ${bet}。必要胜率 = C/(P+C) = ${bet}/${potBefore + bet} = ${pct(correct)}。`,
    tag: 'math',
    key: `odds:${pot}:${bet}`,
  }
}

// ---------------------------------------------------------------- EV

export function evQuestion(): GenQuestion {
  const kind = pick(['bluff', 'breakeven', 'call'] as const)
  const pot = pick([60, 80, 100, 120, 150, 200])

  if (kind === 'bluff') {
    const frac = pick([0.5, 0.66, 0.75, 1])
    const bet = Math.round(pot * frac)
    const f = pick([0.3, 0.4, 0.5, 0.55, 0.6, 0.7])
    const ev = f * pot - (1 - f) * bet
    const fmt = (x: number) => (x >= 0 ? `+${x.toFixed(1)}` : x.toFixed(1))
    const { options, answer } = shuffle(
      [
        fmt(ev),
        fmt(f * pot), // 忘了算被跟注时的损失
        fmt(f * pot - bet), // 损失没有按概率加权
        fmt(f * (pot + bet) - (1 - f) * bet), // 把自己的注重复计入底池
      ],
      fmt(ev),
    )
    return {
      prompt: `底池 ${pot}，你用空气牌诈唬下注 ${bet}。你估计对手会弃牌 ${(f * 100).toFixed(0)}%。这次诈唬的 EV 是？`,
      options,
      answer,
      explain: `EV = f × 底池 − (1−f) × 下注额 = ${f} × ${pot} − ${(1 - f).toFixed(2)} × ${bet} = ${fmt(ev)}。注意被跟注时只输掉你投进去的 ${bet}，底池里原有的钱本来就不是你的。`,
      tag: 'math',
      key: `ev-bluff:${pot}:${bet}:${f}`,
    }
  }

  if (kind === 'breakeven') {
    const [label, frac] = pick(SIZES)
    const bet = Math.round(pot * frac)
    const correct = bet / (pot + bet)
    const { options, answer } = shuffle(
      [pct(correct), pct(bet / pot), pct(correct * 1.4), pct(1 - correct)],
      pct(correct),
    )
    return {
      prompt: `底池 ${pot}，你诈唬下注 ${bet}（${label}）。需要多少弃牌率才不亏？`,
      options,
      answer,
      explain: `盈亏平衡弃牌率 = B/(P+B) = ${bet}/${pot + bet} = ${pct(correct)}。它和对手跟注所需的胜率是同一个数 —— 记一个就够。`,
      tag: 'math',
      key: `ev-be:${pot}:${bet}`,
    }
  }

  const call = pick([30, 40, 50, 60, 80])
  const w = pick([0.25, 0.3, 0.35, 0.4, 0.45, 0.55])
  const ev = w * (pot + call) - call
  const fmt = (x: number) => (x >= 0 ? `+${x.toFixed(1)}` : x.toFixed(1))
  const { options, answer } = shuffle(
    [
      fmt(ev),
      fmt(w * pot - call), // 损失没按概率处理
      fmt(w * pot), // 忘了减去跟注成本
      fmt(w * (pot + call)), // 同上

    ],
    fmt(ev),
  )
  return {
    prompt: `跟注前底池 ${pot}（已含对手下注），你要跟 ${call}，你估计自己的胜率是 ${(w * 100).toFixed(0)}%。跟注的 EV 是？`,
    options,
    answer,
    explain: `EV = 胜率 × (底池 + 跟注额) − 跟注额 = ${w} × ${pot + call} − ${call} = ${fmt(ev)}。${ev >= 0 ? '正 EV，可以跟 —— 但还要和加注的 EV 比较。' : '负 EV，除非有隐含赔率支撑，否则应该弃牌。'}`,
    tag: 'math',
    key: `ev-call:${pot}:${call}:${w}`,
  }
}

// ---------------------------------------------------------------- 组合计数

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
const SUITS = ['♠', '♥', '♦', '♣']

function board3(): { cards: string[]; ranks: string[] } {
  const rs: string[] = []
  while (rs.length < 3) {
    const r = pick(RANKS)
    if (!rs.includes(r)) rs.push(r)
  }
  const used: string[] = []
  const cards = rs.map((r) => {
    let s = pick(SUITS)
    while (used.includes(r + s)) s = pick(SUITS)
    used.push(r + s)
    return r + s
  })
  return { cards, ranks: rs }
}

export function comboQuestion(): GenQuestion {
  const { cards, ranks } = board3()
  const boardStr = cards.join(' ')
  const off = RANKS.filter((r) => !ranks.includes(r))
  const kind = pick(['unpaired-clean', 'unpaired-hit', 'pair-clean', 'pair-hit', 'sets'] as const)
  const num = (n: number) => String(n)

  if (kind === 'sets') {
    const { options, answer } = shuffle([num(9), num(18), num(6), num(12)], num(9))
    return {
      prompt: `牌面 ${boardStr}。对手全部暗三条（${ranks[0]}${ranks[0]}、${ranks[1]}${ranks[1]}、${ranks[2]}${ranks[2]}）一共有几个组合？`,
      options,
      answer,
      explain: `每种对子在牌面出现一张后，只剩 C(3,2) = 3 个组合，三种共 9 个。对比一下：光是三种 ${ranks[0]}x 的顶对就有 36 个组合 —— 三条远比感觉中稀少。`,
      tag: 'math',
      key: `combo-sets:${ranks.join('')}`,
    }
  }

  if (kind === 'unpaired-clean') {
    const [a, b] = [pick(off), pick(off)]
    if (a === b) return comboQuestion()
    const { options, answer } = shuffle([num(16), num(12), num(8), num(4)], num(16))
    return {
      prompt: `牌面 ${boardStr}。对手手上 ${a}${b}（两张牌面上都没出现）有几个组合？`,
      options,
      answer,
      explain: `未配对手牌的基准是 16 个组合：同花 4 个 + 不同花 12 个。牌面没有相关张，所以不打折。`,
      tag: 'math',
      key: `combo-uc:${a}${b}`,
    }
  }

  if (kind === 'unpaired-hit') {
    const hit = pick(ranks)
    const other = pick(off)
    const { options, answer } = shuffle([num(12), num(16), num(9), num(6)], num(12))
    return {
      prompt: `牌面 ${boardStr}。对手手上 ${hit}${other} 有几个组合？`,
      options,
      answer,
      explain: `牌面已经用掉一张 ${hit}，剩 3 张 × 4 张 ${other} = 12 个组合。未配对手牌本来是 16 个。`,
      tag: 'math',
      key: `combo-uh:${hit}${other}`,
    }
  }

  if (kind === 'pair-clean') {
    const p = pick(off)
    const { options, answer } = shuffle([num(6), num(4), num(3), num(12)], num(6))
    return {
      prompt: `牌面 ${boardStr}。对手手上口袋对 ${p}${p} 有几个组合？`,
      options,
      answer,
      explain: `任意对子有 C(4,2) = 6 个组合。牌面上没有 ${p}，所以是完整的 6 个。`,
      tag: 'math',
      key: `combo-pc:${p}`,
    }
  }

  const p = pick(ranks)
  const { options, answer } = shuffle([num(3), num(6), num(4), num(1)], num(3))
  return {
    prompt: `牌面 ${boardStr}。对手手上口袋对 ${p}${p} 有几个组合？`,
    options,
    answer,
    explain: `牌面用掉一张 ${p}，只剩 3 张，C(3,2) = 3 个组合。对子被牌面命中一张就直接腰斩 —— 这是阻断效应最强的一种。`,
    tag: 'math',
    key: `combo-ph:${p}`,
  }
}

export const GENERATORS = {
  odds: { id: 'odds', name: '赔率闪卡', gen: oddsQuestion, timed: true },
  ev: { id: 'ev', name: 'EV 计算题', gen: evQuestion, timed: false },
  combo: { id: 'combo', name: 'Combo 计数', gen: comboQuestion, timed: false },
} as const

export type GeneratorId = keyof typeof GENERATORS
