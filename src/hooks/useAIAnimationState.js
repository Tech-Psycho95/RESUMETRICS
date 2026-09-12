import { useCallback, useEffect, useRef, useState } from 'react'

export const MIN_THINKING_MS = 1000
export const MIN_PROCESSING_MS = 800
export const SUCCESS_MS = 800
export const EXCLAIM_MS = 1200

export default function useAIAnimationState() {
  const [taskState, setTaskState] = useState(null)
  const runIdRef = useRef(0)
  const timersRef = useRef(new Set())

  useEffect(() => () => {
    runIdRef.current += 1
    timersRef.current.forEach(timer => window.clearTimeout(timer))
    timersRef.current.clear()
  }, [])

  const wait = useCallback(duration => new Promise(resolve => {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer)
      resolve()
    }, duration)
    timersRef.current.add(timer)
  }), [])

  const beginRun = useCallback((initialState = 'thinking') => {
    const runId = runIdRef.current + 1
    runIdRef.current = runId
    setTaskState(initialState)
    return runId
  }, [])

  const isCurrentRun = useCallback(runId => runIdRef.current === runId, [])

  const setRunState = useCallback((runId, nextState) => {
    if (runIdRef.current === runId) setTaskState(nextState)
  }, [])

  const finishRun = useCallback(runId => {
    if (runIdRef.current === runId) setTaskState(null)
  }, [])

  const cancelRun = useCallback(() => {
    runIdRef.current += 1
    setTaskState(null)
  }, [])

  return { taskState, beginRun, isCurrentRun, setRunState, finishRun, cancelRun, wait }
}
