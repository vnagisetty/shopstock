import type { Category } from '@/lib/types'

interface Props {
  categories: Category[]
  active: string
  onChange: (cat: string) => void
}

export function CategoryPills({ categories, active, onChange }: Props) {
  const pills = ['All', ...categories.map((c) => c.category_name)]

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2">
      {pills.map((name) => (
        <button
          key={name}
          onClick={() => onChange(name)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
            active === name
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400'
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
