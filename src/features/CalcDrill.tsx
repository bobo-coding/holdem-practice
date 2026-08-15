import { useEffect, useState } from 'preact/hooks'
import { GENERATORS, type GeneratorId, type GenQuestion } from '../data/generators'
import { addMistake, recordDrill } from '../lib/storage'

export function CalcDrill({ id }: { id: GeneratorId }) {
  const cfg = GENERATORS[id]
  const [q, setQ] = useState<GenQuestion>(() => cfg.gen())
  const [picked, setPicked] = useState<number | null>(null)
  const [stats, setStats] = useState({ n: 0, ok: 0, streak: 0, best: 0 })
  const [start, setStart] = useState(() => Date.now())
  const [now, setNow] = useState(start)

  useEffect(() => {
    if (!cfg.timed || picked !== null) return
    const t = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(t)
  }, [cfg.timed, picked, q])

  const elapsed = (now - start) / 1000

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
    recordDrill(id, correct, streak)
    if (!correct) addMistake({ id: `${id}:${q.key}`, tag: q.tag, prompt: q.prompt })
  }

  function next() {
    setPicked(null)
    setQ(cfg.gen())
    const t = Date.now()
    setStart(t)
    setNow(t)
  }

  return (
    <div>
      <div class="card">
        <div class="row">
          <b style="font-size:15px">{cfg.name}</b>
          {cfg.timed && (
            <span class="tag" style={elapsed > 10 ? 'color:var(--warn)' : ''}>
              {elapsed.toFixed(1)}s
            </span>
          )}
        </div>

        <p style="margin:14px 0 4px;font-size:16px">{q.prompt}</p>
        {q.facts?.map((f) => (
          <div key={f} class="muted">
            {f}
          </div>
        ))}

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
              {cfg.timed && ` · 用时 ${elapsed.toFixed(1)}s`}
            </div>
            <div class="key" style="margin-top:10px">
              <b>解算</b>
              {q.explain}
            </div>
            <div class="btns">
              <button class="btn primary" onClick={next}>
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

      {cfg.timed && (
        <div class="card">
          <div class="muted">
            目标：5 秒内答对。实战中你没有时间做除法，靠的是把常见尺度的必要胜率背成反射
            —— 1/3 池 20%、1/2 池 25%、2/3 池 29%、满池 33%。
          </div>
        </div>
      )}
    </div>
  )
}
