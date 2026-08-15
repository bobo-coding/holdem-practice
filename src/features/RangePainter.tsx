import { useRef } from 'preact/hooks'
import { gridCodes, rangePercent, type HandCode, type Overlap } from '../lib/range'

/**
 * 可涂抹的 13×13 范围矩阵。
 * 用指针坐标反推格子，而不是给每格挂事件 —— 这样拖拽在触屏上才连贯。
 */
export function RangePainter({
  selected,
  onChange,
  disabled,
}: {
  selected: Set<HandCode>
  onChange: (next: Set<HandCode>) => void
  disabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const painting = useRef<'add' | 'remove' | null>(null)
  const codes = gridCodes()

  function cellAt(x: number, y: number): HandCode | null {
    const el = ref.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const col = Math.floor(((x - r.left) / r.width) * 13)
    const row = Math.floor(((y - r.top) / r.height) * 13)
    if (col < 0 || col > 12 || row < 0 || row > 12) return null
    return codes[row]![col]!
  }

  function apply(code: HandCode) {
    const mode = painting.current
    if (!mode) return
    if (mode === 'add' && selected.has(code)) return
    if (mode === 'remove' && !selected.has(code)) return
    const next = new Set(selected)
    if (mode === 'add') next.add(code)
    else next.delete(code)
    onChange(next)
  }

  return (
    <div class="grid-wrap">
      <div class="row" style="margin-bottom:8px">
        <span class="muted">已选 {selected.size} 手</span>
        <span class="tag">{rangePercent(selected).toFixed(1)}%</span>
      </div>
      <div
        ref={ref}
        class={`grid paint${disabled ? ' off' : ''}`}
        onPointerDown={(e) => {
          if (disabled) return
          const code = cellAt(e.clientX, e.clientY)
          if (!code) return
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          painting.current = selected.has(code) ? 'remove' : 'add'
          apply(code)
        }}
        onPointerMove={(e) => {
          if (disabled || !painting.current) return
          const code = cellAt(e.clientX, e.clientY)
          if (code) apply(code)
        }}
        onPointerUp={() => (painting.current = null)}
        onPointerCancel={() => (painting.current = null)}
      >
        {codes.flat().map((code) => (
          <div key={code} class={`cell${selected.has(code) ? ' in' : ''}`}>
            {code}
          </div>
        ))}
      </div>
      {!disabled && (
        <div class="btns" style="margin:10px 0 0">
          <button class="btn ghost" onClick={() => onChange(new Set())}>
            清空
          </button>
          <button
            class="btn ghost"
            onClick={() => onChange(new Set(codes.flat().filter((c) => c.length === 2)))}
          >
            只选对子
          </button>
        </div>
      )}
    </div>
  )
}

/** 对比展示：正确 / 漏选 / 多选 三色 */
export function RangeDiff({ result }: { result: Overlap }) {
  const cls = new Map<HandCode, string>()
  for (const c of result.hit) cls.set(c, 'in')
  for (const c of result.missed) cls.set(c, 'missed')
  for (const c of result.extra) cls.set(c, 'extra')
  return (
    <div class="grid-wrap">
      <div class="grid">
        {gridCodes()
          .flat()
          .map((code) => (
            <div key={code} class={`cell ${cls.get(code) ?? ''}`}>
              {code}
            </div>
          ))}
      </div>
      <div class="legend">
        <span>
          <i class="swatch" />
          选对
        </span>
        <span>
          <i class="swatch miss" />
          漏选（应该在范围里）
        </span>
        <span>
          <i class="swatch ext" />
          多选（不该在范围里）
        </span>
      </div>
    </div>
  )
}
