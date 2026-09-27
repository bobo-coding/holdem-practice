import { useMemo, useState } from 'preact/hooks'
import { normalizeHand, rangePercent, type HandCode } from '../lib/range'
import { PUSHFOLD } from '../data/pushfold'
import { EQ_VS_RANDOM } from '../data/strength'
import { RangeGrid } from './RangeGrid'
import { nashRange, nashShade, NASH_SHADE_LABEL, type Role } from './PushFoldDrill'

/** 从 hash 的查询串读初始状态：#/drills/nash?t=hu&r=push&s=10 */
function initial() {
  const q = new URLSearchParams(location.hash.split('?')[1] ?? '')
  const t = PUSHFOLD.find((x) => x.id === q.get('t')) ?? PUSHFOLD[0]!
  const r: Role = q.get('r') === 'call' ? 'call' : 'push'
  const s = Number(q.get('s'))
  return { tableId: t.id, role: r, stack: t.stacks.includes(s) ? s : 10 }
}

const fmt = (th: number) => (th === 0 ? '从不' : th >= 20 ? '20bb+' : `≤ ${th}bb`)

export function NashLookup() {
  const init = useMemo(initial, [])
  const [tableId, setTableId] = useState(init.tableId)
  const [role, setRole] = useState<Role>(init.role)
  const [stack, setStack] = useState(init.stack)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<HandCode | null>(null)

  const table = PUSHFOLD.find((t) => t.id === tableId)!
  const range = useMemo(() => nashRange(table, role, stack), [table, role, stack])
  const pct = rangePercent(range).toFixed(1)

  const typed = query.trim() ? normalizeHand(query) : null
  const hand = typed ?? picked
  const actLabel = role === 'push' ? '全下' : '跟注'

  return (
    <div>
      <div class="card form">
        <div class="field" style="margin-top:0">底池结构</div>
        <div class="seg">
          {PUSHFOLD.map((t) => (
            <button key={t.id} class={t.id === tableId ? 'on' : ''} onClick={() => setTableId(t.id)}>
              {t.dead ? 'BB ante' : '无 ante'}
            </button>
          ))}
        </div>
        <div class="field">动作</div>
        <div class="seg">
          <button class={role === 'push' ? 'on' : ''} onClick={() => setRole('push')}>
            SB 全下
          </button>
          <button class={role === 'call' ? 'on' : ''} onClick={() => setRole('call')}>
            BB 跟注
          </button>
        </div>
        <div class="field">
          有效筹码 <b style="color:var(--fg)">{stack}bb</b>
        </div>
        <input
          class="stack"
          type="range"
          min={table.stacks[0]}
          max={table.stacks[table.stacks.length - 1]}
          step={0.5}
          value={stack}
          onInput={(e) => setStack(Number(e.currentTarget.value))}
        />
        <div class="row muted" style="font-size:12px">
          <span>{table.stacks[0]}bb</span>
          <span>{table.stacks[table.stacks.length - 1]}bb</span>
        </div>
        <div class="field">查一手牌</div>
        <input
          class="lookup-input"
          placeholder="例如 K2o、76s、55（非对子要写 s 或 o）"
          value={query}
          onInput={(e) => setQuery(e.currentTarget.value)}
        />
        {query.trim() && !typed && (
          <div style="color:var(--warn);font-size:13px;margin-top:4px">
            无法识别。格式如 AKs、T9o、77。
          </div>
        )}
      </div>

      {hand && (
        <div class="card">
          <div class="row">
            <b style="font-size:18px">{hand}</b>
            <span class={`tag${range.has(hand) ? ' on' : ''}`}>
              {stack}bb {role === 'push' ? 'SB' : 'BB'}：{range.has(hand) ? actLabel : '弃牌'}
            </span>
          </div>
          <table class="t" style="margin-top:8px">
            <thead>
              <tr>
                <th />
                <th>SB 全下</th>
                <th>BB 跟注</th>
              </tr>
            </thead>
            <tbody>
              {PUSHFOLD.map((t) => (
                <tr key={t.id}>
                  <td>{t.dead ? 'BB ante' : '无 ante'}</td>
                  <td>{fmt(t.push[hand]!)}</td>
                  <td>{fmt(t.call[hand]!)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div class="muted" style="font-size:13px;margin-top:6px">
            对随机牌全下胜率 {EQ_VS_RANDOM[hand]}%
            {PUSHFOLD.some((t) => t.irregular.includes(hand)) &&
              ' · 这手牌的阈值不单调（某个深度弃牌、更深时又全下），表中取第一个断点'}
          </div>
        </div>
      )}

      <div class="card">
        <RangeGrid
          inRange={range}
          hit={hand ?? undefined}
          label={`${stack}bb ${role === 'push' ? 'SB 全下' : 'BB 跟注'}`}
          showPercent={false}
          shade={nashShade(table, role)}
          shadeLabel={NASH_SHADE_LABEL}
          shadeOut
          onPick={(c) => {
            setPicked(c)
            setQuery('')
          }}
        />
        <div class="row" style="margin-top:6px">
          <span class="muted" style="font-size:13px">点格子查看这手牌的阈值</span>
          <span class="tag">{pct}% 的手牌</span>
        </div>
      </div>

      <div class="card">
        <div class="muted" style="font-size:13px">
          {table.conditions}。{table.caveat}
        </div>
      </div>
    </div>
  )
}
