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
import { parseRange, rangePercent, gridCodes, comboCount, compare } from '../src/lib/range'
import { classify, randomFlop } from '../src/lib/board'
import { oddsQuestion, evQuestion, comboQuestion } from '../src/data/generators'

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
  }
  ok(`${name} ${N} 题，含独立复算`)
}

// ---------------------------------------------------------------- 结果

console.log(
  failures === 0 ? '\n全部校验通过\n' : `\n${failures} 处问题\n`,
)
process.exit(failures === 0 ? 0 : 1)
