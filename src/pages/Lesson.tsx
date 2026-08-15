import { useState } from 'preact/hooks'
import { findLesson } from '../data/curriculum'
import { LESSONS } from '../content/lessons'
import type { Block, Question } from '../content/types'
import { findTable, POSITION_LABEL } from '../data/ranges'
import { parseRange } from '../lib/range'
import { RangeGrid } from '../features/RangeGrid'
import { addMistake, markLesson } from '../lib/storage'
import { navigate } from '../lib/router'

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case 'h':
      return <h2>{b.text}</h2>
    case 'p':
      return <p>{b.text}</p>
    case 'list':
      return b.ordered ? (
        <ol>
          {b.items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
      ) : (
        <ul>
          {b.items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      )
    case 'key':
      return (
        <div class="key">
          <b>{b.title}</b>
          {b.text}
        </div>
      )
    case 'warn':
      return (
        <div class="warn">
          <b>⚠ {b.title}</b>
          {b.text}
        </div>
      )
    case 'table':
      return (
        <table class="t">
          <thead>
            <tr>
              {b.head.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'range': {
      const table = findTable(b.tableId)
      if (!table) return null
      return (
        <RangeGrid
          inRange={parseRange(table.ranges[b.position])}
          label={POSITION_LABEL[b.position]}
        />
      )
    }
    case 'replay':
      return (
        <div class="replay">
          <div class="muted setup">{b.setup}</div>
          <div class="row hero">
            <span class="muted">你的手牌</span>
            <Cards cards={b.hero} big />
          </div>
          {b.steps.map((s, i) => (
            <div class="step" key={i}>
              <div class="row">
                <b>{s.street}</b>
                {s.pot && <span class="tag">底池 {s.pot}</span>}
              </div>
              {s.board && <Cards cards={s.board} />}
              <div class="act">{s.action}</div>
              {s.note && <div class="note">{s.note}</div>}
            </div>
          ))}
        </div>
      )
  }
}

const RED = ['♦', '♥']

function Cards({ cards, big }: { cards: string[]; big?: boolean }) {
  return (
    <div class={`cards${big ? ' big' : ''}`}>
      {cards.map((c, i) => (
        <span key={i} class={`mini${RED.some((s) => c.includes(s)) ? ' red' : ''}`}>
          {c}
        </span>
      ))}
    </div>
  )
}

function Quiz({ questions, lessonId }: { questions: Question[]; lessonId: string }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [ok, setOk] = useState(0)
  const [done, setDone] = useState(false)
  const q = questions[i]

  if (done || !q) {
    const score = Math.round((ok / questions.length) * 100)
    return (
      <div class="card">
        <div class="verdict ok">小测完成 · {score} 分</div>
        <div class="muted" style="text-align:center">
          答对 {ok} / {questions.length}
        </div>
        <div class="btns">
          <button class="btn ghost" onClick={() => navigate('/')}>
            回到目录
          </button>
          <button class="btn primary" onClick={() => navigate('/drills/rfi')}>
            去练习
          </button>
        </div>
      </div>
    )
  }

  function choose(n: number) {
    if (picked !== null || !q) return
    setPicked(n)
    if (n === q.answer) setOk((v) => v + 1)
    else addMistake({ id: q.id, tag: q.tag, prompt: q.prompt })
  }

  function next() {
    if (i + 1 >= questions.length) {
      markLesson(lessonId, Math.round((ok / questions.length) * 100))
      setDone(true)
    } else {
      setI(i + 1)
      setPicked(null)
    }
  }

  return (
    <div class="card">
      <div class="row">
        <b>出师小测</b>
        <span class="tag">
          {i + 1} / {questions.length}
        </span>
      </div>
      <p style="margin:12px 0">{q.prompt}</p>
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
          <div class={`key`} style="margin-top:12px">
            <b>{picked === q.answer ? '答对了' : '解析'}</b>
            {q.explain}
          </div>
          <div class="btns">
            <button class="btn primary" onClick={next}>
              {i + 1 >= questions.length ? '完成' : '下一题'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function LessonPage({ id }: { id: string }) {
  const meta = findLesson(id)
  const content = LESSONS[id]
  if (!meta || !content) return <div class="card">这一课的正文还没上线。</div>

  return (
    <>
      <div class="topbar">
        <span class="back" onClick={() => navigate(`/level/${meta.level.id}`)}>
          ‹ {meta.level.id}
        </span>
        <h1 style="font-size:17px">{meta.lesson.title}</h1>
      </div>

      <div class="lesson">
        <div class="goal">本课目标：{content.goal}</div>
        {content.blocks.map((b, i) => (
          <BlockView key={i} b={b} />
        ))}
      </div>

      <div style="height:20px" />
      <Quiz questions={content.quiz} lessonId={id} />
    </>
  )
}
