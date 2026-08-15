import type { SkillTag } from '../lib/storage'

/**
 * Spot Trainer 题库：完整局面 + 多选 + 解析。
 *
 * 所有局面统一为 6-max 现金局、盲注 0.5/1、有效筹码 100bb，底池单位 bb。
 * 解析里引用的范围数据来自 scripts/precompute-flops.ts 与 precompute-postflop.ts。
 */
export interface Spot {
  id: string
  level: string
  /** 考察的概念，答错时进错题本用 */
  topic: string
  setup: string
  hero: string[]
  board: string[]
  street: string
  pot: string
  history: string
  options: string[]
  answer: number
  explain: string
  tag: SkillTag
}

export const SPOTS: Spot[] = [
  {
    id: 'S01',
    level: 'L3',
    topic: '干燥面的 c-bet 频率与尺度',
    setup: '你在 CO 开池 2.5bb，BB 跟注',
    hero: ['A♣', 'Q♦'],
    board: ['K♠', '7♦', '2♣'],
    street: '翻牌',
    pot: '5.5bb',
    history: 'BB 过牌',
    options: ['过牌', '下注 1.8bb（1/3 池）', '下注 4bb（3/4 池）'],
    answer: 1,
    explain:
      '实测这张牌面上 CO 胜率 57.2%，范围优势明显；但两对以上只有 3.5%，坚果优势有限。范围优势决定频率、坚果优势决定尺度 —— 所以是高频小注。AQ 本身虽然没中，但它是这个全范围小注策略的一部分，且带两张高张的后备权益。',
    tag: 'postflop',
  },
  {
    id: 'S02',
    level: 'L3',
    topic: '无范围优势时的收缩',
    setup: '你在 CO 开池 2.5bb，BB 跟注',
    hero: ['A♥', 'K♦'],
    board: ['7♠', '6♠', '5♦'],
    street: '翻牌',
    pot: '5.5bb',
    history: 'BB 过牌',
    options: ['下注 1.8bb', '下注 4bb', '过牌'],
    answer: 2,
    explain:
      '这是最反直觉的一个局面。实测 CO 在这张牌面上胜率只有 49.6% —— 你是落后的一方，而且 BB 的两对以上组合更多（7.5% 对 5.5%）。AK 在这里是纯空气，没有对子也没有听牌。有范围优势才谈频率，没有优势时正确的反应是过牌，而不是「我是加注者所以要 c-bet」。',
    tag: 'postflop',
  },
  {
    id: 'S03',
    level: 'L3',
    topic: '范围优势与坚果优势分离',
    setup: '你在 CO 开池 2.5bb，BB 跟注',
    hero: ['K♥', 'K♣'],
    board: ['5♠', '4♦', '3♣'],
    street: '翻牌',
    pot: '5.5bb',
    history: 'BB 过牌',
    options: ['下注 1.8bb（1/3 池）', '下注 4.5bb（约 4/5 池）', '过牌控池'],
    answer: 0,
    explain:
      '实测 CO 整体胜率 53.9%（有范围优势），但两对以上的组合 BB 有 8.1%、CO 只有 5.7%（坚果优势在 BB 那边）。KK 是超对，值得下注要价值，但绝不能打大 —— 一旦底池做大，你会发现自己在大底池里拿着一手中等牌，而对手的顺子和两对比你多。小注是唯一正确的尺度。',
    tag: 'postflop',
  },
  {
    id: 'S04',
    level: 'L4',
    topic: '识别「对范围不空」的空牌',
    setup: '你在 CO，翻牌 c-bet 1.8bb 被 BB 跟注',
    hero: ['A♣', 'Q♦'],
    board: ['K♠', '7♦', '2♣', '8♥'],
    street: '转牌',
    pot: '9.1bb',
    history: 'BB 过牌',
    options: ['下注 6bb（2/3 池）', '下注 3bb（1/3 池）', '过牌'],
    answer: 2,
    explain:
      '8 看起来是空牌，实测却让 CO 胜率从 57.2% 掉到 54.1%，而且 BB 的两对以上组合反超（7.2% 对 6.0%）—— 因为 8 连着 BB 范围里的 87s、98s、86s。同时 BB 跟注翻牌后范围已经收紧，弃牌率达不到 2/3 池所需的 40%。AQ 还有 6 个 outs 的摊牌潜力，过牌保留它。',
    tag: 'postflop',
  },
  {
    id: 'S05',
    level: 'L4',
    topic: '转牌帮到自己范围时的二枪',
    setup: '你在 CO，翻牌 c-bet 1.8bb 被 BB 跟注',
    hero: ['K♦', 'J♣'],
    board: ['K♠', '7♦', '2♣', 'Q♥'],
    street: '转牌',
    pot: '9.1bb',
    history: 'BB 过牌',
    options: ['过牌', '下注 6bb（2/3 池）', '下注 12bb（超池）'],
    answer: 1,
    explain:
      'Q 是加注方的朋友：实测 CO 胜率升到 59.2%，比翻牌时还高，因为 Q 落进了 KQ、QJ、AQ、QQ 这些 CO 常有而 BB 少有的牌。你有顶对好踢脚，属于价值两到三街的主干，转牌正是把底池做起来的时候。超池则过头 —— 你的坚果优势没大到那个程度。',
    tag: 'postflop',
  },
  {
    id: 'S06',
    level: 'L4',
    topic: '河牌被打击时的过牌',
    setup: '你在 CO，翻牌与转牌各下注一次，BB 都跟注',
    hero: ['K♦', 'Q♠'],
    board: ['Q♦', '7♣', '2♥', '5♠', 'A♦'],
    street: '河牌',
    pot: '21.1bb',
    history: 'BB 过牌',
    options: ['下注 7bb（1/3 池）', '下注 14bb（2/3 池）', '过牌'],
    answer: 2,
    explain:
      '判断标准只有一条：被跟注时我领先吗？A 落下之后，BB 跟了两条街的范围里有大量 Ax，它们现在全部领先你的顶对。会跟注的牌里你多数落后，比你差的 Qx 大多会弃 —— 这就是「被跟注时通常落后」，标准的过牌信号。你的牌仍然不错，但不错和能下注是两件事。',
    tag: 'postflop',
  },
  {
    id: 'S07',
    level: 'L4',
    topic: '阻断牌驱动的河牌诈唬',
    setup: '你在 BTN，翻牌与转牌持续下注，对手都跟注',
    hero: ['A♠', 'K♦'],
    board: ['Q♠', '8♠', '3♠', 'J♥', '2♦'],
    street: '河牌',
    pot: '30bb',
    history: '对手过牌',
    options: ['过牌，A 高牌可能赢', '下注 10bb（1/3 池）', '下注 33bb（超池）'],
    answer: 2,
    explain:
      '你手上的 A♠ 让对手的坚果同花组合直接归零（实测从 8 个降到 0），全部同花也减少 26%。对手没有坚果，面对超池只能用次强同花做非常难受的决定。A 高牌几乎没有摊牌价值，而阻断效应恰好最强 —— 这是超池诈唬的教科书条件。换成 A♥ 则完全不同：它一个黑桃都不阻断。',
    tag: 'postflop',
  },
  {
    id: 'S08',
    level: 'L4',
    topic: '抓诈唬看阻断而非牌力',
    setup: '你在 BB 过牌跟注了三条街的下注',
    hero: ['9♥', '9♦'],
    board: ['A♣', 'K♦', '7♣', '4♥', '2♠'],
    street: '河牌',
    pot: '60bb',
    history: '对手在河牌下注 45bb（3/4 池）',
    options: ['跟注', '弃牌', '加注'],
    answer: 1,
    explain:
      '你需要约 30% 胜率。对手打三条街大注的范围里，价值部分（Ax、AK、两对以上）组合数远超诈唬部分，而你的 99 既打不过任何价值牌，也不阻断任何诈唬牌 —— 它挡不住 Ax，也挡不住落空的同花听牌。牌力在纯抓诈唬局面里不区分结果，能区分的是阻断，而你一样都没有。',
    tag: 'postflop',
  },
  {
    id: 'S09',
    level: 'L4',
    topic: '河牌薄价值的尺度',
    setup: '你在 BTN，翻牌下注被跟注，转牌双方过牌',
    hero: ['A♦', 'J♠'],
    board: ['J♦', '9♣', '4♥', '3♠', '6♦'],
    street: '河牌',
    pot: '9.1bb',
    history: '对手过牌',
    options: ['过牌', '下注 3bb（1/3 池）', '下注 7bb（3/4 池）'],
    answer: 1,
    explain:
      '顶对顶踢脚在这条被动线路上是明确领先的，该要价值 —— 过牌会漏掉一整条街。但尺度必须小：对手会跟 1/3 池的范围里有 9x、中对、弱 Jx，你对它们都领先；换成 3/4 池，跟注范围收紧到只剩 J9、44、两对以上，你反而落后。薄价值的生死线就在尺度上。',
    tag: 'postflop',
  },
  {
    id: 'S10',
    level: 'L4',
    topic: '面对河牌加注的纪律',
    setup: '你在 CO 打了三条街价值',
    hero: ['A♠', 'A♥'],
    board: ['A♦', 'K♣', '9♥', '5♠', '2♥'],
    street: '河牌',
    pot: '55bb',
    history: '你下注 35bb，对手加注到 110bb',
    options: ['跟注', '弃牌', '再加注全下'],
    answer: 2,
    explain:
      '「面对河牌加注弃掉除坚果外的一切」这条规则的前提是你没有坚果 —— 先检查这一步再套规则。这张牌面没有同花（只有两张红桃）也没有顺子（A K 9 5 2 无法连成），你的顶三条 A 就是绝对坚果，一手都输不了。既然不可能落后，跟注就是漏掉价值：应该再加注。跟注要补 75bb 进 200bb 的底池，只需要 27.3% 胜率 —— 而你有 100%。',
    tag: 'postflop',
  },
  {
    id: 'S11',
    level: 'L3',
    topic: '无位置的强听牌处理',
    setup: '你在 BB 跟注了 CO 的 2.5bb 开池',
    hero: ['J♠', 'T♠'],
    board: ['9♠', '8♠', '3♦'],
    street: '翻牌',
    pot: '5.5bb',
    history: 'CO 下注 1.8bb',
    options: ['跟注', '加注到 6.5bb', '弃牌'],
    answer: 1,
    explain:
      '你有同花听牌 + 两头顺（15 outs），到河牌成牌率 54.1% —— 对上对手的很多成牌其实是领先的。这类牌下注不是诈唬，接近价值。而且无位置时过牌加注是唯一能夺回主动权的动作，你的范围在这张中低连接面上有坚果优势。纯跟注会浪费掉弃牌权益和这条街的主动权。',
    tag: 'postflop',
  },
  {
    id: 'S12',
    level: 'L3',
    topic: '多人底池的收缩',
    setup: '你在 BTN 开池，SB 和 BB 都跟注（三人底池）',
    hero: ['A♣', 'T♦'],
    board: ['T♠', '7♥', '4♣'],
    street: '翻牌',
    pot: '7.5bb',
    history: 'SB、BB 都过牌',
    options: ['下注 2.5bb（1/3 池）', '下注 5.5bb（3/4 池）', '过牌'],
    answer: 0,
    explain:
      '顶对顶踢脚在三人底池里仍然值得要价值，但门槛整体上移：两个对手意味着多一次「有人更强」的机会，所以打三条街大注是不合适的。小注既能从 7x、听牌那里拿到价值，又把底池控制在你能应付的范围。多人底池的钱来自价值，不来自弃牌权益 —— 过牌则漏掉了这条街。',
    tag: 'postflop',
  },
  {
    id: 'S13',
    level: 'L4',
    topic: '浮牌',
    setup: '你在 BTN。对手是 HJ 的常规玩家，你观察到他 c-bet 频率很高但很少开第二枪',
    hero: ['Q♥', 'J♥'],
    board: ['K♠', '6♦', '2♣'],
    street: '翻牌',
    pot: '6.5bb',
    history: 'HJ 下注 2bb',
    options: ['弃牌', '跟注，计划在转牌接管', '加注到 7bb'],
    answer: 1,
    explain:
      '浮牌的收益来自「c-bet 高频、二枪低频」这个具体落差，你已经观察到了。QJ 虽然没中，但有两张高张和后门同花听牌 —— 计划失败时还有出路，这让它比纯空气浮牌好得多。加注则过度：这张牌面对他的范围有利，加注会被 Kx 继续，而你什么都没有。',
    tag: 'postflop',
  },
  {
    id: 'S14',
    level: 'L4',
    topic: '中对在转牌的处理',
    setup: '你在 CO，翻牌 c-bet 被跟注',
    hero: ['9♣', '9♥'],
    board: ['K♠', '7♦', '2♣', '3♥'],
    street: '转牌',
    pot: '9.1bb',
    history: 'BB 过牌',
    options: ['下注 3bb', '下注 6bb', '过牌'],
    answer: 2,
    explain:
      '99 在这里是典型的中对：下注会赶走所有更差的牌（对手的空气会弃），只留下 Kx 和更好的口袋对继续 —— 两头落空。它既要不到价值，也没有需要保护的东西（对手能反超你的 outs 本来就少）。过牌保留摊牌价值，这是中对在转牌的标准处理。',
    tag: 'postflop',
  },
  {
    id: 'S15',
    level: 'L4',
    topic: '延迟 c-bet',
    setup: '你在 CO 开池被 BB 跟注，翻牌你选择过牌',
    hero: ['A♦', 'Q♦'],
    board: ['9♠', '8♠', '6♦', 'A♣'],
    street: '转牌',
    pot: '5.5bb',
    history: 'BB 过牌',
    options: ['过牌', '下注 3.5bb（约 2/3 池）', '下注 8bb（1.5 倍池）'],
    answer: 1,
    explain:
      '翻牌 9♠8♠6♦ 你没有范围优势（实测 CO 胜率 49.7%），过牌是对的。转牌 A 改变了一切：它落进你的范围而几乎不在 BB 的跟注范围里，你现在有顶对顶踢脚。双方翻牌都过牌说明范围都偏弱，这正是延迟 c-bet 最有效的时机。超池则过头，你的坚果优势不足以支撑。',
    tag: 'postflop',
  },
  {
    id: 'S16',
    level: 'L3',
    topic: '面对小注的防守宽度',
    setup: '你在 BB 跟注了 CO 的开池',
    hero: ['8♥', '7♥'],
    board: ['A♠', 'K♦', '4♣'],
    street: '翻牌',
    pot: '5.5bb',
    history: 'CO 下注 1.8bb（1/3 池）',
    options: ['弃牌', '跟注', '加注'],
    answer: 1,
    explain:
      '面对 1/3 池你只需要 25% 胜率，MDF 高达 75%。87s 有后门同花和后门顺子，转牌有相当概率变成真听牌。对手在这张牌面上用整个范围小注，正是因为大量对手对小注防守不足 —— 弃掉这类有后门权益的牌，就是在为他的策略买单。加注则没有依据：这张牌面明显对他有利。',
    tag: 'postflop',
  },
]
