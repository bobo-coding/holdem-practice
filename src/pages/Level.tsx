import { findLevel } from '../data/curriculum'
import { hasContent } from '../content/lessons'
import { load } from '../lib/storage'
import { navigate } from '../lib/router'

export function LevelPage({ id }: { id: string }) {
  const level = findLevel(id)
  const p = load()
  if (!level) return <div class="card">没有这一级。</div>

  return (
    <>
      <div class="topbar">
        <span class="back" onClick={() => navigate('/')}>
          ‹ 返回
        </span>
        <h1>
          {level.id} · {level.name}
        </h1>
      </div>

      <div class="card">
        <div class="muted">出师标准</div>
        <div>{level.gate}</div>
      </div>

      {level.lessons.map((l, i) => {
        const ok = hasContent(l.id)
        const done = p.lessons[l.id]?.done
        return (
          <div
            key={l.id}
            class={`card${ok ? ' tap' : ''}`}
            style={ok ? '' : 'opacity:.5'}
            onClick={() => ok && navigate(`/lesson/${l.id}`)}
          >
            <div class="row">
              <span>
                <span class="muted">{String(i + 1).padStart(2, '0')}</span> {l.title}
              </span>
              <span class={`tag${done ? ' on' : ''}`}>
                {done ? '已完成' : ok ? '学习' : '未上线'}
              </span>
            </div>
          </div>
        )
      })}
    </>
  )
}
