// Tres datos duros de un sistema, en una sola tarjeta con divisores: lo que
// alguien apunta en sus notas. En móvil se apilan.
export default function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl
      className='grid w-full shrink-0 overflow-hidden rounded-[14px] sm:w-auto sm:auto-cols-fr sm:grid-flow-col'
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      {items.map(([value, label]) => (
        <div key={value} className='site-fact px-[18px] py-3'>
          <dt className='site-display text-[19px] leading-tight font-bold sm:whitespace-nowrap' style={{ letterSpacing: '-0.02em' }}>
            {value}
          </dt>
          <dd className='mt-0.5 text-[12.5px]' style={{ color: 'var(--muted)' }}>
            {label}
          </dd>
        </div>
      ))}
    </dl>
  )
}
