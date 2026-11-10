// Texto del home con énfasis simple: **así** se ve en negritas.
// `strong`: color de las negritas cuando el texto alrededor va atenuado.
export default function Rich({ text, strong }: { text: string; strong?: string }) {
  return (
    <>
      {text.split('**').map((part, i) =>
        i % 2 ? (
          <strong key={i} className='font-semibold' style={strong ? { color: strong } : undefined}>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  )
}
