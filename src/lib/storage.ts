/**
 * 进度存储：纯客户端，localStorage 单 blob。
 * 不用 cookie —— cookie 单域约 4KB，错题本累积后必然溢出。
 * 跨设备靠「导出/导入进度码」（base64 字符串），仍然零后端。
 */

const KEY = 'holdem.progress.v1'

export type SkillTag =
  | 'preflop'
  | 'math'
  | 'postflop'
  | 'reading'
  | 'mental'

export interface LessonState {
  done: boolean
  score?: number
  at?: number
}

export interface DrillState {
  attempts: number
  correct: number
  bestStreak: number
}

export interface Mistake {
  id: string
  tag: SkillTag
  prompt: string
  at: number
  /** 间隔重复：还需正确回答几次才移出错题本 */
  due: number
}

export interface Progress {
  v: 1
  lessons: Record<string, LessonState>
  drills: Record<string, DrillState>
  mistakes: Mistake[]
  daily: { last: string; streak: number }
}

const empty = (): Progress => ({
  v: 1,
  lessons: {},
  drills: {},
  mistakes: [],
  daily: { last: '', streak: 0 },
})

let cache: Progress | null = null

export function load(): Progress {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    cache = raw ? { ...empty(), ...(JSON.parse(raw) as Progress) } : empty()
  } catch {
    cache = empty()
  }
  return cache
}

let timer: number | undefined
function flush() {
  if (!cache) return
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* 隐私模式 / 配额满：忽略，不影响使用 */
  }
}

/** 改动进度；写盘做 debounce，避免 drill 每题一次同步写 */
export function update(fn: (p: Progress) => void): Progress {
  const p = load()
  fn(p)
  clearTimeout(timer)
  timer = setTimeout(flush, 300) as unknown as number
  return p
}

export function recordDrill(drillId: string, correct: boolean, streak: number) {
  update((p) => {
    const d = (p.drills[drillId] ??= { attempts: 0, correct: 0, bestStreak: 0 })
    d.attempts++
    if (correct) d.correct++
    d.bestStreak = Math.max(d.bestStreak, streak)
  })
}

export function addMistake(m: Omit<Mistake, 'at' | 'due'>) {
  update((p) => {
    const exist = p.mistakes.find((x) => x.id === m.id)
    if (exist) {
      exist.due = Math.min(exist.due + 1, 5)
      exist.at = Date.now()
    } else {
      p.mistakes.push({ ...m, at: Date.now(), due: 2 })
    }
  })
}

export function markLesson(id: string, score?: number) {
  update((p) => {
    p.lessons[id] = { done: true, score, at: Date.now() }
  })
}

export function exportCode(): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(load()))))
}

export function importCode(code: string): boolean {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(code.trim())))) as Progress
    if (parsed.v !== 1) return false
    cache = { ...empty(), ...parsed }
    flush()
    return true
  } catch {
    return false
  }
}

export function reset() {
  cache = empty()
  flush()
}
