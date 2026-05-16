import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { compressImage } from '@/lib/imageCompress'

interface Props {
  currentUrl?: string
  onBlob: (blob: Blob | null) => void
}

export function IconField({ currentUrl, onBlob }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    try {
      const blob = await compressImage(file)
      const url = URL.createObjectURL(blob)
      setPreview(url)
      onBlob(blob)
    } catch {
      setError('Failed to process image')
    }
  }

  function handleRemove() {
    setPreview(null)
    onBlob(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const displayUrl = preview ?? currentUrl ?? null

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">Item Icon</label>
      <div className="flex items-center gap-3">
        {displayUrl ? (
          <div className="relative w-20 h-20">
            <img src={displayUrl} alt="Item icon" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-colors"
          >
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-xs">Photo</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }}
        />
        {!displayUrl && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm text-teal-600 font-medium"
          >
            Choose image
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
