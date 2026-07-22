'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (authError) throw authError

      window.location.href = '/dashboard'
    } catch (e: any) {
      setError(e.message || 'Identifiants incorrects ou erreur de connexion.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '14px', background: '#21262D',
    border: '1px solid #30363D', borderRadius: '8px',
    color: 'white', fontSize: '1rem', boxSizing: 'border-box' as const, marginTop: '8px'
  }

  return (
    <main style={{ backgroundColor: '#0D1117', color: 'white', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '2rem', fontWeight: '900', color: '#FF6B35', textDecoration: 'none' }}>🌡️ HERIT</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '16px 0 8px' }}>Connexion à votre espace</h1>
          <p style={{ color: '#8B949E' }}>Accédez à la mémoire thermique de vos bâtiments</p>
        </div>

        <div style={{ background: '#161B22', borderRadius: '16px', padding: '32px', border: '1px solid #21262D' }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#8B949E', fontSize: '0.85rem' }}>Email</label>
              <input style={inputStyle} type="email" placeholder="jean@exemple.fr" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#8B949E', fontSize: '0.85rem' }}>Mot de passe</label>
              <input style={inputStyle} type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            {error && <p style={{ color: '#FF4444', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</p>}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '16px', background: loading ? '#444' : '#FF6B35', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '16px', color: '#484F58', fontSize: '0.85rem' }}>
            Pas encore de compte ? <Link href="/signup" style={{ color: '#FF6B35', textDecoration: 'none' }}>S'inscrire</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
