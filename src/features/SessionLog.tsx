import { useState } from 'preact/hooks'
import { addSession, load, removeSession, type SessionLog as Entry } from '../lib/storage'

/** 出师标准：累计 30 个不同的日期有记录 */
const GOAL_DAYS = 30

const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const TILT = ['无', '轻微', '明显', '失控'] as const

export function SessionLog() {
  const [list, setList] = useState<Entry[]>(() => [...load().sessions])
  const [date, setDate] = useState(today)
  const [minutes, setMinutes] = useState('')
  const [hands, setHands] = useState('')
  const [result, setResult] = useState('')
  const [game, setGame] = useState<Entry['game']>('A')
  const [tilt, setTilt] = useState<Entry['tilt']>(0)
  const [planned, setPlanned] = useState(true)
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  const days = new Set(list.map((x) => x.date)).size
  const totalMin = list.reduce((a, x) => a + x.minutes, 0)
  const totalBb = list.reduce((a, x) => a + x.result, 0)
  const byGame = { A: 0, B: 0, C: 0 }
  for (const x of list) byGame[x.game]++
  const tilted = list.filter((x) => x.tilt >= 2).length
  const unplanned = list.filter((x) => !x.planned).length

  function save() {
    const m = Number(minutes)
    const r = Number(result)
    if (!date || !(m > 0) || result.trim() === '' || Number.isNaN(r)) {
      setErr('日期、时长、盈亏是必填项')
      return
    }
    const h = Number(hands)
    addSession({
      date,
      minutes: Math.round(m),
      hands: h > 0 ? Math.round(h) : undefined,
      result: r,
      game,
      tilt,
      planned,
      note: note.trim(),
    })
    setList([...load().sessions])
    setMinutes('')
    setHands('')
    setResult('')
    setNote('')
    setErr('')
  }

  function remove(id: string) {
    removeSession(id)
    setList([...load().sessions])
  }

  return (
    <div>
      <div class="card">
        <div class="row">
          <b>出师进度</b>
          <span class={`tag${days >= GOAL_DAYS ? ' on' : ''}`}>
            {Math.min(days, GOAL_DAYS)} / {GOAL_DAYS} 天
          </span>
        </div>
        <div class="bar">
          <i style={`width:${Math.min(100, (days / GOAL_DAYS) * 100)}%`} />
        </div>
        <div class="muted" style="margin-top:8px;font-size:14px">
          累计 {list.length} 次 · {(totalMin / 60).toFixed(1)} 小时 · 盈亏{' '}
          {totalBb >= 0 ? '+' : ''}
          {totalBb.toFixed(0)}bb
        </div>
        {list.length > 0 && (
          <div class="muted" style="font-size:14px">
            A/B/C 游戏 {byGame.A}/{byGame.B}/{byGame.C} · 明显 tilt {tilted} 次 · 未按计划离桌{' '}
            {unplanned} 次
          </div>
        )}
      </div>

      <div class="card form">
        <b>记录一次 session</b>
        <label>
          日期
          <input type="date" value={date} onInput={(e) => setDate(e.currentTarget.value)} />
        </label>
        <div class="row" style="gap:10px">
          <label>
            时长（分钟）
            <input
              type="number"
              inputMode="numeric"
              value={minutes}
              onInput={(e) => setMinutes(e.currentTarget.value)}
            />
          </label>
          <label>
            手数（可选）
            <input
              type="number"
              inputMode="numeric"
              value={hands}
              onInput={(e) => setHands(e.currentTarget.value)}
            />
          </label>
        </div>
        <label>
          盈亏（bb，输了填负数）
          <input
            type="number"
            inputMode="decimal"
            value={result}
            onInput={(e) => setResult(e.currentTarget.value)}
          />
        </label>

        <div class="field">自评（L9-06）</div>
        <div class="seg">
          {(['A', 'B', 'C'] as const).map((g) => (
            <button key={g} class={game === g ? 'on' : ''} onClick={() => setGame(g)}>
              {g} 游戏
            </button>
          ))}
        </div>

        <div class="field">Tilt 程度（L9-03）</div>
        <div class="seg">
          {TILT.map((t, i) => (
            <button
              key={t}
              class={tilt === i ? 'on' : ''}
              onClick={() => setTilt(i as Entry['tilt'])}
            >
              {t}
            </button>
          ))}
        </div>

        <div class="field">离桌方式（L9-04）</div>
        <div class="seg">
          <button class={planned ? 'on' : ''} onClick={() => setPlanned(true)}>
            按计划
          </button>
          <button class={!planned ? 'on' : ''} onClick={() => setPlanned(false)}>
            没按计划
          </button>
        </div>

        <label>
          关键手牌 / 复盘要点（L9-07）
          <textarea
            value={note}
            placeholder="例：转牌 K♠ 面对过牌加注弃了 AQ，回头用范围推演一遍"
            onInput={(e) => setNote(e.currentTarget.value)}
          />
        </label>

        {err && <div style="color:var(--bad);font-size:14px">{err}</div>}
        <div class="btns">
          <button class="btn primary" onClick={save}>
            保存
          </button>
        </div>
      </div>

      {list.length > 0 && (
        <div class="card">
          <b>最近记录</b>
          {[...list]
            .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
            .slice(0, 20)
            .map((x) => (
              <div key={x.id} class="session-row">
                <div class="row">
                  <span>
                    {x.date} · {x.minutes} 分钟 · <b>{x.game}</b>
                    {x.tilt >= 2 && <span style="color:var(--warn)"> · tilt</span>}
                  </span>
                  <span style={`color:var(${x.result >= 0 ? '--accent' : '--bad'})`}>
                    {x.result >= 0 ? '+' : ''}
                    {x.result}bb
                  </span>
                </div>
                {x.note && <div class="muted" style="font-size:14px">{x.note}</div>}
                <div style="text-align:right">
                  <span class="muted" style="font-size:12px;cursor:pointer" onClick={() => remove(x.id)}>
                    删除
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      <div class="card">
        <div class="muted" style="font-size:14px">
          盈亏只是记录，不是评价。按 L2-10 的计算，30 天的盈亏几乎不包含水平信息 ——
          这份日志真正要看的是 A/B/C 的比例、tilt 次数和是否按计划离桌。
        </div>
      </div>
    </div>
  )
}
