// Tres datos duros de un sistema, en grande: lo que alguien apunta en sus notas.
export default function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className='mt-5 flex flex-wrap gap-x-8 gap-y-3'>
      {items.map(([value, label]) => (
        <div key={value} className='pl-3' style={{ borderLeft: '2px solid var(--accent)' }}>
          <dt className='site-display text-[19px] leading-tight font-bold' style={{ letterSpacing: '-0.02em' }}>
            {value}
          </dt>
          <dd className='text-[12.5px]' style={{ color: 'var(--muted)' }}>
            {label}
          </dd>
        </div>
      ))}
    </dl>
  )
}
