import { useState } from 'preact/hooks'
import {
  classify,
  randomFlop,
  SUIT_LABEL,
  CONN_LABEL,
  WET_LABEL,
  type Texture,
} from '../lib/board'
import { FLOPS } from '../data/flops'
import { Cards } from './Cards'
import { addMistake, recordDrill } from '../lib/storage'

const DRILL_ID = 'texture'

interface Q {
  board: string[]
  prompt: string
  options: string[]
  answer: number
  explain: string
  key: string
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function build(board: string[], t: Texture, kind: 'suit' | 'conn' | 'wet'): Q {
  if (kind === 'suit') {
    const opts = ['rainbow', 'twoTone', 'monotone'] as const
    return {
      board,
      prompt: '这个牌面的花色结构是？',
      options: opts.map((o) => SUIT_LABEL[o]),
      answer: opts.indexOf(t.suitPattern),
      explain: `${SUIT_LABEL[t.suitPattern]}。花色结构决定同花听牌的存在与数量，是判断干湿的第一个维度。`,
      key: `suit:${board.join('')}`,
    }
  }
  if (kind === 'conn') {
    const opts = ['connected', 'semi', 'disconnected'] as const
    const vals = t.cards.map((c) => c.val).sort((a, b) => a - b)
    const span = vals[2]! - vals[0]!
    return {
      board,
      prompt: '这个牌面的连接性是？',
      options: opts.map((o) => CONN_LABEL[o]),
      answer: opts.indexOf(t.connectivity),
      explain: t.paired
        ? '配对面按断张处理：它的顺子可能性很低，真正改变下注树的是葫芦而不是听牌。'
        : `三张牌的跨度是 ${span}${vals.includes(12) ? '（A 也可当 1 再算一次，取更小的跨度）' : ''}。跨度 ≤4 是连接，5–6 是半连接，再宽是断张。`,
      key: `conn:${board.join('')}`,
    }
  }
  const opts = ['dry', 'medium', 'wet'] as const
  return {
    board,
    prompt: '按本课的打分规则，这个牌面属于？',
    options: opts.map((o) => WET_LABEL[o]),
    answer: opts.indexOf(t.wetness),
    explain: t.reasons.length
      ? `判定为「${WET_LABEL[t.wetness]}」。${t.reasons.join('；')}。`
      : `判定为「${WET_LABEL[t.wetness]}」。彩虹 + 断张 + 大牌不足两张，一分未得 —— 对手在这个面上几乎没有听牌可以反击你。`,
    key: `wet:${board.join('')}`,
  }
}

/** 用预计算数据出「谁有范围优势」的题 */
function buildAdvantage(): Q {
  const f = FLOPS[Math.floor(Math.random() * FLOPS.length)]!
  const askNut = Math.random() < 0.4
  if (askNut) {
    const coMore = f.coStrong > f.bbStrong
    const options = ['CO（翻前加注者）', 'BB（跟注方）', '两边几乎相同']
    const gap = Math.abs(f.coStrong - f.bbStrong)
    const answer = gap < 0.6 ? 2 : coMore ? 0 : 1
    return {
      board: f.board,
      prompt: 'CO 开池、BB 跟注。这个翻牌上谁的坚果优势更大（两对以上的组合更多）？',
      options,
      answer,
      explain: `实测两对以上的组合占比：CO ${f.coStrong}%，BB ${f.bbStrong}%。坚果优势决定的是能不能用大尺度下注 —— 注意它和范围优势可以指向相反的方向。`,
      key: `nut:${f.board.join('')}`,
    }
  }
  const options = ['CO 有明显范围优势（≥55%）', 'CO 略有优势（51–55%）', '几乎没有优势（≤51%）']
  const answer = f.coEq >= 55 ? 0 : f.coEq > 51 ? 1 : 2
  return {
    board: f.board,
    prompt: 'CO 开池、BB 跟注。CO 在这个翻牌上的范围优势有多大？',
    options,
    answer,
    explain: `实测 CO 胜率 ${f.coEq}%。${
      f.coEq >= 55
        ? '范围优势明显，可以高频下注。'
        : f.coEq > 51
          ? '优势有限，需要降低频率并控制尺度。'
          : '几乎没有优势，这类牌面上正确的反应是大量过牌，而不是习惯性 c-bet。'
    }`,
    key: `adv:${f.board.join('')}`,
  }
}

function nextQ(): Q {
  const r = Math.random()
  if (r < 0.35) return buildAdvantage()
  const board = randomFlop()
  const t = classify(board)
  const kind = shuffled(['suit', 'conn', 'wet'] as const)[0]!
  return build(board, t, kind)
}

export function TextureDrill() {
  const [q, setQ] = useState<Q>(nextQ)
  const [picked, setPicked] = useState<number | null>(null)
  const [stats, setStats] = useState({ n: 0, ok: 0, streak: 0, best: 0 })

  function choose(n: number) {
    if (picked !== null) return
    setPicked(n)
    const correct = n === q.answer
    const streak = correct ? stats.streak + 1 : 0
    setStats((s) => ({
      n: s.n + 1,
      ok: s.ok + (correct ? 1 : 0),
      streak,
      best: Math.max(s.best, streak),
    }))
    recordDrill(DRILL_ID, correct, streak)
    if (!correct)
      addMistake({ id: `${DRILL_ID}:${q.key}`, tag: 'postflop', prompt: `${q.board.join(' ')} — ${q.prompt}` })
  }

  return (
    <div>
      <div class="card">
        <div class="hand" style="margin:8px 0 16px">
          <Cards cards={q.board} size="lg" />
        </div>
        <p style="margin:4px 0 8px;font-size:16px">{q.prompt}</p>

        {q.options.map((opt, n) => {
          let style = ''
          if (picked !== null) {
            if (n === q.answer) style = 'border-color:var(--accent);color:var(--accent)'
            else if (n === picked) style = 'border-color:var(--bad);color:var(--bad)'
          }
          return (
            <div class="btns" key={opt} style="margin:8px 0">
              <button class="btn" style={style} onClick={() => choose(n)}>
                {opt}
              </button>
            </div>
          )
        })}

        {picked !== null && (
          <>
            <div class={`verdict ${picked === q.answer ? 'ok' : 'no'}`}>
              {picked === q.answer ? '✓ 正确' : '✗ 错误'}
            </div>
            <div class="key" style="margin-top:10px">
              <b>解析</b>
              {q.explain}
            </div>
            <div class="btns">
              <button
                class="btn primary"
                onClick={() => {
                  setPicked(null)
                  setQ(nextQ())
                }}
              >
                下一题
              </button>
            </div>
          </>
        )}

        <div class="stats">
          <span class="tag">
            {stats.ok}/{stats.n} 正确
          </span>
          <span class="tag">连对 {stats.streak}</span>
          <span class="tag">最佳 {stats.best}</span>
        </div>
      </div>

      <div class="card">
        <div class="muted">
          范围优势类题目的数字来自 CO 开池范围 vs BB 跟注范围的实际模拟（每个牌面 30 万次），
          不是估计值。结构类题目的牌面是随机发的。
        </div>
      </div>
    </div>
  )
}
