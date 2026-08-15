import { useEffect, useState } from 'preact/hooks'

/** hash 路由：静态托管无需服务端 rewrite，子路径部署也不会 404 */
export function currentPath(): string {
  const h = location.hash.replace(/^#/, '')
  return h || '/'
}

export function navigate(path: string) {
  if (currentPath() === path) return
  location.hash = path
}

export function useRoute(): string {
  const [path, setPath] = useState(currentPath())
  useEffect(() => {
    const onChange = () => {
      setPath(currentPath())
      window.scrollTo(0, 0)
    }
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])
  return path
}
