import { useState } from 'preact/hooks'
import { SPOTS, type Spot } from '../data/spots'
import { Cards } from './Cards'
import { addMistake, recordDrill } from '../lib/storage'

const DRILL_ID = 'spot'

function pickSpot(exclude?: string): Spot {
  const pool = SPOTS.filter((s) => s.id !== exclude)
  return pool[Math.floor(Math.random() * pool.length)]!
}

export function SpotTrainer() {
  const [spot, setSpot] = useState<Spot>(() => pickSpot())
  const [picked, setPicked] = useState<number | null>(null)
  const [stats, setStats] = useState({ n: 0, ok: 0, streak: 0, best: 0 })

  function choose(n: number) {
    if (picked !== null) return
    setPicked(n)
    const correct = n === spot.answer
    const streak = correct ? stats.streak + 1 : 0
    setStats((s) => ({
      n: s.n + 1,
      ok: s.ok + (correct ? 1 : 0),
      streak,
      best: Math.max(s.best, streak),
    }))
    recordDrill(DRILL_ID, correct, streak)
    if (!correct)
      addMistake({
        id: `${DRILL_ID}:${spot.id}`,
        tag: spot.tag,
        prompt: `${(spot.board.length ? spot.board : spot.hero).join(' ')} — ${spot.topic}`,
      })
  }

  return (
    <div>
      <div class="card">
        <div class="row">
          <span class="tag">{spot.level}</span>
          <span class="muted" style="font-size:13px">
            {spot.format ?? '6-max · 0.5/1 · 100bb'}
          </span>
        </div>

        <div class="spot-setup">{spot.setup}</div>

        <div class="row" style="margin:14px 0 6px">
          <span class="muted">你的手牌</span>
          <Cards cards={spot.hero} size="lg" />
        </div>

        <div class="spot-board">
          <div class="row">
            <span class="muted">{spot.street}</span>
            <span class="tag">底池 {spot.pot}</span>
          </div>
          {spot.board.length > 0 && (
            <div style="margin-top:8px">
              <Cards cards={spot.board} size="lg" />
            </div>
          )}
        </div>

        <div class="spot-history">{spot.history}</div>

        <p style="margin:14px 0 4px;font-size:16px">轮到你了。怎么打？</p>

        {spot.options.map((opt, n) => {
          let style = ''
          if (picked !== null) {
            if (n === spot.answer) style = 'border-color:var(--accent);color:var(--accent)'
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
            <div class={`verdict ${picked === spot.answer ? 'ok' : 'no'}`}>
              {picked === spot.answer ? '✓ 正确' : '✗ 错误'}
            </div>
            <div class="key" style="margin-top:10px">
              <b>{spot.topic}</b>
              {spot.explain}
            </div>
            <div class="btns">
              <button
                class="btn primary"
                onClick={() => {
                  setPicked(null)
                  setSpot(pickSpot(spot.id))
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
          共 {SPOTS.length} 个局面，覆盖 L3–L4 翻后与 L8 深筹码的核心概念。解析里引用的范围数据均来自实际模拟。
        </div>
      </div>
    </div>
  )
}
