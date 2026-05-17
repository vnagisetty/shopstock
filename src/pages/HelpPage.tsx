import { Mail, Package, Search, Tag, Users, WifiOff, Camera, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface FAQItem {
  q: string
  a: string
}

const faqs: FAQItem[] = [
  {
    q: 'Can I use ShopStock without internet?',
    a: 'Yes. ShopStock works fully offline. Any changes you make are saved on your device and automatically synced to the cloud the next time you come online.',
  },
  {
    q: 'How do I add a new item?',
    a: 'Tap the + button on the Items screen. Fill in the item name, category, and prices. You can also take a photo — it will be saved as a small thumbnail.',
  },
  {
    q: 'Who can edit items?',
    a: 'Managers and staff with edit permission can add and update items. Managers can also manage categories and invite new staff.',
  },
  {
    q: 'What are the three prices for?',
    a: 'Base Price is your cost / purchase price. Retail Price is what you charge customers. Wholesale Price is an optional discounted price for bulk buyers.',
  },
  {
    q: 'How do I invite someone to my store?',
    a: 'Go to Settings → Staff and tap "Invite". Enter their email address. They will receive a link to join your store.',
  },
  {
    q: 'Can I have multiple stores?',
    a: 'Each ShopStock account is linked to one store. If you manage multiple stores you can create separate accounts for each.',
  },
]

const features = [
  {
    icon: <ShoppingBag className="w-5 h-5 text-teal-600" />,
    title: 'Inventory management',
    desc: 'Add, edit, and track all your products in one place with names, categories, prices, stock quantities, and photos.',
  },
  {
    icon: <Search className="w-5 h-5 text-teal-600" />,
    title: 'Search & filter',
    desc: 'Instantly search by item name or filter by category to find any product in seconds.',
  },
  {
    icon: <Tag className="w-5 h-5 text-teal-600" />,
    title: 'Custom categories',
    desc: 'Create and organise your own categories — Dairy, Snacks, Electronics, or whatever fits your store.',
  },
  {
    icon: <Camera className="w-5 h-5 text-teal-600" />,
    title: 'Item photos',
    desc: 'Attach a thumbnail photo to each item so staff can identify products at a glance.',
  },
  {
    icon: <Users className="w-5 h-5 text-teal-600" />,
    title: 'Staff & roles',
    desc: 'Invite staff members and assign roles. Managers control settings; staff can browse and update stock.',
  },
  {
    icon: <WifiOff className="w-5 h-5 text-teal-600" />,
    title: 'Works offline',
    desc: 'All data is available even without internet. Changes sync automatically when connectivity is restored.',
  },
  {
    icon: <Package className="w-5 h-5 text-teal-600" />,
    title: 'Flexible pricing',
    desc: 'Set a base cost price, a retail price, and an optional wholesale price for each item.',
  },
]

function FAQRow({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full flex items-center justify-between py-3 text-left text-sm font-medium text-gray-800 gap-3"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{item.q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && <p className="pb-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>}
    </div>
  )
}

export function HelpPage() {
  const sectionTitle = 'text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3'

  return (
    <div className="p-4 space-y-6 pb-12">

      {/* What is ShopStock */}
      <div>
        <h2 className={sectionTitle}>About ShopStock</h2>
        <div className="bg-white rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
          ShopStock is a simple inventory management app built for small shops and retail stores.
          Keep track of your products, prices, and stock levels — from your phone, even without internet.
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className={sectionTitle}>What you can do</h2>
        <div className="bg-white rounded-xl divide-y divide-gray-100">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3 p-4">
              <div className="mt-0.5 shrink-0">{f.icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-800">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className={sectionTitle}>Frequently asked questions</h2>
        <div className="bg-white rounded-xl px-4">
          {faqs.map((item) => (
            <FAQRow key={item.q} item={item} />
          ))}
        </div>
      </div>

      {/* Contact */}
      <div>
        <h2 className={sectionTitle}>Contact us</h2>
        <div className="bg-white rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Email support</p>
            <a
              href="mailto:bhanutej431@gmail.com"
              className="text-sm text-teal-600 font-medium"
            >
              bhanutej431@gmail.com
            </a>
            <p className="text-xs text-gray-400 mt-0.5">We usually reply within 1–2 business days.</p>
          </div>
        </div>
      </div>

    </div>
  )
}
