import { gridCodes, rangePercent, type HandCode } from '../lib/range'
import { EQ_VS_RANDOM } from '../data/strength'

/** 按对随机牌全下胜率排名，归一到 0..1（最弱 0，AA 为 1） */
const RANK: Record<string, number> = (() => {
  const sorted = Object.keys(EQ_VS_RANDOM).sort((a, b) => EQ_VS_RANDOM[a]! - EQ_VS_RANDOM[b]!)
  const out: Record<string, number> = {}
  sorted.forEach((c, i) => (out[c] = i / (sorted.length - 1)))
  return out
})()

export const strengthShade = (code: HandCode) => RANK[code] ?? 0

/** 强弱度 → 单元格样式。t 越大越亮；dim 用于范围外的格子 */
function cellStyle(t: number, dim: boolean): string {
  if (dim) return `background:rgba(61,220,151,${(0.04 + 0.16 * t).toFixed(3)})`
  const a = 0.22 + 0.73 * t
  return `background:rgba(61,220,151,${a.toFixed(3)});color:${a > 0.62 ? '#05231a' : '#dcfff0'}`
}

interface Props {
  /** 落在范围内的手牌 */
  inRange: Set<HandCode>
  /** 高亮某一手（训练器反馈用） */
  hit?: HandCode
  label?: string
  showPercent?: boolean
  /** 强弱度 0..1，缺省为对随机牌全下胜率的排名 */
  shade?: (code: HandCode) => number
  /** 图例里对强弱度含义的说明 */
  shadeLabel?: string
  /** 范围外的格子也按强弱度淡色显示（查表时看整体结构用） */
  shadeOut?: boolean
  /** 离散分层图例；给了就替代连续的「弱→强」色带 */
  tiers?: { label: string; t: number }[]
  onPick?: (code: HandCode) => void
}

export function RangeGrid({
  inRange,
  hit,
  label,
  showPercent = true,
  shade = strengthShade,
  shadeLabel = '颜色越深 = 对随机牌的全下胜率越高',
  shadeOut = false,
  tiers,
  onPick,
}: Props) {
  const codes = gridCodes()
  return (
    <div class="grid-wrap">
      {label && (
        <div class="row" style="margin-bottom:8px">
          <b style="font-size:15px">{label}</b>
          {showPercent && <span class="tag">{rangePercent(inRange).toFixed(1)}% 的手牌</span>}
        </div>
      )}
      <div class={`grid${onPick ? ' pick' : ''}`}>
        {codes.flat().map((code) => {
          const inside = inRange.has(code)
          const style = inside
            ? cellStyle(shade(code), false)
            : shadeOut && shade(code) > 0
              ? cellStyle(shade(code), true)
              : ''
          return (
            <div
              key={code}
              class={`cell${inside ? ' in' : ''}${hit === code ? ' hit' : ''}`}
              style={style}
              onClick={onPick && (() => onPick(code))}
            >
              {code}
            </div>
          )
        })}
      </div>
      <div class="legend">
        {tiers ? (
          tiers.map((x) => (
            <span key={x.label}>
              <i class="swatch" style={cellStyle(x.t, false)} />
              {x.label}
            </span>
          ))
        ) : (
          <span class="ramp">
            弱<i />强
          </span>
        )}
        <span>{shadeLabel}</span>
      </div>
      <div class="legend" style="margin-top:2px">
        <span>对角线=对子 · 右上=同花 · 左下=不同花{shadeOut ? ' · 淡色=范围外' : ''}</span>
      </div>
    </div>
  )
}
