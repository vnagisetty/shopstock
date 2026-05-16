import { useEffect, useRef } from 'react'
import { useOffline } from './useOffline'
import { flushWriteQueue } from '@/lib/writeQueue'

export function useWriteQueue(onFlushed?: () => void) {
  const offline = useOffline()
  const prevOffline = useRef(offline)

  useEffect(() => {
    if (prevOffline.current && !offline) {
      // Just came back online
      void flushWriteQueue().then(() => { onFlushed?.() })
    }
    prevOffline.current = offline
  }, [offline, onFlushed])
}
