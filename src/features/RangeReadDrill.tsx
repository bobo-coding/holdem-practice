import { useMemo, useState } from 'preact/hooks'
import { READ_SPOTS, type ReadSpot } from '../data/readspots'
import { parseRange, rangePercent, compare, type HandCode, type Overlap } from '../lib/range'
import { RangePainter, RangeDiff } from './RangePainter'
import { addMistake, recordDrill } from '../lib/storage'

const DRILL_ID = 'readrange'

function pick(exclude?: string): ReadSpot {
  const pool = READ_SPOTS.filter((s) => s.id !== exclude)
  return pool[Math.floor(Math.random() * pool.length)]!
}

export function RangeReadDrill() {
  const [spot, setSpot] = useState<ReadSpot>(() => pick())
  const [selected, setSelected] = useState<Set<HandCode>>(new Set())
  const [result, setResult] = useState<Overlap | null>(null)
  const [stats, setStats] = useState({ n: 0, ok: 0 })

  const answer = useMemo(() => parseRange(spot.answer), [spot])

  function submit() {
    if (result) return
    const r = compare(selected, answer)
    setResult(r)
    const passed = r.score >= spot.pass
    setStats((s) => ({ n: s.n + 1, ok: s.ok + (passed ? 1 : 0) }))
    recordDrill(DRILL_ID, passed, 0)
    if (!passed)
      addMistake({ id: `${DRILL_ID}:${spot.id}`, tag: 'reading', prompt: `${spot.title} — ${spot.ask}` })
  }

  function next() {
    setSpot(pick(spot.id))
    setSelected(new Set())
    setResult(null)
  }

  return (
    <div>
      <div class="card">
        <div class="row">
          <b style="font-size:15px">{spot.title}</b>
          <span class="tag">{spot.nature === 'table' ? '范围表' : '推导'}</span>
        </div>
        <p style="margin:10px 0 6px">{spot.scenario}</p>
        <div class="spot-history">{spot.ask}</div>
      </div>

      <div class="card">
        {result ? (
          <RangeDiff result={result} />
        ) : (
          <RangePainter selected={selected} onChange={setSelected} />
        )}

        {!result ? (
          <div class="btns">
            <button class="btn primary" onClick={submit} disabled={selected.size === 0}>
              提交
            </button>
          </div>
        ) : (
          <>
            <div class={`verdict ${result.score >= spot.pass ? 'ok' : 'no'}`}>
              重合度 {result.score.toFixed(0)}%（过关线 {spot.pass}%）
            </div>
            <div class="stats">
              <span class="tag">漏选 {result.missed.length} 手</span>
              <span class="tag">多选 {result.extra.length} 手</span>
              <span class="tag">标准答案 {rangePercent(answer).toFixed(1)}%</span>
            </div>
            <div class="btns">
              <button class="btn primary" onClick={next}>
                下一题
              </button>
            </div>
          </>
        )}
      </div>

      {result && (
        <div class="card">
          <b>推导过程</b>
          <ul style="margin:8px 0;padding-left:20px">
            {spot.reasoning.map((r) => (
              <li key={r} style="margin:6px 0;font-size:15px">
                {r}
              </li>
            ))}
          </ul>
          <div class="muted" style="margin-top:8px">
            标准答案：{spot.answer}
          </div>
        </div>
      )}

      <div class="card">
        <div class="muted">
          {result
            ? `已完成 ${stats.n} 题，过关 ${stats.ok} 题。`
            : '在矩阵上拖动涂抹选择。重合度按组合数加权计算（交集 ÷ 并集），所以画错一个对子的代价小于画错一个不同花手。'}
        </div>
      </div>
    </div>
  )
}
