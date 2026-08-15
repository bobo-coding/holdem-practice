import { useState } from 'preact/hooks'
import { exportCode, importCode, load, reset, SKILL_LABEL } from '../lib/storage'
import { TOTAL_LESSONS } from '../data/curriculum'

export function MePage() {
  const p = load()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const done = Object.values(p.lessons).filter((x) => x.done).length
  const drills = Object.values(p.drills)
  const attempts = drills.reduce((n, d) => n + d.attempts, 0)
  const correct = drills.reduce((n, d) => n + d.correct, 0)

  return (
    <>
      <div class="topbar">
        <h1>我的</h1>
      </div>

      <div class="card">
        <div class="row">
          <span class="muted">已完成课程</span>
          <b>
            {done} / {TOTAL_LESSONS}
          </b>
        </div>
        <div class="row">
          <span class="muted">练习总题数</span>
          <b>{attempts}</b>
        </div>
        <div class="row">
          <span class="muted">练习正确率</span>
          <b>{attempts ? Math.round((correct / attempts) * 100) : 0}%</b>
        </div>
        <div class="row">
          <span class="muted">错题本</span>
          <b>{p.mistakes.length} 条</b>
        </div>
      </div>

      {p.mistakes.length > 0 && (
        <div class="card">
          <b>错题本</b>
          <div class="muted" style="margin-bottom:8px">
            按时间倒序，最近 10 条
          </div>
          {[...p.mistakes]
            .reverse()
            .slice(0, 10)
            .map((m) => (
              <div key={m.id} class="row" style="padding:6px 0;border-top:1px solid var(--line)">
                <span style="font-size:14px">{m.prompt}</span>
                <span class="tag">{SKILL_LABEL[m.tag] ?? m.tag}</span>
              </div>
            ))}
        </div>
      )}

      <div class="card">
        <b>进度备份</b>
        <div class="muted" style="margin-bottom:8px">
          进度只存在这台设备的浏览器里。换设备时复制下面的进度码，粘贴到新设备导入。
        </div>
        <textarea class="code" readOnly value={exportCode()} onClick={(e) => (e.currentTarget as HTMLTextAreaElement).select()} />
        <div style="height:10px" />
        <textarea
          class="code"
          placeholder="在此粘贴进度码后点导入"
          value={code}
          onInput={(e) => setCode((e.currentTarget as HTMLTextAreaElement).value)}
        />
        <div class="btns">
          <button
            class="btn primary"
            onClick={() => {
              setMsg(importCode(code) ? '导入成功，刷新页面生效' : '进度码无效')
            }}
          >
            导入
          </button>
          <button
            class="btn ghost"
            onClick={() => {
              reset()
              setMsg('已清空，刷新页面生效')
            }}
          >
            清空进度
          </button>
        </div>
        {msg && <div class="muted">{msg}</div>}
      </div>
    </>
  )
}
