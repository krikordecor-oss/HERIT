'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const supabase = createClient()
  const [form, setForm] = useState({ email: '', password: '', prenom: '', nom: '' })
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (authError) throw authError

      // Save profile details
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            prenom: form.prenom,
            nom: form.nom
          })

        if (profileError) throw profileError
      }

      setDone(true)
      setTimeout(() => window.location.href = '/dashboard', 1500)
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue lors de la création du compte.')
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '16px 0 8px' }}>Créer mon espace HERIT</h1>
          <p style={{ color: '#8B949E' }}>Gratuit · Sans engagement · Données privées</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#161B22', borderRadius: '16px', border: '1px solid #00D4AA' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ color: '#00D4AA' }}>Bienvenue dans votre espace HERIT !</h2>
            <p style={{ color: '#8B949E', marginTop: '8px' }}>Redirection vers votre tableau de bord...</p>
          </div>
        ) : (
          <div style={{ background: '#161B22', borderRadius: '16px', padding: '32px', border: '1px solid #21262D' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ color: '#8B949E', fontSize: '0.85rem' }}>Prénom</label>
                <input style={inputStyle} placeholder="Jean" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
              </div>
              <div>
                <label style={{ color: '#8B949E', fontSize: '0.85rem' }}>Nom</label>
                <input style={inputStyle} placeholder="Dupont" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#8B949E', fontSize: '0.85rem' }}>Email</label>
              <input style={inputStyle} type="email" placeholder="jean@exemple.fr" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#8B949E', fontSize: '0.85rem' }}>Mot de passe</label>
              <input style={inputStyle} type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            {error && <p style={{ color: '#FF4444', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</p>}

            <button onClick={handleSignup} disabled={loading}
              style={{ width: '100%', padding: '16px', background: loading ? '#444' : '#FF6B35', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Création en cours...' : 'Créer mon espace HERIT →'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '16px', color: '#484F58', fontSize: '0.85rem' }}>
              Déjà un compte ? <Link href="/login" style={{ color: '#FF6B35', textDecoration: 'none' }}>Se connecter</Link>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
