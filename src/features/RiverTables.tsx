import { RIVER } from '../data/river'
import { Cards } from './Cards'

/**
 * L6 的河牌求解数据，直接从 src/data/river.ts 渲染，
 * 保证课程里的表格永远和求解结果一致。
 */

export type RiverScenario = 'equilibrium' | 'overfold' | 'overcall'

const SIZE_LABEL = RIVER.sizes.map((b) => `${b}`)

/** 局面卡片：公牌、底池、行动线、双方范围 */
export function RiverSpot() {
  return (
    <div class="replay">
      <div class="muted setup">
        6-max · 0.5/1 · CO 开池 BB 跟注 · CO 翻牌、转牌连续下注，BB 两次跟注
      </div>
      <div class="step">
        <div class="row">
          <b>河牌</b>
          <span class="tag">
            底池 {RIVER.pot}bb · 后手 {RIVER.stack}bb
          </span>
        </div>
        <Cards cards={[...RIVER.board]} size="lg" />
        <div class="act">
          BB 过牌。CO 可以过牌，或下注 {RIVER.sizes.join(' / ')}bb（1/2、1 倍、2 倍池）。BB 面对下注只能跟注或弃牌。
        </div>
        <div class="note">
          CO 范围（{RIVER.combos.co} 个组合）：{RIVER.ranges.co}
          <br />
          BB 范围（{RIVER.combos.bb} 个组合）：{RIVER.ranges.bb}
        </div>
      </div>
    </div>
  )
}

const pct = (x: number) => (x === 0 ? '—' : x >= 99.95 ? '100' : x.toFixed(0))

/** CO 每类手牌的策略。withEV 时额外显示各动作单独的 EV */
export function RiverCoTable({
  scenario,
  withEV = false,
  only,
}: {
  scenario: RiverScenario
  withEV?: boolean
  only?: string[]
}) {
  const rows = (scenario === 'equilibrium' ? RIVER.equilibrium.co : RIVER[scenario].byCode).filter(
    (r) => !only || only.includes(r.code),
  )
  const eqRows = RIVER.equilibrium.co
  return (
    <div style="overflow-x:auto">
      <table class="t dense">
        <thead>
          <tr>
            <th>手牌</th>
            <th>胜率</th>
            {withEV ? (
              <>
                <th>过牌 EV</th>
                {SIZE_LABEL.map((s) => (
                  <th key={s}>下 {s} EV</th>
                ))}
              </>
            ) : (
              <>
                <th>过牌</th>
                {SIZE_LABEL.map((s) => (
                  <th key={s}>下 {s}</th>
                ))}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const ev = eqRows.find((x) => x.code === r.code)!.actionEV
            const best = Math.max(...ev)
            return (
              <tr key={r.code}>
                <td>
                  <b>{r.code}</b>
                  <span class="muted"> ×{r.combos}</span>
                </td>
                <td>{r.showdown.toFixed(0)}%</td>
                {withEV
                  ? ev.map((x, a) => (
                      <td key={a} style={x >= best - 0.01 ? 'color:var(--accent)' : ''}>
                        {x.toFixed(2)}
                      </td>
                    ))
                  : r.freq.map((f, a) => (
                      <td key={a} style={f >= 50 ? 'color:var(--accent)' : ''}>
                        {pct(f)}
                      </td>
                    ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div class="muted" style="font-size:12px">
        胜率 = 摊牌时对 BB 整个河牌范围的胜率。×N 是组合数。
        {withEV ? '绿色 = 该手牌 EV 最高的动作（单位 bb）。' : '数字为频率 %，绿色 = 主要动作。'}
      </div>
    </div>
  )
}

/** BB 面对某个尺度时每类手牌的跟注率 */
export function RiverBbTable({ size, only }: { size: number; only?: string[] }) {
  const k = RIVER.sizes.indexOf(size as (typeof RIVER.sizes)[number])
  const rows = RIVER.equilibrium.bb[k]!.filter((r) => !only || only.includes(r.code))
  return (
    <div style="overflow-x:auto">
      <table class="t dense">
        <thead>
          <tr>
            <th>BB 手牌</th>
            <th>摊牌胜率</th>
            <th>面对 {size}bb 跟注</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.code}>
              <td>
                <b>{r.code}</b>
                <span class="muted"> ×{r.combos}</span>
              </td>
              <td>{r.showdown.toFixed(0)}%</td>
              <td style={r.call >= 50 ? 'color:var(--accent)' : ''}>{pct(r.call)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div class="muted" style="font-size:12px">
        摊牌胜率 = 对 CO 整个河牌范围；面对下注时真正要比的是对 CO 下注范围的胜率。
      </div>
    </div>
  )
}
