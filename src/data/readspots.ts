import { RFI_6MAX, BB_CALL_VS_CO } from './ranges'

/**
 * 范围推断题：给出行动线，玩家在矩阵上画出对手的范围。
 *
 * 翻前题的标准答案直接来自范围表（有据可查）。
 * 翻后题的标准答案是简化模型 —— 由「翻前范围 + 该牌面上能继续的牌」推导，
 * 每题都写出推导过程，玩家可以自己验证，而不是被要求背一个数字。
 */
export interface ReadSpot {
  id: string
  title: string
  scenario: string
  /** 要画的是谁的什么范围 */
  ask: string
  answer: string
  /** 推导过程 */
  reasoning: string[]
  /** 达到多少重合度算过关 */
  pass: number
  nature: 'table' | 'derived'
}

export const READ_SPOTS: ReadSpot[] = [
  {
    id: 'R01',
    title: 'UTG 开池',
    scenario: '6-max 现金局，100bb。所有人弃牌到 UTG，他加注到 2.5bb。',
    ask: '画出 UTG 的开池范围',
    answer: RFI_6MAX.ranges.UTG,
    reasoning: [
      '这是最基础的一题：范围直接来自 RFI 表。',
      'UTG 身后还有 5 个人，每一个都可能 3bet，所以范围必须紧。',
      '边界在 A7s、K9s、QTs、JTs、98s、ATo、KQo 附近 —— 记边界比记中心重要。',
    ],
    pass: 70,
    nature: 'table',
  },
  {
    id: 'R02',
    title: 'BTN 开池',
    scenario: '所有人弃牌到 BTN，他加注到 2.5bb。',
    ask: '画出 BTN 的开池范围',
    answer: RFI_6MAX.ranges.BTN,
    reasoning: [
      'BTN 只需要越过两个盲注，而且翻后永远有位置。',
      '范围宽到约 44% —— 几乎是 UTG 的三倍。',
      '注意不同花的部分：A2o+、K8o+、Q9o+、J9o+、T9o、98o 都在里面，这是很多人画得过窄的地方。',
    ],
    pass: 65,
    nature: 'table',
  },
  {
    id: 'R03',
    title: 'BB 跟注 CO 开池',
    scenario: 'CO 加注到 2.5bb，SB 弃牌，BB 跟注。',
    ask: '画出 BB 的跟注范围（不含他会 3bet 的部分）',
    answer: BB_CALL_VS_CO.notation,
    reasoning: [
      '关键是「跟注」这个动作本身排除了最强的一段 —— QQ+、AK 这些牌走的是 3bet 那条线。',
      '所以这个范围虽然很宽（同花牌几乎全在），但上限被削，JJ 以上基本不在里面。',
      '这就是 L3-02 说的「BB 范围天然封顶」，也是 CO 在大牌面上有巨大范围优势的原因。',
    ],
    pass: 60,
    nature: 'table',
  },
  {
    id: 'R04',
    title: '面对 UTG 开池的 3bet',
    scenario: 'UTG 开池 2.5bb，你在 BTN。一个稳健的常规玩家在 SB 3bet 到 10bb。',
    ask: '画出 SB 的 3bet 范围',
    answer: 'QQ+, AKs, AKo, AQs, A5s-A4s, KQs',
    reasoning: [
      'SB 无位置且面对 UTG 的紧范围，3bet 必须极化：强价值 + 少量有阻断牌的诈唬。',
      '价值部分：QQ+ 和 AK。JJ、AQo 这类中等牌在面对 UTG 时更适合弃牌或跟注 —— 3bet 它们会赶走更弱的、留下更强的。',
      '诈唬部分：A5s、A4s 阻断 AA/AK，同时保留同花和轮子顺的翻身能力；KQs 是可玩性最好的边缘牌之一。',
      '这是一个典型范围，不同体系会有出入，重点是形状（两头有、中间空）而不是具体某一手。',
    ],
    pass: 55,
    nature: 'derived',
  },
  {
    id: 'R05',
    title: '4bet 范围',
    scenario: '你在 CO 开池，BTN 3bet 到 8bb。你 4bet 到 20bb，他全下 100bb。',
    ask: '画出他全下（5bet）的范围',
    answer: 'KK+, AKs, AKo',
    reasoning: [
      '100bb 深度下 5bet 就是全下，需要能面对你的跟注范围。',
      '这个范围极窄：KK、AA 是纯价值，AK 是价值兼半诈唬。',
      'QQ 和 AKo 在部分体系里会变成跟注或弃牌，取决于对手的 4bet 频率。',
      '实战意义：面对 5bet 全下，你需要极强的牌才能跟 —— 这正是 L1-06 说的「跟注 4bet 是陷阱选项」的另一面。',
    ],
    pass: 55,
    nature: 'derived',
  },
  {
    id: 'R06',
    title: '翻牌跟注后的范围',
    scenario: 'CO 开池，BB 跟注。翻牌 K♠ 7♦ 2♣，CO 下注 1/3 池，BB 跟注。',
    ask: '画出 BB 跟注翻牌之后的范围',
    answer: '22, 77, 55-JJ, K2s+, A2s-A9s, Q9s+, J9s+, T9s, 98s, 87s, 76s, K9o+, A9o-AJo',
    reasoning: [
      '从 BB 的翻前跟注范围出发，去掉在这张牌面上完全没有继续理由的牌。',
      '留下的四类：任何 Kx（顶对）；口袋对（77、22 是三条，中等对子有摊牌价值）；带后门听牌的同花牌；有阻断和高张潜力的 Ax。',
      '去掉的：完全落空且没有后门权益的低不同花牌，比如 J8o、T7o、97o 这类。',
      '注意面对 1/3 池的小注，MDF 高达 75% —— 所以这个范围应该相当宽，画得太窄是常见错误。',
      '这是简化模型：真实策略里边缘牌是混合频率，且部分强牌会选择加注而不是跟注。',
    ],
    pass: 45,
    nature: 'derived',
  },
  {
    id: 'R07',
    title: '打完三条街价值的范围',
    scenario:
      'CO 开池被 BB 跟注。翻牌 Q♦ 8♣ 3♥ CO 下注被跟注，转牌 5♠ CO 下注被跟注，河牌 2♦ CO 下注 3/4 池。',
    ask: '画出 CO 河牌下注的价值部分（不含诈唬）',
    answer: 'QQ, 88, 33, 55, 22, AQs, AQo, KQs, KQo, QJs, QTs, AA, KK, JJ, TT, 99',
    reasoning: [
      '三条街的价值下注需要一手能被更差的牌跟注、且经得起加注的牌。',
      '三条：QQ、88、33、55、22 —— 组合数不多但全部在里面。',
      '强顶对：AQ、KQ、QJs、QTs —— 踢脚要够好，弱 Qx 打不了三条街。',
      '超对：99 到 AA。牌面上最大是 Q，所以任何比 Q 大的口袋对都是超对。',
      '不在里面的：中对（88 以下的非成三条部分）、弱 Qx、以及所有听牌落空的牌 —— 后者属于诈唬范围。',
    ],
    pass: 45,
    nature: 'derived',
  },
  {
    id: 'R08',
    title: '河牌加注的范围',
    scenario: '你在河牌下注，一个陌生的常规玩家把你加注到接近全下。牌面 A♥ J♠ 6♦ 4♣ 9♥。',
    ask: '画出他加注的范围（假设他是典型的对手池玩家）',
    answer: 'AA, JJ, 99, 66, 44, AJs, AJo, A9s, T8s, 87s',
    reasoning: [
      'L4-10 的核心结论：绝大多数玩家的河牌加注范围里几乎全是坚果 —— 他们连河牌诈唬下注都不够，更不会诈唬加注。',
      '三条和葫芦：AA、JJ、99、66、44 全在里面。',
      '两对：AJ、A9。这些是这条线路上最典型的价值加注。',
      '成顺：T8s、87s（牌面 A J 9 6 4，需要 T8 或 87 成顺，组合很少）。',
      '这个范围只有几十个组合，而且几乎没有诈唬 —— 这就是为什么默认应该弃掉除坚果外的一切。',
      '注意：如果你观察到这个对手确实会诈唬加注，范围要另算。默认值针对的是陌生对手。',
    ],
    pass: 40,
    nature: 'derived',
  },
]
