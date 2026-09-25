/**
 * 计算题生成器。
 * 题目和答案都由公式实时算出，不写死内容 —— 保证答案与解析永远一致。
 */
import type { SkillTag } from '../lib/storage'
import { icm, callThreshold } from '../lib/icm'

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

// ---------------------------------------------------------------- GTO 频率

const RIVER_SIZES: [string, number][] = [
  ['1/3 池', 1 / 3],
  ['1/2 池', 1 / 2],
  ['2/3 池', 2 / 3],
  ['3/4 池', 3 / 4],
  ['满池', 1],
  ['2 倍池', 2],
]

export function freqQuestion(): GenQuestion {
  const kind = pick(['mdf', 'share', 'count'] as const)
  const [label, s] = pick(RIVER_SIZES)

  if (kind === 'mdf') {
    const mdf = 1 / (1 + s)
    const { options, answer } = shuffle(
      [pct(mdf), pct(s / (1 + s)), pct(s / (1 + 2 * s)), pct(1 - s / (1 + 2 * s))],
      pct(mdf),
    )
    return {
      prompt: `河牌对手下注 ${label}。按 MDF，你至少要继续（跟注或加注）多大比例的范围，才能让他的任意两张诈唬无法自动盈利？`,
      options,
      answer,
      explain: `MDF = P/(P+B)。以底池为 1，下注 ${+s.toFixed(3)}，MDF = 1/(1+${+s.toFixed(3)}) = ${pct(mdf)}。弃得比 ${pct(1 - mdf)} 多，他用任意两张下注都赚钱。`,
      tag: 'math',
      key: `freq-mdf:${label}`,
    }
  }

  if (kind === 'share') {
    const share = s / (1 + 2 * s)
    const { options, answer } = shuffle(
      [pct(share), pct(s / (1 + s)), pct(1 / (1 + s)), pct(share / 2)],
      pct(share),
    )
    return {
      prompt: `河牌你用极化范围下注 ${label}。要让对手的抓诈唬牌跟注与弃牌无差异，下注范围里诈唬应占多少？`,
      options,
      answer,
      explain: `对手跟注要付 B，赢回 P+2B（底池 + 你的注 + 他的注），所需胜率 = B/(P+2B) = ${+s.toFixed(3)}/${+(1 + 2 * s).toFixed(3)} = ${pct(share)}。诈唬占比恰好等于这个数时，他跟不跟 EV 相同。`,
      tag: 'math',
      key: `freq-share:${label}`,
    }
  }

  // 给定价值组合数，平衡需要多少诈唬组合：诈唬/价值 = s/(1+s)
  const valueBy: Record<string, number[]> = {
    '1/3 池': [8, 12, 16, 20],
    '1/2 池': [6, 9, 12, 15, 18],
    '2/3 池': [5, 10, 15, 20],
    '3/4 池': [7, 14, 21],
    满池: [6, 8, 10, 12, 16, 20],
    '2 倍池': [6, 9, 12, 15],
  }
  const v = pick(valueBy[label]!)
  const b = Math.round((v * s) / (1 + s))
  const num = (n: number) => `${n} 个`
  const { options, answer } = shuffle(
    [num(b), num(v), num(Math.round(v * s)), num(Math.round((v * s) / (1 + 2 * s)))],
    num(b),
  )
  return {
    prompt: `河牌你打算下注 ${label}，手上有 ${v} 个价值组合。要达到平衡，应该配多少个诈唬组合？`,
    options,
    answer,
    explain: `诈唬占比 = s/(1+2s)，换成诈唬 : 价值 = s : (1+s)。s = ${+s.toFixed(3)}，所以诈唬 = ${v} × ${+s.toFixed(3)}/${+(1 + s).toFixed(3)} = ${b} 个。尺度越大，能配的诈唬越多。`,
    tag: 'math',
    key: `freq-count:${label}:${v}`,
  }
}

// ---------------------------------------------------------------- 剥削调整

/** 对手画像 → 调整方向。只收录方向明确、不依赖具体数字的对照 */
const PROFILES: { stat: string; right: string; wrong: string[]; why: string }[] = [
  {
    stat: 'Fold to Flop CBet 68%（样本 400 次）',
    right: '提高翻牌 c-bet 频率，空气也打小注',
    wrong: ['减少 c-bet，只用价值下注', '维持原策略，数据不说明问题'],
    why: '1/3 池 c-bet 只需对手弃 25% 就能自动盈利，他弃 68%，任意两张都赚。样本 400 次足以支持这个判断（L5-05）。',
  },
  {
    stat: 'WTSD 38%、W$SD 44%（样本 5000 手）',
    right: '砍掉河牌诈唬，加入更薄的价值下注',
    wrong: ['多用大尺度诈唬施压', '只在坚果时下注'],
    why: 'WTSD 很高说明他摊牌太多、跟得太宽；W$SD 偏低说明他摊牌时常输。对他诈唬收不到弃牌，而中等牌力下注能被更差的牌跟注。',
  },
  {
    stat: '河牌加注频率 1.5%，且全部摊牌都是坚果（样本 3000 手）',
    right: '面对他的河牌加注，除坚果外全部弃牌',
    wrong: ['按 MDF 跟注，否则会被剥削', '用两对以上跟注'],
    why: 'MDF 是对方频率未知时的防守下限。已知他只用坚果加注，他的加注范围里没有诈唬，任何抓诈唬牌的胜率都是 0。',
  },
  {
    stat: 'VPIP 55、PFR 6（样本 1500 手）',
    right: '隔离加注尺度加大，翻后多做价值、少做诈唬',
    wrong: ['放宽跛入，和他打多人底池', '收紧开池，等强牌'],
    why: 'VPIP 远高于 PFR 是典型的跟注站：翻前进池多、主动性差。对他最赚钱的是用有位优势的更强范围单挑他，然后不断价值下注。',
  },
  {
    stat: '3bet 2%（样本 3000 手，对 BTN 开池）',
    right: '面对他的 3bet，大幅收紧继续范围',
    wrong: ['按均衡防守，用 4bet 诈唬反击', '维持原来的跟注范围'],
    why: '3bet 2% 基本就是 QQ+、AK。他的 3bet 范围几乎没有诈唬，按均衡频率防守会把大量边缘牌送给他的超强范围。',
  },
  {
    stat: 'Check-raise Flop 22%（样本 600 次，远高于常见的 8%–12%）',
    right: '翻牌 c-bet 更多用能承受加注的牌，空气少打',
    wrong: ['c-bet 更大尺度吓退他', '完全停止 c-bet'],
    why: '他加注太多，意味着你的空气 c-bet 常常被赶走、白白损失下注额；而你的强牌能从他过宽的加注范围里赚更多。不是停止下注，而是改变下注的构成。',
  },
  {
    stat: 'Fold to River Bet 25%（样本 800 次）',
    right: '河牌几乎不诈唬，价值下注尺度加大',
    wrong: ['河牌小注诈唬，让他更难弃', '按均衡频率混合诈唬'],
    why: '1/2 池诈唬需要 33% 弃牌才盈亏平衡，他只弃 25%，所有纯诈唬都亏。他不看尺度就跟，价值下注就应该下得更大。',
  },
  {
    stat: 'AF（翻后激进度）0.6、从不在转河下注诈唬（样本 2500 手）',
    right: '他转河下注时相信他，用中等牌力弃牌',
    wrong: ['按 MDF 防守他的下注', '用中等牌加注试探'],
    why: '极被动的玩家主动下注几乎只代表价值。MDF 的前提是对手有诈唬；他没有，防守就是在给价值买单。',
  },
]

export function exploitQuestion(): GenQuestion {
  const kind = pick(['bluff', 'catch', 'profile', 'profile'] as const)

  if (kind === 'bluff') {
    const [label, s] = pick(RIVER_SIZES.slice(0, 5))
    const alpha = s / (1 + s)
    // 离阈值至少 8 个百分点，避免在噪音范围内出题
    const dir = pick([1, -1])
    const f = Math.min(0.9, Math.max(0.1, alpha + dir * pick([0.1, 0.15, 0.2, 0.25])))
    const fp = Math.round(f * 100)
    const ev = (fp / 100) * 1 - (1 - fp / 100) * s
    const right = fp / 100 > alpha ? '增加诈唬（纯诈唬已经自动盈利）' : '减少诈唬，把下注留给价值牌'
    const { options, answer } = shuffle(
      [
        '增加诈唬（纯诈唬已经自动盈利）',
        '减少诈唬，把下注留给价值牌',
        '维持均衡频率，不做调整',
      ],
      right,
    )
    return {
      prompt: `河牌你下注 ${label}。统计显示对手面对这个尺度弃牌 ${fp}%（样本充足）。你的诈唬频率应该？`,
      options,
      answer,
      explain: `纯诈唬的盈亏平衡弃牌率 α = B/(P+B) = ${pct(alpha)}。他弃 ${fp}%，${fp / 100 > alpha ? '高于' : '低于'} α。以底池为 1，每次纯诈唬 EV = ${fp / 100} × 1 − ${(1 - fp / 100).toFixed(2)} × ${+s.toFixed(3)} = ${ev >= 0 ? '+' : ''}${ev.toFixed(2)} 个底池。已知对手偏离时，均衡频率不再是最优。`,
      tag: 'reading',
      key: `exploit-bluff:${label}:${fp}`,
    }
  }

  if (kind === 'catch') {
    const [label, s] = pick(RIVER_SIZES)
    const need = s / (1 + 2 * s)
    const dir = pick([1, -1])
    const x = Math.round(Math.min(0.8, Math.max(0.05, need + dir * pick([0.1, 0.15, 0.2]))) * 100)
    const right = x / 100 > need ? '跟注' : '弃牌'
    const { options, answer } = shuffle(['跟注', '弃牌', '两者 EV 相同'], right)
    return {
      prompt: `河牌对手下注 ${label}。你拿着只能赢诈唬的抓诈唬牌。根据你对他的建模，他这条线里诈唬约占 ${x}%。你应该？`,
      options,
      answer,
      explain: `跟注所需胜率 = B/(P+2B) = ${pct(need)}。抓诈唬牌的胜率就是他的诈唬占比 ${x}%，${right === '跟注' ? '高于所需，跟注盈利' : '低于所需，跟注亏损'}。这里不看 MDF —— MDF 是不知道对手诈唬频率时的防守下限，已经有模型就直接比胜率。`,
      tag: 'reading',
      key: `exploit-catch:${label}:${x}`,
    }
  }

  const p = pick(PROFILES)
  const { options, answer } = shuffle([p.right, ...p.wrong], p.right)
  return {
    prompt: `对手数据：${p.stat}。最合适的调整是？`,
    options,
    answer,
    explain: p.why,
    tag: 'reading',
    key: `exploit-profile:${PROFILES.indexOf(p)}`,
  }
}

// ---------------------------------------------------------------- ICM

const PAYOUTS: { label: string; pay: number[] }[] = [
  { label: '50% / 30% / 20%', pay: [50, 30, 20] },
  { label: '65% / 35%', pay: [65, 35] },
  { label: '40% / 30% / 20% / 10%', pay: [40, 30, 20, 10] },
]

export function icmQuestion(): GenQuestion {
  const kind = pick(['value', 'call'] as const)
  const fmt$ = (x: number) => `$${x.toFixed(1)}`

  if (kind === 'value') {
    const { label, pay } = PAYOUTS[0]!
    // 三人，总筹码 10000，按千取整，避免退化成等筹码
    let stacks: number[]
    do {
      const a = pick([1000, 1500, 2000, 2500, 3000])
      const b = pick([2000, 2500, 3000, 3500, 4000])
      stacks = [a, b, 10000 - a - b]
    } while (stacks[2]! <= stacks[1]!)
    const hero = pick([0, 1, 2])
    const ev = icm(stacks, pay)[hero]!
    const chip = (stacks[hero]! / 10000) * 100
    const { options, answer } = shuffle(
      [fmt$(ev), fmt$(chip), fmt$((pay[0]! * stacks[hero]!) / 10000 + pay[2]! / 3), fmt$(hero === 2 ? ev + 6 : ev - 5)],
      fmt$(ev),
    )
    return {
      prompt: `三人决赛桌，奖池 $100，分配 ${label}。筹码：A ${stacks[0]}、B ${stacks[1]}、C ${stacks[2]}。按 ICM，${'ABC'[hero]} 的奖金期望是？`,
      facts: ['提示：P(某人第一) = 筹码占比；第一名确定后，剩下两人按筹码占比分第二。'],
      options,
      answer,
      explain: `筹码占比 ${(chip).toFixed(0)}%，按筹码直接折算是 ${fmt$(chip)}；ICM 算出 ${fmt$(ev)}。${ev > chip ? '短码的 ICM 价值高于筹码占比 —— 保底奖金让每个筹码都更值钱' : '大码的 ICM 价值低于筹码占比 —— 多出来的筹码换不到等比例的奖金'}。`,
      tag: 'math',
      key: `icm-value:${stacks.join('-')}:${hero}`,
    }
  }

  // 泡沫：4 人剩 3 个奖励圈，大码全下，hero 决定是否跟注
  const { label, pay } = PAYOUTS[0]!
  let st: number[]
  let r: ReturnType<typeof callThreshold>
  do {
    const big = pick([4000, 4500, 5000])
    const hero = pick([1500, 2000, 2500])
    const o1 = pick([1000, 1500, 2000, 2500])
    st = [hero, big, o1, 10000 - big - hero - o1]
    r = callThreshold(st, pay, 0, 1)
  } while (st[3]! < 500 || st[1]! < st[0]!)
  const need = Math.round(r.need * 100)
  const pc = (n: number) => `${n}%`
  const { options, answer } = shuffle(
    [pc(need), pc(50), pc(Math.max(need - 12, 52)), pc(Math.min(need + 13, 95))],
    pc(need),
  )
  return {
    prompt: `四人剩三个奖励圈（${label}，奖池 $100）。你 ${st[0]}，大码 ${st[1]} 全下，另外两人 ${st[2]} 和 ${st[3]}。不计盲注，你跟注至少需要多少胜率？`,
    options,
    answer,
    explain: `弃牌：你的 ICM 价值 ${fmt$(r.fold)}。跟注赢：筹码翻倍到 ${st[0]! * 2}，价值 ${fmt$(r.win)}。跟注输：泡沫出局，${fmt$(r.lose)}。所需胜率 = (弃牌 − 输) / (赢 − 输) = ${need}%。按筹码算只要 50%，多出来的 ${need - 50} 个百分点就是 ICM 风险溢价。`,
    tag: 'math',
    key: `icm-call:${st.join('-')}`,
  }
}

export const GENERATORS = {
  odds: { id: 'odds', name: '赔率闪卡', gen: oddsQuestion, timed: true },
  ev: { id: 'ev', name: 'EV 计算题', gen: evQuestion, timed: false },
  combo: { id: 'combo', name: 'Combo 计数', gen: comboQuestion, timed: false },
  freq: { id: 'freq', name: 'GTO 频率题', gen: freqQuestion, timed: false },
  exploit: { id: 'exploit', name: '剥削调整题', gen: exploitQuestion, timed: false },
  icm: { id: 'icm', name: 'ICM 决策题', gen: icmQuestion, timed: false },
} as const

export type GeneratorId = keyof typeof GENERATORS
