import { useState, useMemo, useRef } from 'react'
import { SearchBar } from '@/components/items/SearchBar'
import { CategoryPills } from '@/components/items/CategoryPills'
import { ItemList } from '@/components/items/ItemList'
import { useInventory } from '@/hooks/useInventory'
import { useCategories } from '@/hooks/useCategories'
import { useWriteQueue } from '@/hooks/useWriteQueue'
import { trackRead } from '@/lib/analytics'

export function ItemsPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { items, loading, reload } = useInventory()
  const { categories } = useCategories()

  useWriteQueue(reload)

  function handleSearch(val: string) {
    setSearch(val)
    if (val.trim()) {
      if (searchTimer.current) clearTimeout(searchTimer.current)
      searchTimer.current = setTimeout(() => trackRead('search'), 1000)
    }
  }

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat)
    if (cat !== 'All') trackRead('filter_category')
  }

  const filtered = useMemo(() => {
    let list = items
    if (activeCategory !== 'All') {
      list = list.filter((i) => i.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) =>
          i.item_name.toLowerCase().includes(q) ||
          i.item_id.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q),
      )
    }
    return list
  }, [items, activeCategory, search])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-1 bg-white border-b border-gray-100 sticky top-0 z-10">
        <SearchBar value={search} onChange={handleSearch} />
        <CategoryPills categories={categories} active={activeCategory} onChange={handleCategoryChange} />
      </div>
      <ItemList items={filtered} loading={loading} />
    </div>
  )
}
