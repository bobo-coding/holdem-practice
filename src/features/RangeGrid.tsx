import { gridCodes, rangePercent, type HandCode } from '../lib/range'

interface Props {
  /** 落在范围内的手牌 */
  inRange: Set<HandCode>
  /** 高亮某一手（训练器反馈用） */
  hit?: HandCode
  label?: string
  showPercent?: boolean
}

export function RangeGrid({ inRange, hit, label, showPercent = true }: Props) {
  const codes = gridCodes()
  return (
    <div class="grid-wrap">
      {label && (
        <div class="row" style="margin-bottom:8px">
          <b style="font-size:15px">{label}</b>
          {showPercent && <span class="tag">{rangePercent(inRange).toFixed(1)}% 的手牌</span>}
        </div>
      )}
      <div class="grid">
        {codes.flat().map((code) => (
          <div
            key={code}
            class={`cell${inRange.has(code) ? ' in' : ''}${hit === code ? ' hit' : ''}`}
          >
            {code}
          </div>
        ))}
      </div>
      <div class="legend">
        <span>
          <i class="swatch" />
          范围内
        </span>
        <span>对角线=对子 · 右上=同花 · 左下=不同花</span>
      </div>
    </div>
  )
}
