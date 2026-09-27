import { useRoute } from './lib/router'
import { Home } from './pages/Home'
import { LevelPage } from './pages/Level'
import { LessonPage } from './pages/Lesson'
import { DrillsPage, DrillPage } from './pages/Drills'
import { MePage } from './pages/Me'

const NAV = [
  { path: '/', label: '课程', ico: '📚' },
  { path: '/drills', label: '练习', ico: '🎯' },
  { path: '/me', label: '我的', ico: '👤' },
]

function view(path: string) {
  // 查询串（如 #/drills/nash?s=10）由页面自己读取，路由只看路径
  const seg = path.split('?')[0]!.split('/').filter(Boolean)
  if (seg.length === 0) return <Home />
  if (seg[0] === 'level' && seg[1]) return <LevelPage id={seg[1]} />
  if (seg[0] === 'lesson' && seg[1]) return <LessonPage id={seg[1]} />
  if (seg[0] === 'drills') return seg[1] ? <DrillPage id={seg[1]} /> : <DrillsPage />
  if (seg[0] === 'me') return <MePage />
  return <Home />
}

export function App() {
  const path = useRoute()
  const root = '/' + (path.split('/').filter(Boolean)[0] ?? '')
  return (
    <>
      {view(path)}
      <nav class="nav">
        {NAV.map((n) => (
          <a key={n.path} href={`#${n.path}`} class={root === n.path ? 'on' : ''}>
            <span class="ico">{n.ico}</span>
            {n.label}
          </a>
        ))}
      </nav>
    </>
  )
}
