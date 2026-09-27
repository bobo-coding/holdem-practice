/**
 * 内容与数据完整性校验。运行：pnpm check
 *
 * 这些检查针对的是「构建能通过、类型也对，但内容是错的」这一类问题：
 * 课号对不上大纲、题目正确答案越界、课程引用了不存在的预计算数据、
 * 范围记法解析成空集、spot 里手牌和公牌重复……
 * 这类错误不会让编译失败，只会让用户看到一个静默出错的页面。
 */
import { LESSONS } from '../src/content/lessons'
import { LEVELS } from '../src/data/curriculum'
import { SPOTS } from '../src/data/spots'
import { READ_SPOTS } from '../src/data/readspots'
import { FLOPS } from '../src/data/flops'
import { TURNS, BLOCKERS } from '../src/data/postflop'
import { RANGE_TABLES, SIMPLE_RANGES, POSITIONS } from '../src/data/ranges'
import {
  parseRange,
  rangePercent,
  gridCodes,
  comboCount,
  compare,
  normalizeHand,
} from '../src/lib/range'
import { EQ_VS_RANDOM } from '../src/data/strength'
import { classify, randomFlop } from '../src/lib/board'
import {
  oddsQuestion,
  evQuestion,
  comboQuestion,
  freqQuestion,
  exploitQuestion,
  icmQuestion,
} from '../src/data/generators'
import { PUSHFOLD } from '../src/data/pushfold'
import { icm, callThreshold } from '../src/lib/icm'

let failures = 0
const fail = (m: string) => {
  console.log(`  ✗ ${m}`)
  failures++
}
const ok = (m: string) => console.log(`  ✓ ${m}`)
const section = (t: string) => console.log(`\n${t}`)

// ---------------------------------------------------------------- 范围记法

section('范围记法')
{
  const eq = (name: string, a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b)
      ? ok(name)
      : fail(`${name}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`)

  eq('22+ 展开为 13 手', parseRange('22+').size, 13)
  eq('K9s+ 展开正确', [...parseRange('K9s+')].sort(), ['K9s', 'KJs', 'KQs', 'KTs'])
  eq('A2s+ 含 AKs', parseRange('A2s+').has('AKs'), true)
  eq('KTs+ 不含 AKs', parseRange('KTs+').has('AKs'), false)
  eq('T9s+ 只有 T9s', [...parseRange('T9s+')], ['T9s'])
  eq('区间两端顺序无关', [...parseRange('22-JJ')].sort(), [...parseRange('JJ-22')].sort())
  eq('网格 169 格', gridCodes().flat().length, 169)
  eq(
    '总组合 1326',
    gridCodes()
      .flat()
      .reduce((n, c) => n + comboCount(c), 0),
    1326,
  )
  eq('全选 = 100%', Math.round(rangePercent(new Set(gridCodes().flat()))), 100)
  eq('查表输入 k2o', normalizeHand('k2o'), 'K2o')
  eq('查表输入顺序无关', normalizeHand('2Ks'), 'K2s')
  eq('查表输入 10 当 T', normalizeHand('A10s'), 'ATs')
  eq('查表输入对子', normalizeHand(' 77 '), '77')
  eq('非对子缺 s/o 拒绝', normalizeHand('AK'), null)
  eq('对子带 s 拒绝', normalizeHand('77s'), null)
  eq('非法点数拒绝', normalizeHand('A1o'), null)
}

section('起手牌强弱度')
{
  const codes = gridCodes().flat()
  if (codes.some((c) => typeof EQ_VS_RANDOM[c] !== 'number')) fail('强弱度数据不全')
  const sorted = [...codes].sort((a, b) => EQ_VS_RANDOM[b]! - EQ_VS_RANDOM[a]!)
  if (sorted[0] !== 'AA') fail(`最强应为 AA，实际 ${sorted[0]}`)
  if (sorted.at(-1) !== '32o') fail(`最弱应为 32o，实际 ${sorted.at(-1)}`)
  // 同点数同花永远强于不同花
  for (const c of codes)
    if (c.endsWith('s') && !(EQ_VS_RANDOM[c]! > EQ_VS_RANDOM[c.slice(0, 2) + 'o']!))
      fail(`${c} 应强于 ${c.slice(0, 2)}o`)
  // 对子按点数单调
  const pairs = codes.filter((c) => c.length === 2)
  for (let i = 1; i < pairs.length; i++)
    if (!(EQ_VS_RANDOM[pairs[i - 1]!]! > EQ_VS_RANDOM[pairs[i]!]!)) fail(`${pairs[i - 1]} 应强于 ${pairs[i]}`)
  ok(`169 手：AA ${EQ_VS_RANDOM.AA}% … 32o ${EQ_VS_RANDOM['32o']}%，同花 > 不同花、对子单调`)
}

// ---------------------------------------------------------------- 范围表

section('范围表')
for (const t of RANGE_TABLES) {
  for (const p of POSITIONS) {
    const set = parseRange(t.ranges[p])
    if (set.size === 0) fail(`${t.id} 的 ${p} 解析为空`)
  }
  if (t.nature === 'simplified' && !t.caveat) fail(`${t.id} 标为 simplified 却没写 caveat`)
  if (!t.conditions) fail(`${t.id} 缺适用条件`)
}
ok(
  `${RANGE_TABLES.length} 张位置表：` +
    POSITIONS.map((p) => `${p} ${rangePercent(parseRange(RANGE_TABLES[0]!.ranges[p])).toFixed(1)}%`).join('  '),
)
for (const r of SIMPLE_RANGES) {
  const set = parseRange(r.notation)
  if (set.size === 0) fail(`${r.id} 解析为空`)
  if (r.nature === 'simplified' && !r.caveat) fail(`${r.id} 标为 simplified 却没写 caveat`)
  ok(`${r.id} ${rangePercent(set).toFixed(1)}%`)
}

// ---------------------------------------------------------------- 重合度

section('重合度评分')
{
  const a = parseRange('22+, ATs+, AJo+')
  if (Math.abs(compare(a, a).score - 100) > 0.01) fail('相同范围应为 100%')
  if (compare(new Set(), a).score !== 0) fail('空集应为 0%')
  if (compare(new Set(gridCodes().flat()), a).score >= 100) fail('全选不应得满分')
  let union = 0
  for (const c of a) union += comboCount(c)
  const sub = compare(parseRange('22+'), a)
  if (Math.abs(sub.score - (78 / union) * 100) > 0.01) fail('子集重合度算错')
  ok(`全等 100%，空集 0%，子集 ${sub.score.toFixed(1)}%`)
}

// ---------------------------------------------------------------- 课程

section('课程内容')
{
  const lessonIds = new Set(LEVELS.flatMap((l) => l.lessons.map((x) => x.id)))
  const qids = new Set<string>()
  for (const [id, c] of Object.entries(LESSONS)) {
    if (!lessonIds.has(id)) fail(`${id} 不在大纲里`)
    if (!c.goal) fail(`${id} 缺目标`)
    if (c.blocks.length < 4) fail(`${id} 正文过短`)
    if (c.quiz.length < 3) fail(`${id} 小测不足 3 题`)
    for (const q of c.quiz) {
      if (qids.has(q.id)) fail(`题目 id 重复 ${q.id}`)
      qids.add(q.id)
      if (!q.id.startsWith(id)) fail(`题目 id 与课号不符 ${q.id}`)
      if (q.answer < 0 || q.answer >= q.options.length) fail(`${q.id} answer 越界`)
      if (new Set(q.options).size !== q.options.length) fail(`${q.id} 选项重复`)
      if (!q.explain) fail(`${q.id} 缺解析`)
    }
    for (const b of c.blocks) {
      if (b.t === 'table') {
        for (const r of b.rows) if (r.length !== b.head.length) fail(`${id} 表格列数不齐`)
      }
      // 引用的预计算数据必须存在，否则会静默渲染为空
      if (b.t === 'flops') {
        for (const k of b.boards) {
          if (!FLOPS.some((f) => f.board.join(' ') === k)) fail(`${id} 引用了不存在的翻牌 "${k}"`)
        }
      }
      if (b.t === 'turns' && !TURNS.some((t) => t.flop.join(' ') === b.flop))
        fail(`${id} 引用了不存在的转牌数据 "${b.flop}"`)
      if (
        b.t === 'blockers' &&
        !BLOCKERS.some((x) => x.board.join(' ') === b.board && x.target === b.target)
      )
        fail(`${id} 引用了不存在的阻断数据 "${b.board} / ${b.target}"`)
      if (b.t === 'pushfold') {
        const t = PUSHFOLD.find((x) => x.id === b.tableId)
        if (!t) fail(`${id} 引用了不存在的 Push/Fold 表 "${b.tableId}"`)
        else if (!t.stacks.includes(b.stack)) fail(`${id} Push/Fold 深度 ${b.stack}bb 不在表的网格里`)
      }
      if (b.t === 'range' && !RANGE_TABLES.some((t) => t.id === b.tableId))
        fail(`${id} 引用了不存在的范围表 "${b.tableId}"`)
    }
  }
  const done = LEVELS.map((l) => {
    const n = l.lessons.filter((x) => LESSONS[x.id]).length
    return { id: l.id, n, total: l.lessons.length }
  })
  for (const d of done) {
    if (d.n > 0 && d.n < d.total) fail(`${d.id} 只写了 ${d.n}/${d.total} 课（应整级完成）`)
  }
  ok(
    `${Object.keys(LESSONS).length} 课 / ${qids.size} 题　` +
      done.filter((d) => d.n > 0).map((d) => `${d.id} ${d.n}/${d.total}`).join('  '),
  )
}

// ---------------------------------------------------------------- Spot

section('Spot 局面')
{
  const RANK = 'AKQJT98765432'
  const SUIT = ['♠', '♥', '♦', '♣']
  const ids = new Set<string>()
  for (const s of SPOTS) {
    if (ids.has(s.id)) fail(`spot id 重复 ${s.id}`)
    ids.add(s.id)
    if (s.answer < 0 || s.answer >= s.options.length) fail(`${s.id} answer 越界`)
    if (s.options.length < 3) fail(`${s.id} 选项不足`)
    if (new Set(s.options).size !== s.options.length) fail(`${s.id} 选项重复`)
    if (s.explain.length < 60) fail(`${s.id} 解析过短`)
    const all = [...s.hero, ...s.board]
    for (const c of all)
      if (!RANK.includes(c[0]!) || !SUIT.includes(c.slice(1))) fail(`${s.id} 非法牌 "${c}"`)
    if (new Set(all).size !== all.length) fail(`${s.id} 手牌与公牌重复：${all.join(' ')}`)
    if (s.hero.length !== 2) fail(`${s.id} 手牌不是 2 张`)
    const need = { 翻牌: 3, 转牌: 4, 河牌: 5 }[s.street]
    if (need && s.board.length !== need)
      fail(`${s.id} ${s.street} 应有 ${need} 张公牌，实际 ${s.board.length}`)
  }
  ok(`${SPOTS.length} 个 spot`)
}

section('范围推断题')
for (const s of READ_SPOTS) {
  const set = parseRange(s.answer)
  if (set.size === 0) fail(`${s.id} 标准答案解析为空`)
  if (s.reasoning.length < 3) fail(`${s.id} 推导过程少于 3 条`)
  if (s.pass < 30 || s.pass > 90) fail(`${s.id} 过关线 ${s.pass} 不合理`)
}
ok(
  `${READ_SPOTS.length} 题：` +
    READ_SPOTS.map((s) => `${s.id} ${rangePercent(parseRange(s.answer)).toFixed(0)}%`).join(' '),
)

// ---------------------------------------------------------------- Push/Fold

section('Push/Fold 纳什表')
for (const t of PUSHFOLD) {
  const codes = gridCodes().flat()
  if (Object.keys(t.push).length !== 169 || Object.keys(t.call).length !== 169)
    fail(`${t.id} 不是完整的 169 手`)
  // 已知必然成立的性质：强牌任何深度都全下/跟注；最差的牌只在极浅时全下
  for (const h of ['AA', 'KK', 'AKs', 'AKo']) {
    if (t.push[h] !== 20) fail(`${t.id} ${h} 应在 20bb 内始终全下`)
    if (t.call[h] !== 20) fail(`${t.id} ${h} 应在 20bb 内始终跟注`)
  }
  if (t.push['32o']! > 3) fail(`${t.id} 32o 全下阈值 ${t.push['32o']} 过高`)
  // 全下范围随深度变窄：允许 2 个百分点以内的迭代噪音
  for (let k = 1; k < t.stacks.length; k++) {
    if (t.pushPct[k]! > t.pushPct[k - 1]! + 2) fail(`${t.id} 全下比例在 ${t.stacks[k]}bb 反常上升`)
    if (t.callPct[k]! > t.callPct[k - 1]! + 2) fail(`${t.id} 跟注比例在 ${t.stacks[k]}bb 反常上升`)
  }
  // 阈值表必须能还原出与 pushPct 一致的范围（阈值截断只影响 irregular 手牌）
  const at10 = t.stacks.indexOf(10)
  const n = codes
    .filter((c) => t.push[c]! >= 10 && !t.irregular.includes(c))
    .reduce((a, c) => a + comboCount(c), 0)
  const m = codes
    .filter((c) => !t.irregular.includes(c))
    .reduce((a, c) => a + comboCount(c), 0)
  const irr = 1326 - m
  const got = (n / 1326) * 100
  if (Math.abs(got - t.pushPct[at10]!) > (irr / 1326) * 100 + 0.1)
    fail(`${t.id} 10bb 阈值还原 ${got.toFixed(1)}% 与求解结果 ${t.pushPct[at10]}% 不符`)
  if (t.irregular.length > 10) fail(`${t.id} 非单调手牌 ${t.irregular.length} 个，求解可能没收敛`)
  // ante 让范围更宽
  ok(
    `${t.id}：10bb SB 全下 ${t.pushPct[at10]}% / BB 跟注 ${t.callPct[at10]}%，` +
      `非单调 ${t.irregular.length} 手`,
  )
}
{
  const [a, b] = PUSHFOLD
  const i = a!.stacks.indexOf(10)
  if (!(b!.pushPct[i]! > a!.pushPct[i]!)) fail('有 ante 时全下范围应更宽')
}

// ---------------------------------------------------------------- ICM

section('ICM')
{
  // 独立实现：枚举全部名次排列，逐个算 Harville 概率
  const brute = (stacks: number[], pay: number[]) => {
    const n = stacks.length
    const ev = new Array(n).fill(0)
    const perm = (order: number[], left: number[], prob: number) => {
      if (left.length === 0) {
        order.forEach((p, place) => (ev[p] += prob * (pay[place] ?? 0)))
        return
      }
      const tot = left.reduce((a, i) => a + stacks[i]!, 0)
      for (const i of left)
        perm([...order, i], left.filter((x) => x !== i), (prob * stacks[i]!) / tot)
    }
    perm([], [...stacks.keys()].filter((i) => stacks[i]! > 0), 1)
    return ev
  }
  const cases: [number[], number[]][] = [
    [[5000, 3000, 2000], [50, 30, 20]],
    [[2000, 5000, 1500, 1500], [50, 30, 20]],
    [[30, 25, 20, 15, 10, 8], [40, 25, 15, 10, 6, 4]],
    [[1, 1, 1, 1], [50, 30, 20]],
  ]
  for (const [st, pay] of cases) {
    const a = icm(st, pay)
    const b = brute(st, pay)
    if (a.some((x, i) => Math.abs(x - b[i]) > 1e-9)) fail(`ICM 与枚举实现不符：${st.join('/')}`)
    const sum = a.reduce((x, y) => x + y, 0)
    const want = pay.slice(0, st.length).reduce((x, y) => x + y, 0)
    if (Math.abs(sum - want) > 1e-9) fail(`ICM 总和 ${sum} ≠ 奖池 ${want}`)
  }
  const eq = icm([1, 1, 1, 1], [50, 30, 20])
  if (eq.some((x) => Math.abs(x - 25) > 1e-9)) fail('等筹码应平分奖池')
  const big = icm([5000, 3000, 2000], [50, 30, 20])
  if (!(big[0]! < 50 && big[2]! > 20)) fail('大码 ICM 应低于筹码占比、短码应高于')
  const t = callThreshold([2000, 5000, 1500, 1500], [50, 30, 20], 0, 1)
  if (!(t.need > 0.5 && t.need < 1)) fail(`泡沫跟注阈值 ${t.need} 不合理`)
  ok(`${cases.length} 组与枚举实现一致；泡沫例子跟注需 ${(t.need * 100).toFixed(1)}%`)
}

// ---------------------------------------------------------------- 牌面分类

section('牌面分类器')
{
  const suits = { rainbow: 0, twoTone: 0, monotone: 0 }
  const N = 50000
  for (let i = 0; i < N; i++) {
    const f = randomFlop()
    if (new Set(f).size !== 3) fail(`发出重复牌 ${f.join(' ')}`)
    suits[classify(f).suitPattern]++
  }
  // 理论值：彩虹 39.76%、双色 55.06%、单色 5.18%
  const check = (name: string, got: number, want: number, tol: number) =>
    Math.abs(got - want) > tol ? fail(`${name} ${got.toFixed(2)}% 偏离理论值 ${want}%`) : null
  check('彩虹面', (suits.rainbow / N) * 100, 39.76, 1)
  check('双色面', (suits.twoTone / N) * 100, 55.06, 1)
  check('单色面', (suits.monotone / N) * 100, 5.18, 0.5)
  ok(`${N} 个随机翻牌，花色分布符合理论值`)

  const cases: [string[], string, string][] = [
    [['K♠', '7♦', '2♣'], 'rainbow', 'dry'],
    [['J♠', 'T♠', '9♦'], 'twoTone', 'wet'],
    [['9♠', '6♠', '2♠'], 'monotone', 'medium'],
    [['A♠', 'K♦', 'Q♣'], 'rainbow', 'medium'],
    [['7♠', '7♦', '2♣'], 'rainbow', 'dry'],
  ]
  for (const [board, suit, wet] of cases) {
    const t = classify(board)
    if (t.suitPattern !== suit) fail(`${board.join(' ')} 花色判为 ${t.suitPattern}，应为 ${suit}`)
    if (t.wetness !== wet) fail(`${board.join(' ')} 干湿判为 ${t.wetness}，应为 ${wet}`)
  }
  if (classify(['A♠', '3♦', '2♣']).connectivity !== 'connected') fail('A32 应判为连接（A 可当 1）')
  if (classify(['A♠', '8♦', '3♣']).connectivity !== 'disconnected') fail('A83 应判为断张')
  ok('已知牌面分类符合预期')
}

// ---------------------------------------------------------------- 生成器

section('计算题生成器')
for (const [name, gen] of [
  ['odds', oddsQuestion],
  ['ev', evQuestion],
  ['combo', comboQuestion],
  ['freq', freqQuestion],
  ['exploit', exploitQuestion],
  ['icm', icmQuestion],
] as const) {
  const N = 20000
  for (let i = 0; i < N; i++) {
    const q = gen()
    if (q.answer < 0) fail(`${name}: 正确答案不在选项里 — ${q.prompt}`)
    if (q.options.length < 3) fail(`${name}: 选项只剩 ${q.options.length} 个`)
    if (new Set(q.options).size !== q.options.length) fail(`${name}: 选项重复`)
    if (!q.explain || !q.key || !q.tag) fail(`${name}: 字段缺失`)

    // 独立复算，防止公式和解析各写各的
    if (name === 'odds') {
      const m = q.prompt.match(/底池 (\d+)，对手下注 (\d+)/)!
      const pot = +m[1]!
      const bet = +m[2]!
      const want = ((bet / (pot + 2 * bet)) * 100).toFixed(1) + '%'
      if (q.options[q.answer] !== want) fail(`odds 答案不符: ${q.prompt} → ${q.options[q.answer]} vs ${want}`)
    }
    if (name === 'ev') {
      const be = q.prompt.match(/底池 (\d+)，你诈唬下注 (\d+)/)
      if (be) {
        const want = ((+be[2]! / (+be[1]! + +be[2]!)) * 100).toFixed(1) + '%'
        if (q.options[q.answer] !== want) fail(`ev-be 答案不符: ${q.prompt}`)
      }
      const bl = q.prompt.match(/底池 (\d+)，你用空气牌诈唬下注 (\d+)。你估计对手会弃牌 (\d+)%/)
      if (bl) {
        const ev = (+bl[3]! / 100) * +bl[1]! - (1 - +bl[3]! / 100) * +bl[2]!
        const want = (ev >= 0 ? '+' : '') + ev.toFixed(1)
        if (q.options[q.answer] !== want) fail(`ev-bluff 答案不符: ${q.prompt}`)
      }
    }

    if (name === 'freq') {
      const sizes: Record<string, number> = {
        '1/3 池': 1 / 3, '1/2 池': 1 / 2, '2/3 池': 2 / 3, '3/4 池': 3 / 4, 满池: 1, '2 倍池': 2,
      }
      const lab = Object.keys(sizes).find((k) => q.prompt.includes(`下注 ${k}`))!
      const sz = sizes[lab]!
      const got = q.options[q.answer]!
      if (q.prompt.includes('MDF')) {
        if (got !== ((1 / (1 + sz)) * 100).toFixed(1) + '%') fail(`freq-mdf 答案不符: ${q.prompt}`)
      } else if (q.prompt.includes('诈唬应占')) {
        if (got !== ((sz / (1 + 2 * sz)) * 100).toFixed(1) + '%') fail(`freq-share 答案不符: ${q.prompt}`)
      } else {
        const v = +q.prompt.match(/有 (\d+) 个价值组合/)![1]!
        const b = +got.match(/\d+/)![0]
        // 平衡时对手抓诈唬无差异：b/(v+b) = s/(1+2s)
        if (Math.abs(b / (v + b) - sz / (1 + 2 * sz)) > 0.02) fail(`freq-count 答案不符: ${q.prompt}`)
      }
    }
    if (name === 'exploit') {
      const sizes: Record<string, number> = {
        '1/3 池': 1 / 3, '1/2 池': 1 / 2, '2/3 池': 2 / 3, '3/4 池': 3 / 4, 满池: 1, '2 倍池': 2,
      }
      const lab = Object.keys(sizes).find((k) => q.prompt.includes(`下注 ${k}`))
      const f = q.prompt.match(/弃牌 (\d+)%/)
      const x = q.prompt.match(/诈唬约占 (\d+)%/)
      if (lab && f) {
        const s = sizes[lab]!
        const profitable = +f[1]! / 100 > s / (1 + s)
        if (q.options[q.answer]!.startsWith('增加') !== profitable) fail(`exploit-bluff 方向错: ${q.prompt}`)
      }
      if (lab && x) {
        const s = sizes[lab]!
        const call = +x[1]! / 100 > s / (1 + 2 * s)
        if ((q.options[q.answer] === '跟注') !== call) fail(`exploit-catch 方向错: ${q.prompt}`)
      }
    }
    if (name === 'icm') {
      const bub = q.prompt.match(/你 (\d+)，大码 (\d+) 全下，另外两人 (\d+) 和 (\d+)/)
      if (bub) {
        const st = bub.slice(1, 5).map(Number)
        const r = callThreshold(st, [50, 30, 20], 0, 1)
        if (q.options[q.answer] !== `${Math.round(r.need * 100)}%`) fail(`icm-call 答案不符: ${q.prompt}`)
      }
      const val = q.prompt.match(/A (\d+)、B (\d+)、C (\d+)。按 ICM，([ABC])/)
      if (val) {
        const st = val.slice(1, 4).map(Number)
        const ev = icm(st, [50, 30, 20])['ABC'.indexOf(val[4]!)]!
        if (q.options[q.answer] !== `$${ev.toFixed(1)}`) fail(`icm-value 答案不符: ${q.prompt}`)
      }
    }
  }
  ok(`${name} ${N} 题，含独立复算`)
}

// ---------------------------------------------------------------- 结果

console.log(
  failures === 0 ? '\n全部校验通过\n' : `\n${failures} 处问题\n`,
)
process.exit(failures === 0 ? 0 : 1)
