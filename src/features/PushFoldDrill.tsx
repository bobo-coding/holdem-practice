import { useMemo, useState } from 'preact/hooks'
import { gridCodes, randomHandWeighted, type HandCode } from '../lib/range'
import { PUSHFOLD, type PushFoldTable } from '../data/pushfold'
import { RangeGrid } from './RangeGrid'
import { addMistake, recordDrill } from '../lib/storage'

const DRILL_ID = 'pushfold'

type Role = 'push' | 'call'

interface Q {
  table: PushFoldTable
  role: Role
  stack: number
  hand: HandCode
}

/** 出题深度：Push/Fold 真正常用的 3–15bb */
const STACKS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

const pickOf = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]!

/** 该表在某深度下执行动作的手牌集合 */
export function nashRange(t: PushFoldTable, role: Role, stack: number): Set<HandCode> {
  const th = role === 'push' ? t.push : t.call
  return new Set(gridCodes().flat().filter((c) => th[c]! >= stack))
}

/**
 * 出题偏向阈值附近：离当前深度 3bb 以内的手牌才是需要记的，
 * AA 和 72o 怎么打都一样，出多了只会虚高正确率。
 */
function nextQ(): Q {
  const table = pickOf(PUSHFOLD)
  const role: Role = Math.random() < 0.55 ? 'push' : 'call'
  const stack = pickOf(STACKS)
  const th = role === 'push' ? table.push : table.call
  for (let i = 0; i < 30; i++) {
    const hand = randomHandWeighted()
    if (table.irregular.includes(hand)) continue
    const near = Math.abs(th[hand]! - stack) <= 3
    if (near || Math.random() < 0.15) return { table, role, stack, hand }
  }
  return { table, role, stack, hand: 'A9o' }
}

export function PushFoldDrill() {
  const [q, setQ] = useState<Q>(nextQ)
  const [answered, setAnswered] = useState<null | { correct: boolean }>(null)
  const [stats, setStats] = useState({ n: 0, ok: 0, streak: 0, best: 0 })

  const th = (q.role === 'push' ? q.table.push : q.table.call)[q.hand]!
  const act = th >= q.stack
  const range = useMemo(() => nashRange(q.table, q.role, q.stack), [q])
  const actLabel = q.role === 'push' ? '全下' : '跟注'

  function answer(picked: boolean) {
    if (answered) return
    const correct = picked === act
    const streak = correct ? stats.streak + 1 : 0
    setStats((s) => ({
      n: s.n + 1,
      ok: s.ok + (correct ? 1 : 0),
      streak,
      best: Math.max(s.best, streak),
    }))
    setAnswered({ correct })
    recordDrill(DRILL_ID, correct, streak)
    if (!correct)
      addMistake({
        id: `${DRILL_ID}:${q.table.id}:${q.role}:${q.stack}:${q.hand}`,
        tag: 'preflop',
        prompt: `${q.role === 'push' ? 'SB 全下' : 'BB 跟注'} ${q.stack}bb${q.table.dead ? '（有 ante）' : ''}，手牌 ${q.hand}`,
      })
  }

  const [hi, lo] = [q.hand[0]!, q.hand[1]!]
  const suited = q.hand.endsWith('s')
  const pair = q.hand.length === 2

  return (
    <div>
      <div class="card">
        <div class="row">
          <b style="font-size:15px">Push/Fold 训练</b>
          <span class="tag">{q.table.dead ? 'BB ante' : '无 ante'}</span>
        </div>
        <div class="muted" style="margin-top:4px">
          单挑纳什均衡 · 前面全部弃牌 · 盲注 0.5/1
        </div>
      </div>

      <div class="card">
        <div class="prompt">
          有效筹码 <b>{q.stack}bb</b>，
          {q.role === 'push' ? (
            <>
              你在 <b>SB</b>，全下还是弃牌？
            </>
          ) : (
            <>
              你在 <b>BB</b>，SB 全下，跟注还是弃牌？
            </>
          )}
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
              {actLabel}
            </button>
          </div>
        ) : (
          <>
            <div class={`verdict ${answered.correct ? 'ok' : 'no'}`}>
              {answered.correct ? '✓ 正确' : '✗ 错误'} —— 纳什答案：{act ? actLabel : '弃牌'}
            </div>
            <div class="key" style="margin-top:10px">
              <b>阈值</b>
              {th === 0
                ? `${q.hand} 在这张表里任何深度都不${actLabel}。`
                : th >= 20
                  ? `${q.hand} 到 20bb 仍然${actLabel}。`
                  : `${q.hand} 在有效筹码 ≤ ${th}bb 时${actLabel}，当前 ${q.stack}bb。`}
            </div>
            <div class="btns">
              <button
                class="btn primary"
                onClick={() => {
                  setAnswered(null)
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

      {answered && (
        <div class="card">
          <RangeGrid
            inRange={range}
            hit={q.hand}
            label={`${q.stack}bb ${q.role === 'push' ? 'SB 全下' : 'BB 跟注'}范围`}
          />
          <div class="muted" style="margin-top:8px">
            白框是本题手牌。{q.table.caveat}
          </div>
        </div>
      )}
    </div>
  )
}
