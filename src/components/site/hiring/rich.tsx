// Texto del home con énfasis simple: **así** se ve en negritas.
export default function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, i) =>
        i % 2 ? (
          <strong key={i} className='font-semibold'>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  )
}
