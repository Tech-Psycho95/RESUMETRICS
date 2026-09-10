import { createContext, useContext, useEffect, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase.js'

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return undefined
    }

    return onAuthStateChanged(auth, user => {
      setCurrentUser(user)
      setLoading(false)
    }, authError => {
      console.error('Firebase auth state error:', authError)
      setError(authError)
      setLoading(false)
    })
  }, [])

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase authentication is not configured.')
    const provider = new GoogleAuthProvider()
    provider.addScope('email')
    provider.addScope('profile')
    setError(null)
    const result = await signInWithPopup(auth, provider)
    return result.user
  }

  const signOut = () => auth ? firebaseSignOut(auth) : Promise.resolve()

  return <AuthContext.Provider value={{ currentUser, loading, error, isConfigured: isFirebaseConfigured, signInWithGoogle, signOut }}>
    {children}
  </AuthContext.Provider>
}
