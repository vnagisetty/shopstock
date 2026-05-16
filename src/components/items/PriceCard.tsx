interface Props {
  label: string
  price: number | null
  variant: 'base' | 'retail' | 'wholesale'
}

const variantStyles = {
  base: 'bg-blue-50 text-blue-700',
  retail: 'bg-teal-50 text-teal-700',
  wholesale: 'bg-purple-50 text-purple-700',
}

export function PriceCard({ label, price, variant }: Props) {
  if (price === null) return null
  return (
    <div className={`rounded-xl p-4 flex flex-col gap-1 ${variantStyles[variant]}`}>
      <span className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-2xl font-bold">${Number(price).toFixed(2)}</span>
    </div>
  )
}
