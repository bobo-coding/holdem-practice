import { useMemo, useState } from 'preact/hooks'
import { parseRange, randomHandWeighted, type HandCode } from '../lib/range'
import { POSITIONS, POSITION_LABEL, RFI_6MAX, tierShading, type Position } from '../data/ranges'
import { RangeGrid } from './RangeGrid'
import { addMistake, recordDrill } from '../lib/storage'

const DRILL_ID = 'rfi-6max-100bb'

interface Q {
  pos: Position
  hand: HandCode
}

export function RangeTrainer() {
  const parsed = useMemo(() => {
    const m = {} as Record<Position, Set<HandCode>>
    for (const p of POSITIONS) m[p] = parseRange(RFI_6MAX.ranges[p])
    return m
  }, [])

  /**
   * 出题偏向「边界圈」：AA、72o 这类怎么打都一样的牌几乎不出，
   * 因为决定胜负的是 K9s / A5o / 76s 这一圈模糊手牌。
   */
  const nextQ = (): Q => {
    const pick = (): Q => ({
      pos: POSITIONS[Math.floor(Math.random() * POSITIONS.length)]!,
      hand: randomHandWeighted(),
    })
    for (let i = 0; i < 8; i++) {
      const q = pick()
      const alwaysRaise = parsed.UTG.has(q.hand)
      const alwaysFold = !parsed.BTN.has(q.hand) && !parsed.SB.has(q.hand)
      if (!alwaysRaise && !alwaysFold) return q
      if (Math.random() < 0.25) return q
    }
    return pick()
  }

  const tiers = useMemo(() => tierShading(RFI_6MAX), [])

  const [q, setQ] = useState<Q>(nextQ)
  const [answered, setAnswered] = useState<null | { correct: boolean; picked: boolean }>(null)
  const [stats, setStats] = useState({ n: 0, ok: 0, streak: 0, best: 0 })

  const shouldRaise = parsed[q.pos].has(q.hand)

  function answer(picked: boolean) {
    if (answered) return
    const correct = picked === shouldRaise
    const streak = correct ? stats.streak + 1 : 0
    setStats((s) => ({
      n: s.n + 1,
      ok: s.ok + (correct ? 1 : 0),
      streak,
      best: Math.max(s.best, streak),
    }))
    setAnswered({ correct, picked })
    recordDrill(DRILL_ID, correct, streak)
    if (!correct) {
      addMistake({
        id: `${DRILL_ID}:${q.pos}:${q.hand}`,
        tag: 'preflop',
        prompt: `${q.pos} 首入，手牌 ${q.hand}`,
      })
    }
  }

  function next() {
    setAnswered(null)
    setQ(nextQ())
  }

  const [hi, lo, suited] = [q.hand[0]!, q.hand[1]!, q.hand.endsWith('s')]
  const pair = q.hand.length === 2

  return (
    <div>
      <div class="card">
        <div class="row">
          <b style="font-size:15px">翻前范围训练器</b>
          <span class="tag">{RFI_6MAX.conditions.split('·')[1]?.trim()}</span>
        </div>
        <div class="muted" style="margin-top:4px">
          6-max 现金局 · 前面全部弃牌，轮到你首入
        </div>
      </div>

      <div class="card">
        <div class="prompt">
          你在 <b>{POSITION_LABEL[q.pos]}</b>
        </div>
        <div class="hand">
          <div class="pcard">
            {hi}
            <span style="font-size:20px;margin-left:2px">♠</span>
          </div>
          <div class={`pcard${suited ? '' : ' red'}`}>
            {pair ? hi : lo}
            <span style="font-size:20px;margin-left:2px">{suited ? '♠' : '♥'}</span>
          </div>
        </div>
        <div class="prompt">
          {q.hand}
          {pair ? '（对子）' : suited ? '（同花）' : '（不同花）'}
        </div>

        {!answered ? (
          <div class="btns">
            <button class="btn" onClick={() => answer(false)}>
              弃牌
            </button>
            <button class="btn primary" onClick={() => answer(true)}>
              加注
            </button>
          </div>
        ) : (
          <>
            <div class={`verdict ${answered.correct ? 'ok' : 'no'}`}>
              {answered.correct ? '✓ 正确' : '✗ 错误'} —— 标准答案：
              {shouldRaise ? '加注' : '弃牌'}
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

      {answered && (
        <div class="card">
          <RangeGrid
            inRange={parsed[q.pos]}
            hit={q.hand}
            label={`${q.pos} 开池范围`}
            shade={tiers.shade}
            tiers={tiers.tiers}
            shadeOut
            shadeLabel="颜色越深 = 越早的位置就开始开池"
          />
          <div class="muted" style="margin-top:8px">
            白框是本题手牌。{RFI_6MAX.caveat}
          </div>
        </div>
      )}
    </div>
  )
}
