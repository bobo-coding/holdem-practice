import { LEVELS, TOTAL_LESSONS } from '../data/curriculum'
import { hasContent } from '../content/lessons'
import { load } from '../lib/storage'
import { navigate } from '../lib/router'

export function Home() {
  const p = load()
  const doneCount = Object.values(p.lessons).filter((x) => x.done).length
  const ready = LEVELS.flatMap((l) => l.lessons).filter((l) => hasContent(l.id)).length

  return (
    <>
      <div class="topbar">
        <h1>德州扑克训练</h1>
      </div>

      <div class="card">
        <div class="row">
          <b>总进度</b>
          <span class="muted">
            {doneCount} / {TOTAL_LESSONS} 课
          </span>
        </div>
        <div class="bar">
          <i style={`width:${(doneCount / TOTAL_LESSONS) * 100}%`} />
        </div>
        <div class="muted" style="margin-top:10px">
          课程大纲已完整规划 11 级 {TOTAL_LESSONS} 课，正文已上线 {ready} 课，其余陆续补齐。
        </div>
      </div>

      <div class="card tap" onClick={() => navigate('/drills/rfi')}>
        <div class="row">
          <b>今日训练 · 翻前范围</b>
          <span class="tag on">开始</span>
        </div>
        <div class="muted">随机位置 + 随机手牌，判断开池或弃牌。出题偏向边界手牌。</div>
      </div>

      {LEVELS.map((level) => {
        const done = level.lessons.filter((l) => p.lessons[l.id]?.done).length
        const avail = level.lessons.filter((l) => hasContent(l.id)).length
        return (
          <div key={level.id} class="card tap" onClick={() => navigate(`/level/${level.id}`)}>
            <div class="row">
              <b>
                {level.id} · {level.name}
              </b>
              <span class="tag">
                {done}/{level.lessons.length}
              </span>
            </div>
            <div class="muted">出师标准：{level.gate}</div>
            <div class="bar">
              <i style={`width:${(done / level.lessons.length) * 100}%`} />
            </div>
            {avail === 0 && (
              <div class="muted" style="margin-top:8px">
                正文编写中
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
