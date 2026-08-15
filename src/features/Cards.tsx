const RED = ['♦', '♥']

export function Cards({
  cards,
  size = 'sm',
}: {
  cards: string[]
  size?: 'sm' | 'lg'
}) {
  return (
    <div class={`cards${size === 'lg' ? ' lg' : ''}`}>
      {cards.map((c, i) => (
        <span key={i} class={`mini${RED.some((s) => c.includes(s)) ? ' red' : ''}`}>
          {c}
        </span>
      ))}
    </div>
  )
}
