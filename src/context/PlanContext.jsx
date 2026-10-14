import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { getPlan } from '../utils/userApi.js'

// The signed-in account's plan (shared/plans.js) and resume allowance, for the sidebar, the plan page and the Pro gates.
// The server enforces every limit; this only decides what to show, so while it is unknown nothing is locked.
const PlanContext = createContext(null)
const UNKNOWN = { loading: true, plan: null, pro: false, resumes: null }

export function PlanProvider({ children }) {
  const { currentUser } = useAuth()
  const uid = currentUser?.uid ?? null
  const [state, setState] = useState(UNKNOWN)

  const refresh = useCallback(async () => {
    if (!uid) { setState({ ...UNKNOWN, loading: false }); return }
    try {
      const { plan, pro, resumes } = await getPlan()
      setState({ loading: false, plan, pro, resumes })
    } catch (error) {
      console.error('[Plan] Could not load the plan:', error)
      setState(current => ({ ...current, loading: false }))
    }
  }, [uid])

  useEffect(() => {
    setState(UNKNOWN)
    refresh()
  }, [refresh])

  const value = useMemo(() => {
    const { resumes } = state
    const remaining = resumes && resumes.limit !== null ? Math.max(0, resumes.limit - resumes.used) : null
    return { ...state, refresh, remaining, canCreateResume: state.pro || remaining === null || remaining > 0, locked: !state.loading && !state.pro }
  }, [state, refresh])

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan() {
  const context = useContext(PlanContext)
  if (!context) throw new Error('usePlan must be used within a PlanProvider')
  return context
}
