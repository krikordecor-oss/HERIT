'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Carnet {
  id: string
  nom: string
  adresse: string
  annee: string
  surface: string
  type: string
  etages: string
  score: number
  createdAt: string
  diagnostics: any[]
  travaux: any[]
  documents: any[]
  artisans: any[]
}

interface User {
  prenom: string
  nom: string
  email: string
}

export default function DashboardPage() {
  const supabase = createClient()
  const [carnet, setCarnet] = useState<Carnet | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [objectiveScore, setObjectiveScore] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !authUser) throw authError

        const { data: profile } = await supabase
          .from('profiles')
          .select('prenom, nom, email')
          .eq('id', authUser.id)
          .single()

        const { data: building } = await supabase
          .from('buildings')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (profile) setUser(profile)
        if (building) setCarnet(building)
      } catch (e) {
        console.error('Error loading dashboard data:', e)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getCompletion = () => {
    if (!carnet) return 0
    let score = 0
    if (carnet.nom) score += 15
    if (carnet.adresse) score += 15
    if (carnet.annee) score += 10
    if (carnet.surface) score += 10
    if (carnet.type) score += 10
    if (carnet.diagnostics?.length > 0) score += 20
    if (carnet.travaux?.length > 0) score += 10
    if (carnet.documents?.length > 0) score += 10
    return score
  }

  const getHealth = (score: number) => {
    if (score <= 30) return { label: 'Bonne santé', emoji: '🟢', color: '#00D4AA', bg: '#00D4AA10', border: '#00D4AA40' }
    if (score <= 50) return { label: 'À surveiller', emoji: '🟡', color: '#FFD700', bg: '#FFD70010', border: '#FFD70040' }
    if (score <= 70) return { label: 'À améliorer', emoji: '🟠', color: '#FFA500', bg: '#FFA50010', border: '#FFA50040' }
    return { label: 'Critique', emoji: '🔴', color: '#FF4444', bg: '#FF444410', border: '#FF444440' }
  }

  const handleWaitlist = async () => {
    if (waitlistEmail) {
      setWaitlistDone(true)
      await supabase.from('waitlist').insert({ email: waitlistEmail })
    }
  }

  if (loading) return (
    <main style={{ backgroundColor: '#0D1117', color: 'white', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⌛</div>
        <p>Chargement de votre espace HERIT...</p>
      </div>
    </main>
  )

  if (!carnet) return (
    <main style={{ backgroundColor: '#0D1117', color: 'white', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '20px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📋</div>
        <h2 style={{ marginBottom: '16px' }}>Aucun passeport trouvé</h2>
        <p style={{ color: '#8B949E', marginBottom: '24px' }}>Commencez par un diagnostic pour créer le passeport de votre bâtiment.</p>
        <Link href="/diagnostic" style={{ background: '#FF6B35', color: 'white', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          Démarrer le diagnostic
        </Link>
      </div>
    </main>
  )

  const health = getHealth(carnet.score)
  const completion = getCompletion()

  const tabs = [
    { id: 'overview', label: '🏠 Mon bâtiment' },
    { id: 'score', label: '🌡️ Santé thermique' },
    { id: 'risques', label: '⚠️ Risques' },
    { id: 'energie', label: '⚡ Énergie' },
    { id: 'travaux', label: '🔧 Travaux' },
    { id: 'documents', label: '📄 Documents' },
    { id: 'artisans', label: '👷 Professionnels' },
    { id: 'evolution', label: '📈 Évolution' },
  ]

  return (
    <main style={{ backgroundColor: '#0D1117', color: 'white', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', borderBottom: '1px solid #21262D', background: '#0D1117', position: 'sticky', top: 0, zIndex: 100, flexWrap: 'wrap', gap: '12px' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FF6B35', textDecoration: 'none' }}>🌡️ HERIT</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user && <span style={{ color: '#8B949E', fontSize: '0.9rem' }}>👋 <strong style={{ color: 'white' }}>{user.prenom}</strong></span>}
          <Link href="/diagnostic" style={{ background: '#FF6B35', color: 'white', padding: '8px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
            + Nouveau diagnostic
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>

        {/* COMPLÉTION */}
        <div style={{ background: '#161B22', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', border: '1px solid #21262D' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: '700' }}>📋 Passeport Thermique — Complété à {completion}%</span>
            <span style={{ color: completion >= 80 ? '#00D4AA' : '#FFA500', fontWeight: '700' }}>{completion}%</span>
          </div>
          <div style={{ background: '#21262D', borderRadius: '10px', height: '8px' }}>
            <div style={{ width: `${completion}%`, background: completion >= 80 ? '#00D4AA' : '#FF6B35', height: '100%', borderRadius: '10px', transition: 'width 0.5s' }}></div>
          </div>
          <p style={{ color: '#484F58', fontSize: '0.8rem', marginTop: '6px' }}>
            {completion < 50 ? 'Enrichissez votre passeport pour augmenter sa valeur' : completion < 80 ? 'Bon début ! Continuez à documenter votre bâtiment' : 'Excellent ! Votre passeport est bien renseigné'}
          </p>
        </div>

        {/* HEADER BÂTIMENT */}
        <div style={{ background: 'linear-gradient(135deg, #161B22, #1A2A4A)', borderRadius: '16px', padding: '32px', marginBottom: '24px', border: '1px solid #21262D', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ color: '#484F58', fontSize: '0.8rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '2px' }}>PASSEPORT THERMIQUE</div>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: '0 0 8px' }}>{carnet.nom || 'Mon bâtiment'}</h1>
            <div style={{ color: '#8B949E', marginBottom: '12px' }}>📍 {carnet.adresse || 'Adresse non renseignée'}</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {carnet.annee && <span style={{ background: '#21262D', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>📅 {carnet.annee}</span>}
              {carnet.surface && <span style={{ background: '#21262D', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>📐 {carnet.surface} m²</span>}
              {carnet.type && <span style={{ background: '#21262D', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>🏠 {carnet.type}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'center', background: health.bg, padding: '24px 32px', borderRadius: '14px', border: `2px solid ${health.border}` }}>
            <div style={{ fontSize: '0.75rem', color: '#484F58', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>SANTÉ THERMIQUE</div>
            <div style={{ fontSize: '3rem', margin: '4px 0' }}>{health.emoji}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: health.color }}>{health.label}</div>
            <div style={{ fontSize: '0.75rem', color: '#484F58', marginTop: '4px' }}>Score interne : {carnet.score}/100</div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '9px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: activeTab === tab.id ? '700' : '400', background: activeTab === tab.id ? '#FF6B35' : '#161B22', color: activeTab === tab.id ? 'white' : '#8B949E' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { e: '🌡️', t: 'Santé thermique', v: `${health.emoji} ${health.label}`, c: health.color },
                { e: '📅', t: 'Passeport créé le', v: new Date(carnet.createdAt).toLocaleDateString('fr-FR'), c: '#8B949E' },
                { e: '🔧', t: 'Travaux', v: `${carnet.travaux?.length || 0} enregistré(s)`, c: '#8B949E' },
                { e: '📄', t: 'Documents', v: `${carnet.documents?.length || 0} document(s)`, c: '#8B949E' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#161B22', borderRadius: '12px', padding: '20px', border: '1px solid #21262D' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>{item.e}</div>
                  <div style={{ color: '#484F58', fontSize: '0.8rem', marginBottom: '4px' }}>{item.t}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: item.c }}>{item.v}</div>
                </div>
              ))}
            </div>

            {/* 4 MODULES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {[
                { e: '⚠️', t: 'Risques naturels', d: 'Canicule · Inondation · Séisme · Incendie', tab: 'risques', color: '#FF4444' },
                { e: '⚡', t: 'Énergie', d: 'Électricité · Eau · Gaz · Production solaire', tab: 'energie', color: '#FFD700' },
                { e: '📄', t: 'Documents', d: 'DPE · Factures · Garanties · Photos', tab: 'documents', color: '#00D4AA' },
                { e: '📈', t: 'Évolution', d: 'Suivi du score dans le temps', tab: 'evolution', color: '#FF6B35' },
              ].map((card, i) => (
                <div key={i} onClick={() => setActiveTab(card.tab)}
                  style={{ background: '#161B22', borderRadius: '12px', padding: '24px', border: `2px dashed ${card.color}30`, cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = card.color)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = `${card.color}30`)}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{card.e}</div>
                  <div style={{ fontWeight: '700', marginBottom: '6px', color: card.color }}>{card.t}</div>
                  <div style={{ color: '#484F58', fontSize: '0.8rem' }}>{card.d}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SANTÉ THERMIQUE */}
        {activeTab === 'score' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: '#161B22', borderRadius: '16px', padding: '32px', border: '1px solid #21262D', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '24px', color: '#ccc' }}>Score actuel</h3>
              <div style={{ fontSize: '4rem', marginBottom: '8px' }}>{health.emoji}</div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: health.color, marginBottom: '8px' }}>{health.label}</div>
              <div style={{ background: '#21262D', borderRadius: '10px', height: '12px', margin: '16px 0' }}>
                <div style={{ width: `${carnet.score}%`, background: health.color, height: '100%', borderRadius: '10px' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#484F58' }}>
                <span>🟢 Bonne</span><span>🟡 Surveiller</span><span>🟠 Améliorer</span><span>🔴 Critique</span>
              </div>
              <p style={{ color: '#484F58', fontSize: '0.8rem', marginTop: '16px' }}>Score interne : {carnet.score}/100</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* SCORE VIVANT */}
              <div style={{ background: '#161B22', borderRadius: '16px', padding: '24px', border: '1px solid #21262D' }}>
                <h3 style={{ marginBottom: '16px', color: '#ccc', fontSize: '1rem' }}>📊 Score vivant</h3>
                {[
                  { label: 'Aujourd\'hui', score: carnet.score, health: getHealth(carnet.score), current: true },
                  { label: 'Dans 5 ans (sans travaux)', score: Math.min(100, carnet.score + 8), health: getHealth(Math.min(100, carnet.score + 8)), current: false },
                  { label: 'Après travaux recommandés', score: Math.max(0, carnet.score - 25), health: getHealth(Math.max(0, carnet.score - 25)), current: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: item.current ? '#21262D' : 'transparent', borderRadius: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', color: item.current ? 'white' : '#8B949E' }}>{item.label}</span>
                    <span style={{ fontWeight: '700', color: item.health.color }}>{item.health.emoji} {item.health.label}</span>
                  </div>
                ))}
              </div>

              {/* OBJECTIF */}
              <div style={{ background: '#161B22', borderRadius: '16px', padding: '24px', border: '1px solid #21262D' }}>
                <h3 style={{ marginBottom: '16px', color: '#ccc', fontSize: '1rem' }}>🎯 Mon objectif</h3>
                <p style={{ color: '#8B949E', fontSize: '0.85rem', marginBottom: '12px' }}>Définissez votre objectif de santé thermique :</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: '🟢 Bonne santé', value: 25 },
                    { label: '🟡 À surveiller', value: 45 },
                  ].map((obj, i) => (
                    <button key={i} onClick={() => setObjectiveScore(obj.value)}
                      style={{ padding: '8px 14px', borderRadius: '8px', border: `2px solid ${objectiveScore === obj.value ? '#FF6B35' : '#21262D'}`, background: objectiveScore === obj.value ? '#FF6B3520' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
                      {obj.label}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '12px', padding: '10px', background: '#FF6B3510', borderRadius: '8px', border: '1px solid #FF6B3540' }}>
                  <span style={{ color: '#FF6B35', fontSize: '0.85rem' }}>Objectif : atteindre <strong style={{color: 'white'}}>{getHealth(objectiveScore).emoji} {getHealth(objectiveScore).label}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RISQUES */}
        {activeTab === 'risques' && (
          <div>
            <div style={{ background: '#161B22', borderRadius: '16px', padding: '32px', border: '1px solid #21262D', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '8px' }}>⚠️ Risques naturels</h3>
              <p style={{ color: '#8B949E', marginBottom: '24px', fontSize: '0.9rem' }}>Évaluation des risques climatiques pour votre bâtiment et sa localisation.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                  { e: '🌡️', t: 'Canicule', r: 'Élevé', c: '#FF4444', d: 'Zone à risque élevé de surchauffe estivale' },
                  { e: '🌊', t: 'Inondation', r: 'Faible', c: '#00D4AA', d: 'Zone non inondable' },
                  { e: '🌍', t: 'Séisme', r: 'Modéré', c: '#FFA500', d: 'Zone de sismicité modérée' },
                  { e: '🔥', t: 'Incendie', r: 'Faible', c: '#00D4AA', d: 'Zone urbaine à faible risque' },
                  { e: '🌪️', t: 'Tempête', r: 'Modéré', c: '#FFA500', d: 'Exposition aux vents fréquents' },
                  { e: '🏔️', t: 'Mouvement terrain', r: 'Faible', c: '#00D4AA', d: 'Terrain stable' },
                  { e: '🪨', t: 'Retrait argiles', r: 'Modéré', c: '#FFA500', d: 'Zone sensible au retrait-gonflement' },
                ].map((risk, i) => (
                  <div key={i} style={{ background: '#0D1117', borderRadius: '10px', padding: '16px', border: `1px solid ${risk.c}30` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.5rem' }}>{risk.e}</span>
                      <span style={{ background: `${risk.c}20`, color: risk.c, padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>{risk.r}</span>
                    </div>
                    <div style={{ fontWeight: '700', marginBottom: '4px', fontSize: '0.9rem' }}>{risk.t}</div>
                    <div style={{ color: '#484F58', fontSize: '0.8rem' }}>{risk.d}</div>
                  </div>
                ))}
              </div>
              <p style={{ color: '#484F58', fontSize: '0.8rem', marginTop: '20px', fontStyle: 'italic' }}>
                * Données indicatives. Connectez votre adresse pour obtenir une évaluation précise basée sur les données officielles.
              </p>
            </div>

            {/* CANICULE DÉTAILLÉE */}
            <div style={{ background: '#FF444410', borderRadius: '16px', padding: '24px', border: '1px solid #FF444430' }}>
              <h3 style={{ color: '#FF4444', marginBottom: '16px' }}>🌡️ Projection canicule</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { year: '2030', days: 12, temp: '+2.1°C' },
                  { year: '2050', days: 28, temp: '+3.8°C' },
                  { year: '2080', days: 45, temp: '+5.2°C' },
                ].map((proj, i) => (
                  <div key={i} style={{ background: '#0D1117', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ color: '#FF4444', fontWeight: '900', fontSize: '1.3rem' }}>{proj.year}</div>
                    <div style={{ color: 'white', fontWeight: '700', marginTop: '4px' }}>{proj.days} jours</div>
                    <div style={{ color: '#FF4444', fontSize: '0.85rem' }}>de canicule/an</div>
                    <div style={{ color: '#FFA500', fontSize: '0.8rem', marginTop: '4px' }}>{proj.temp} en moyenne</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ÉNERGIE */}
        {activeTab === 'energie' && (
          <div>
            <div style={{ background: '#161B22', borderRadius: '16px', padding: '32px', border: '1px solid #21262D', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '8px' }}>⚡ Consommations énergétiques</h3>
              <p style={{ color: '#8B949E', marginBottom: '24px', fontSize: '0.9rem' }}>Suivez l'évolution de vos consommations année après année.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[
                  { e: '⚡', t: 'Électricité', v: '— kWh', c: '#FFD700' },
                  { e: '💧', t: 'Eau', v: '— m³', c: '#00D4AA' },
                  { e: '🔥', t: 'Gaz', v: '— kWh', c: '#FFA500' },
                  { e: '🪵', t: 'Bois', v: '— stères', c: '#8B6914' },
                  { e: '🛢️', t: 'Fioul', v: '— litres', c: '#484F58' },
                  { e: '☀️', t: 'Production solaire', v: '— kWh', c: '#FF6B35' },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#0D1117', borderRadius: '10px', padding: '16px', textAlign: 'center', border: '1px solid #21262D' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{item.e}</div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>{item.t}</div>
                    <div style={{ color: item.c, fontSize: '1.1rem', fontWeight: '900' }}>{item.v}</div>
                    <button style={{ marginTop: '8px', background: 'transparent', border: `1px solid ${item.c}40`, color: item.c, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>
                      + Ajouter
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ background: '#0D1117', borderRadius: '10px', padding: '16px', border: '1px solid #21262D', textAlign: 'center' }}>
                <p style={{ color: '#484F58', fontSize: '0.85rem' }}>
                  📊 Les graphiques d'évolution apparaîtront dès que vous aurez renseigné vos consommations.
                </p>
              </div>
            </div>

            {/* HERIT PLUS */}
            <div style={{ background: 'linear-gradient(135deg, #1A1A2E, #16213E)', borderRadius: '16px', padding: '24px', border: '2px solid #FF6B35', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '8px', color: '#FF6B35' }}>⭐ HERIT Plus</h3>
              <p style={{ color: '#8B949E', marginBottom: '16px', fontSize: '0.9rem' }}>Alertes avant les canicules · Comparaison année après année · Rapport PDF professionnel</p>
              <Link href="/signup" style={{ display: 'inline-block', background: '#FF6B35', color: 'white', padding: '12px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700' }}>
                Passer à HERIT Plus — 9,90€/mois
              </Link>
            </div>
          </div>
        )}

        {/* TRAVAUX */}
        {activeTab === 'travaux' && (
          <div style={{ background: '#161B22', borderRadius: '16px', padding: '32px', border: '1px solid #21262D' }}>
            <h3 style={{ marginBottom: '24px' }}>🔧 Historique des travaux</h3>
            <div style={{ borderLeft: '2px solid #21262D', paddingLeft: '24px', marginBottom: '24px' }}>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <div style={{ position: 'absolute', left: '-32px', top: '4px', width: '12px', height: '12px', background: '#FF6B35', borderRadius: '50%' }}></div>
                <div style={{ color: '#484F58', fontSize: '0.8rem' }}>{new Date(carnet.createdAt).toLocaleDateString('fr-FR')}</div>
                <div style={{ fontWeight: '700', margin: '4px 0' }}>Création du Passeport Thermique</div>
                <div style={{ color: '#8B949E', fontSize: '0.85rem' }}>Santé thermique initiale : <span style={{ color: health.color, fontWeight: '700' }}>{health.emoji} {health.label}</span></div>
              </div>
              {[
                { label: 'Travaux d\'isolation', date: 'À planifier', color: '#00D4AA' },
                { label: 'Remplacement des fenêtres', date: 'À planifier', color: '#00D4AA' },
                { label: 'Protections solaires', date: 'À planifier', color: '#FFA500' },
              ].map((item, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: '16px', opacity: 0.4 }}>
                  <div style={{ position: 'absolute', left: '-29px', top: '4px', width: '8px', height: '8px', background: '#21262D', borderRadius: '50%', border: '2px solid #30363D' }}></div>
                  <div style={{ color: '#484F58', fontSize: '0.8rem' }}>📅 {item.date}</div>
                  <div style={{ color: '#8B949E', fontSize: '0.9rem' }}>{item.label}</div>
                </div>
              ))}
            </div>
            <button style={{ background: '#FF6B35', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Enregistrer des travaux
            </button>
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === 'documents' && (
          <div style={{ background: '#161B22', borderRadius: '16px', padding: '32px', border: '1px solid #21262D' }}>
            <h3 style={{ marginBottom: '8px' }}>📄 Documents du bâtiment</h3>
            <p style={{ color: '#8B949E', marginBottom: '24px', fontSize: '0.9rem' }}>Centralisez tous vos documents au même endroit.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { e: '📋', t: 'DPE', n: 0 },
                { e: '🔍', t: 'Diagnostics', n: 0 },
                { e: '📐', t: 'Plans', n: 0 },
                { e: '🛡️', t: 'Assurance', n: 0 },
                { e: '✅', t: 'Garanties', n: 0 },
                { e: '🏗️', t: 'Permis', n: 0 },
                { e: '🧾', t: 'Factures', n: 0 },
                { e: '📸', t: 'Photos', n: 0 },
              ].map((doc, i) => (
                <div key={i} style={{ background: '#21262D', borderRadius: '10px', padding: '16px', textAlign: 'center', border: '2px dashed #30363D', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#FF6B35')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#30363D')}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{doc.e}</div>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '4px' }}>{doc.t}</div>
                  <div style={{ fontSize: '0.75rem', color: '#484F58' }}>{doc.n} fichier</div>
                  <div style={{ fontSize: '0.75rem', color: '#FF6B35', marginTop: '6px' }}>+ Ajouter</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFESSIONNELS */}
        {activeTab === 'artisans' && (
          <div style={{ background: '#161B22', borderRadius: '16px', padding: '32px', border: '1px solid #21262D' }}>
            <h3 style={{ marginBottom: '8px' }}>👷 Professionnels intervenus</h3>
            <p style={{ color: '#8B949E', marginBottom: '24px', fontSize: '0.9rem' }}>Conservez l'historique de tous les professionnels qui sont intervenus sur votre bâtiment.</p>
            <div style={{ textAlign: 'center', padding: '40px', color: '#484F58' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👷</div>
              <p style={{ marginBottom: '8px' }}>Aucun professionnel enregistré.</p>
              <p style={{ fontSize: '0.85rem' }}>Chaque intervention enrichit votre Passeport et augmente la valeur de votre bien.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button style={{ background: '#FF6B35', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                + Ajouter un professionnel
              </button>
              <a href="mailto:krikordecor@gmail.com?subject=Mise en relation professionnel HERIT"
                style={{ background: '#21262D', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block' }}>
                🤝 Trouver un professionnel HERIT
              </a>
            </div>
          </div>
        )}

        {/* ÉVOLUTION */}
        {activeTab === 'evolution' && (
          <div>
            <div style={{ background: '#161B22', borderRadius: '16px', padding: '32px', border: '1px solid #21262D', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '8px' }}>📈 Évolution de la santé thermique</h3>
              <p style={{ color: '#8B949E', marginBottom: '24px', fontSize: '0.9rem' }}>Suivi de la santé thermique d'un bâtiment sur la durée.</p>

              <div style={{ background: '#0D1117', borderRadius: '12px', padding: '24px', height: '200px', display: 'flex', alignItems: 'flex-end', gap: '12px', justifyContent: 'center', position: 'relative', marginBottom: '16px' }}>
                {[
                  { year: '2026', score: carnet.score, current: true },
                  { year: '2027', score: Math.min(100, carnet.score + 3), current: false },
                  { year: '2028', score: Math.max(0, carnet.score - 10), current: false },
                  { year: '2030', score: Math.max(0, carnet.score - 18), current: false },
                  { year: '2035', score: Math.max(0, carnet.score - 28), current: false },
                ].map((item, i) => {
                  const h = getHealth(item.score)
                  return (
                    <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '0.7rem', color: item.current ? h.color : '#484F58', marginBottom: '4px', fontWeight: item.current ? '700' : '400' }}>{h.emoji}</div>
                      <div style={{ background: item.current ? h.color : '#21262D', height: `${(item.score / 100) * 120}px`, borderRadius: '4px 4px 0 0', opacity: item.current ? 1 : 0.5, minHeight: '4px' }}></div>
                      <div style={{ fontSize: '0.7rem', color: item.current ? 'white' : '#484F58', marginTop: '4px' }}>{item.year}</div>
                    </div>
                  )
                })}
                <div style={{ position: 'absolute', top: '8px', right: '12px', fontSize: '0.7rem', color: '#484F58', fontStyle: 'italic' }}>Projections indicatives</div>
              </div>
              <p style={{ color: '#484F58', fontSize: '0.8rem' }}>
                * Les projections sont calculées sur la base de votre diagnostic actuel. Réalisez des travaux pour améliorer votre score.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
