/** 课程元数据：11 级 116 课，与 docs/curriculum.md 保持一致 */

export interface LessonMeta {
  id: string
  title: string
}

export interface Level {
  id: string
  name: string
  /** 出师标准，可量化 */
  gate: string
  lessons: LessonMeta[]
}

const lv = (id: string, name: string, gate: string, titles: string[]): Level => ({
  id,
  name,
  gate,
  lessons: titles.map((title, i) => ({ id: `${id}-${String(i + 1).padStart(2, '0')}`, title })),
})

export const LEVELS: Level[] = [
  lv('L0', '地基：规则与语言', '术语与牌型测验 100%', [
    '牌桌构成、盲注、行动顺序',
    '牌型大小与比牌规则',
    '位置：BTN/CO/HJ/LJ/UTG/SB/BB 与位置价值',
    '下注结构：limp / raise / 3bet / 4bet / 5bet',
    '四条街的划分与各自的决策性质',
    '常用术语表（中英对照）',
    '现金局 vs 锦标赛的根本差异',
    '一手牌完整走读',
  ]),
  lv('L1', '翻前基础', '范围训练器准确率 ≥ 90%', [
    '起手牌分类：对子 / 同花连张 / Ax / 破牌',
    '13×13 范围矩阵读法与写法',
    '位置对开池范围的影响（RFI 表）',
    '面对开池：3bet / call / fold 的划分逻辑',
    '极化 3bet vs 线性 3bet',
    '4bet / 5bet 与全下阈值',
    '冷跟注（cold call）何时成立',
    '盲注防守：BB 范围与底池赔率',
    'SB 策略：limp 体系 vs 纯 raise 体系',
    '筹码深度对翻前的影响',
    'Squeeze 与多人底池翻前',
    '翻前常见 leak 清单',
  ]),
  lv('L2', '扑克数学', '赔率 / EV 限时测验 ≥ 85%', [
    'Outs 与 4-2 法则',
    '底池赔率与必要胜率',
    'Equity：手牌 vs 手牌、手牌 vs 范围',
    '隐含赔率与反向隐含赔率',
    'EV 公式与手算流程',
    '弃牌率盈亏平衡点（breakeven bluff %）',
    'MDF 最小防守频率与 α',
    '价值下注的盈亏平衡',
    '组合数学：blockers 与 combos 计数',
    '方差、标准差与样本量直觉',
  ]),
  lv('L3', '翻后基础（Flop）', 'Flop 决策训练 ≥ 75%', [
    '牌面结构分类：干燥 / 湿润 / 连牌 / 同花面 / 配对面',
    '范围优势 vs 坚果优势',
    'C-bet 的判断框架',
    '下注尺度体系：33% / 50% / 75% / 125%+',
    '有位 vs 无位的差异',
    '面对 c-bet：跟注 / 加注 / 弃牌的构建',
    '听牌的打法与半诈唬频率',
    '慢打的正确与错误场景',
    '多人底池的收缩原则',
    'Check-raise 体系',
    '顶对类牌的街数规划',
    '保护 vs 不需要保护',
    '弃牌权益估算',
    'Flop 常见错误清单',
  ]),
  lv('L4', '进阶翻后（Turn / River）', '转河决策训练 ≥ 70%', [
    'Turn 牌面变化分类',
    '二枪（double barrel）的选择标准',
    '转牌尺度放大与极化',
    '延迟 c-bet',
    '浮牌（float）与偷底池',
    'Blockers / unblockers 在诈唬选择中的应用',
    'River 价值下注：薄价值的边界',
    'River 诈唬：频率、组合选择、尺度',
    '面对 river 大注的 bluff-catch 决策',
    '河牌加注与超池下注',
    '无位的检查-跟注范围构建',
    '全街下注树的心智模型',
    '单挑与三人底池的差异',
    '转河常见错误清单',
  ]),
  lv('L5', '读牌与对手建模', '范围推断题 ≥ 70%', [
    '范围构建：逐街收窄',
    'Hand reading 五步法',
    '玩家分类：TAG / LAG / 鱼 / 岩石 / 疯子',
    '核心统计：VPIP / PFR / AF / 3bet% / WTSD',
    'HUD 读法与样本量陷阱',
    '下注尺度中的信息泄漏',
    '时序 tells 与生理 tells',
    '笔记系统',
    '反向读牌：我的范围在对手眼里',
    '桌面动态与形象管理',
  ]),
  lv('L6', 'GTO 与剥削', '频率题 + 偏离题 ≥ 70%', [
    '纳什均衡在扑克中的含义',
    '无差异点与混合策略',
    '为什么要谈频率而不是「这手怎么打」',
    'Solver 输出的读法',
    '简化策略树：把 solver 压缩成可执行规则',
    '从 GTO 偏离：leak → 调整对照表',
    '对手过度弃牌：加大诈唬',
    '对手跟太多：砍诈唬、加薄价值',
    '被剥削的风险与还原',
    '节点锁定思路',
    '何时 GTO、何时剥削',
    '常见「伪 GTO」误解澄清',
  ]),
  lv('L7', '锦标赛', 'ICM / Push-Fold ≥ 85%', [
    'MTT 结构、M 值与筹码深度',
    'Ante 对策略的影响',
    '短筹码 Push/Fold 与 Nash 表',
    '中等筹码的 re-shove 范围',
    'ICM 基础：筹码 ≠ 金钱',
    '泡沫期策略与 ICM 压力',
    '最终桌：奖金跳跃与节奏切换',
    '大筹码的施压打法',
    'Satellite 的特殊策略',
    '重买 / 增购 / 后期注册的 EV',
    'SNG 与 Spin 的差异',
    'MTT 常见错误清单',
  ]),
  lv('L8', '现金局深度打法', '深筹码 spot ≥ 70%', [
    '100bb 与 200bb+ 的策略差异',
    'Straddle / 有 limper 桌的调整',
    '桌选择与座位选择',
    'Rake 对策略的实际影响',
    '多桌管理与决策简化',
    'Zoom / 快速桌的调整',
    '线下现金局的节奏差异',
    '从微额到中额的升级路线',
  ]),
  lv('L9', '心态与资金管理', '完成 30 天 session 日志', [
    'Bankroll 规则',
    '方差的真实感受与下行区间',
    'Tilt 识别与分类',
    'Tilt 应对流程与离桌规则',
    'Session 准备与结束仪式',
    'A / B / C 游戏自我评估',
    '复盘流程标准化',
    '学习循环：输入 → 练习 → 实战 → 复盘',
  ]),
  lv('L10', '职业化工作流', '独立完成一次 leak 复盘报告', [
    '数据库工具（PT4 / HM3）基础',
    '关键报表与筛选器',
    'Leak finding 方法论',
    'Solver 使用流程',
    '每周训练计划模板',
    '目标设定与 KPI',
    '常见 leak 库与对应练习',
    '独立复盘报告：从数据到行动项',
  ]),
]

export const TOTAL_LESSONS = LEVELS.reduce((n, l) => n + l.lessons.length, 0)

export function findLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id)
}

export function findLesson(id: string): { level: Level; lesson: LessonMeta } | undefined {
  for (const level of LEVELS) {
    const lesson = level.lessons.find((x) => x.id === id)
    if (lesson) return { level, lesson }
  }
  return undefined
}
