'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    const handleMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouse)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouse)
    }
  }, [])

  return (
    <main style={{ backgroundColor: '#050508', color: 'white', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>

      {/* CURSOR GLOW */}
      <div style={{
        position: 'fixed', width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 70%)',
        left: mousePos.x - 300, top: mousePos.y - 300,
        pointerEvents: 'none', zIndex: 0, transition: 'left 0.3s ease, top 0.3s ease'
      }} />

      {/* NAV */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 60px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 50 ? 'rgba(5,5,8,0.9)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #FF6B35, #FF4444)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🏛️</div>
          <span style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.5px' }}>HERIT</span>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {['Fonctionnement', 'Professionnels', 'Tarifs', 'Pourquoi ?'].map((item, i) => (
            <Link key={i} href={i === 0 ? '/pourquoi' : i === 1 ? '/artisans' : i === 3 ? '/pourquoi' : '#tarifs'}
              style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>
              {item}
            </Link>
          ))}
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.9rem' }}>Connexion</Link>
          <Link href="/diagnostic" style={{
            background: 'linear-gradient(135deg, #FF6B35, #FF4444)', color: 'white',
            padding: '10px 22px', borderRadius: '10px', textDecoration: 'none',
            fontWeight: '600', fontSize: '0.9rem', transition: 'opacity 0.2s'
          }}>
            Créer mon Passeport →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 20px 80px', textAlign: 'center', position: 'relative' }}>

        {/* GRID BACKGROUND */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)'
        }} />

        {/* GLOW ORBS */}
        <div style={{ position: 'absolute', top: '20%', left: '20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '30%', right: '15%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px' }}>

          {/* BADGE */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)',
            padding: '6px 16px', borderRadius: '100px', marginBottom: '32px',
            fontSize: '0.85rem', color: '#FF6B35'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B35', animation: 'pulse 2s infinite' }} />
            Le Passeport Climatique Mondial des bâtiments
          </div>

          {/* TITLE */}
          <h1 style={{
            fontSize: 'clamp(3.5rem, 8vw, 7rem)', fontWeight: '900',
            lineHeight: 1.0, letterSpacing: '-3px', marginBottom: '24px',
            transform: `translateY(${scrollY * 0.1}px)`
          }}>
            Chaque bâtiment<br />
            <span style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FFB347 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              mérite une mémoire.
            </span>
          </h1>

          {/* SUBTITLE */}
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.55)', maxWidth: '580px', margin: '0 auto 48px', lineHeight: 1.7, letterSpacing: '-0.2px' }}>
            Votre bâtiment vivra encore 50 à 100 ans. HERIT devient sa mémoire climatique — pour vous, et pour tous les propriétaires qui viendront après vous.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '64px' }}>
            <Link href="/diagnostic" style={{
              background: 'linear-gradient(135deg, #FF6B35, #FF4444)',
              color: 'white', padding: '16px 36px', borderRadius: '12px',
              textDecoration: 'none', fontWeight: '700', fontSize: '1rem',
              boxShadow: '0 0 40px rgba(255,107,53,0.3)',
              transition: 'all 0.3s ease', display: 'inline-block'
            }}>
              📋 Créer mon Passeport gratuitement
            </Link>
            <Link href="/pourquoi" style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'white', padding: '16px 32px', borderRadius: '12px',
              textDecoration: 'none', fontWeight: '600', fontSize: '1rem',
              backdropFilter: 'blur(10px)', display: 'inline-block'
            }}>
              Voir comment ça marche →
            </Link>
          </div>

          {/* TRUST */}
          <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['✓ Gratuit', '✓ Sans inscription', '✓ 46 langues', '✓ Mondial'].map((item, i) => (
              <span key={i} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>{item}</span>
            ))}
          </div>
        </div>

        {/* HERO CARD PREVIEW */}
        <div style={{
          position: 'relative', zIndex: 1, marginTop: '80px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px', padding: '32px', maxWidth: '520px', width: '100%',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 80px rgba(0,0,0,0.5), 0 0 40px rgba(255,107,53,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', marginBottom: '6px' }}>PASSEPORT THERMIQUE</div>
              <div style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.5px' }}>Maison individuelle</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '4px' }}>Construite en 1981 · Valence · 95 m²</div>
            </div>
            <div style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', borderRadius: '12px', padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>SANTÉ</div>
              <div style={{ fontSize: '1.5rem' }}>🟠</div>
              <div style={{ color: '#FFA500', fontWeight: '700', fontSize: '0.8rem' }}>À améliorer</div>
            </div>
          </div>

          {/* TIMELINE */}
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '20px', marginBottom: '20px' }}>
            {[
              { year: '2026', label: 'Création du Passeport', color: '#FF6B35', active: true },
              { year: '2028', label: 'Pose de volets extérieurs', color: '#00D4AA', active: false },
              { year: '2030', label: '⚠️ Alerte canicule prévue', color: '#FF4444', active: false },
              { year: '2041', label: 'Revente — Passeport transmis', color: '#FF6B35', active: false },
            ].map((item, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: '12px', opacity: item.active ? 1 : 0.4 }}>
                <div style={{ position: 'absolute', left: '-26px', top: '5px', width: '8px', height: '8px', background: item.color, borderRadius: '50%' }} />
                <span style={{ color: item.color, fontWeight: '700', fontSize: '0.8rem' }}>{item.year}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginLeft: '8px' }}>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <span style={{ color: '#00D4AA', fontWeight: '600', fontSize: '0.85rem' }}>Après travaux estimés : </span>
            <span style={{ color: 'white', fontWeight: '900' }}>-6°C en été 🌡️</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '80px 60px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', textAlign: 'center' }}>
          {[
            { n: '1,6 Md', l: 'bâtiments à diagnostiquer' },
            { n: '2027', l: 'obligation légale Europe DPP' },
            { n: '46', l: 'langues disponibles' },
            { n: '100 ans', l: 'de mémoire par bâtiment' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-2px', background: 'linear-gradient(135deg, #FF6B35, #FF8C42)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.n}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '8px', fontSize: '0.9rem' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section style={{ padding: '120px 60px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ fontSize: '0.8rem', color: '#FF6B35', letterSpacing: '3px', marginBottom: '16px', textTransform: 'uppercase' }}>Fonctionnement</div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', letterSpacing: '-2px', marginBottom: '16px' }}>Simple. Puissant. Permanent.</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>Le diagnostic est la porte d'entrée. Le Passeport est le produit.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2px' }}>
          {[
            { n: '01', t: 'Diagnostic gratuit', d: '12 questions sur votre bâtiment. Votre Santé Thermique en 2 minutes.', c: '#FF6B35', icon: '🔍' },
            { n: '02', t: 'Passeport créé', d: 'Votre bâtiment reçoit son identité numérique. La mémoire commence.', c: '#00D4AA', icon: '📋' },
            { n: '03', t: 'Historique vivant', d: 'Chaque travaux, document, intervention enrichit le Passeport.', c: '#FFD700', icon: '📈' },
            { n: '04', t: 'Transmission', d: 'Lors d\'une vente, le Passeport passe au nouveau propriétaire.', c: '#FF6B35', icon: '🤝' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.02)', padding: '40px 32px',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: i === 0 ? '20px 0 0 20px' : i === 3 ? '0 20px 20px 0' : '0',
              transition: 'background 0.3s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{s.icon}</div>
              <div style={{ fontSize: '4rem', fontWeight: '900', color: 'rgba(255,255,255,0.04)', letterSpacing: '-3px', lineHeight: 1, marginBottom: '16px' }}>{s.n}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px', color: s.c }}>{s.t}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, fontSize: '0.9rem' }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POUR QUI */}
      <section style={{ padding: '120px 60px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <div style={{ fontSize: '0.8rem', color: '#FF6B35', letterSpacing: '3px', marginBottom: '16px', textTransform: 'uppercase' }}>Clients</div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', letterSpacing: '-2px' }}>HERIT n'a pas un client.<br />Il en a neuf.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {[
              { e: '🏠', t: 'Propriétaires', d: 'Gratuit', c: '#FF6B35' },
              { e: '👷', t: 'Artisans', d: '99€/mois', c: '#00D4AA' },
              { e: '🏢', t: 'Syndics', d: 'Sur devis', c: '#FFD700' },
              { e: '📋', t: 'Notaires', d: 'Sur devis', c: '#FF6B35' },
              { e: '🛡️', t: 'Assureurs', d: 'API', c: '#00D4AA' },
              { e: '🏦', t: 'Banques', d: 'API', c: '#FFD700' },
              { e: '🏙️', t: 'Agences immo', d: 'Sur devis', c: '#FF6B35' },
              { e: '🏛️', t: 'Collectivités', d: '499€/mois', c: '#00D4AA' },
              { e: '🌍', t: 'États', d: 'Infrastructure', c: '#FFD700' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px', padding: '24px', textAlign: 'center',
                transition: 'all 0.3s'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = `${s.c}40` }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{s.e}</div>
                <div style={{ fontWeight: '700', marginBottom: '4px', fontSize: '0.95rem' }}>{s.t}</div>
                <div style={{ color: s.c, fontSize: '0.8rem', fontWeight: '600' }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" style={{ padding: '120px 60px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <div style={{ fontSize: '0.8rem', color: '#FF6B35', letterSpacing: '3px', marginBottom: '16px', textTransform: 'uppercase' }}>Tarifs</div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', letterSpacing: '-2px' }}>On n'enlève rien au gratuit.<br />On ajoute de la valeur.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              {
                name: 'Gratuit', price: '0€', sub: 'Pour toujours', color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.08)',
                features: ['Diagnostic thermique', 'Passeport Thermique', 'Historique travaux', '5 documents', '1 logement'],
                cta: 'Commencer', href: '/diagnostic', featured: false
              },
              {
                name: 'Plus', price: '9,90€', sub: '/mois ou 99€/an', color: '#FF6B35', border: '#FF6B35',
                features: ['Logements illimités', 'Documents illimités', 'Alertes canicule', 'Rapport PDF', 'Comparaison annuelle', 'Support prioritaire'],
                cta: 'Démarrer l\'essai', href: '/signup', featured: true
              },
              {
                name: 'Pro', price: '99€', sub: '/mois', color: '#00D4AA', border: '#00D4AA',
                features: ['Tout HERIT Plus', 'Gestion clients', 'Dépôt dans Carnets', 'Badge certifié HERIT', 'Accès leads qualifiés'],
                cta: 'Rejoindre le réseau', href: '/artisans', featured: false
              },
            ].map((plan, i) => (
              <div key={i} style={{
                background: plan.featured ? 'rgba(255,107,53,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${plan.border}`,
                borderRadius: '20px', padding: '36px', position: 'relative'
              }}>
                {plan.featured && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #FF6B35, #FF4444)', color: 'white', padding: '4px 16px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                    ⭐ RECOMMANDÉ
                  </div>
                )}
                <div style={{ color: plan.color, fontWeight: '700', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>HERIT {plan.name}</div>
                <div style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '4px' }}>{plan.price}</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginBottom: '28px' }}>{plan.sub}</div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '28px' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', display: 'flex', gap: '10px', fontSize: '0.9rem' }}>
                      <span style={{ color: plan.color }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} style={{
                  display: 'block', textAlign: 'center', padding: '14px',
                  background: plan.featured ? 'linear-gradient(135deg, #FF6B35, #FF4444)' : 'transparent',
                  color: plan.featured ? 'white' : plan.color,
                  border: plan.featured ? 'none' : `1px solid ${plan.color}40`,
                  borderRadius: '10px', textDecoration: 'none', fontWeight: '600',
                  boxShadow: plan.featured ? '0 0 30px rgba(255,107,53,0.3)' : 'none'
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', marginTop: '24px', fontSize: '0.85rem' }}>
            Assureurs · Banques · Foncières · États →{' '}
            <a href="mailto:krikordecor@gmail.com" style={{ color: '#FF6B35', textDecoration: 'none' }}>Contactez-nous</a>
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '120px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: '900', letterSpacing: '-3px', lineHeight: 1.05, marginBottom: '24px' }}>
            Votre bâtiment<br />
            <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FF8C42)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>se souviendra de tout.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', marginBottom: '40px' }}>Créez gratuitement son Passeport Climatique aujourd'hui.</p>
          <Link href="/diagnostic" style={{
            display: 'inline-block', background: 'linear-gradient(135deg, #FF6B35, #FF4444)',
            color: 'white', padding: '20px 56px', borderRadius: '14px',
            textDecoration: 'none', fontWeight: '800', fontSize: '1.1rem',
            boxShadow: '0 0 60px rgba(255,107,53,0.4)', letterSpacing: '-0.3px'
          }}>
            📋 Créer mon Passeport gratuitement
          </Link>
          <div style={{ marginTop: '20px', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>Gratuit · 2 minutes · Sans inscription</div>
        </div>
      </section>

      {/* LISTE D'ATTENTE */}
      <section style={{ padding: '60px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>Rejoignez les premiers</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '24px', fontSize: '0.9rem' }}>Les premiers propriétaires qui construisent la mémoire thermique de leur logement.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <input type="email" placeholder="votre@email.com"
              style={{ padding: '14px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '0.95rem', minWidth: '240px', outline: 'none' }} />
            <button style={{ background: 'linear-gradient(135deg, #FF6B35, #FF4444)', color: 'white', border: 'none', padding: '14px 24px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer' }}>
              Je rejoins HERIT →
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 60px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #FF6B35, #FF4444)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🏛️</div>
              <span style={{ fontWeight: '800', letterSpacing: '-0.5px' }}>HERIT</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', lineHeight: 1.6 }}>Le Passeport Climatique Mondial des bâtiments.</p>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.8rem', marginTop: '8px', fontStyle: 'italic' }}>"Confiance · Mémoire · Transmission"</p>
          </div>
          {[
            { title: 'Plateforme', links: [['Diagnostic gratuit', '/diagnostic'], ['Passeport Thermique', '/carnet'], ['Tableau de bord', '/dashboard'], ['Pourquoi HERIT ?', '/pourquoi']] },
            { title: 'Professionnels', links: [['Artisans', '/artisans'], ['Collectivités', '/artisans'], ['Partenaires', '/artisans'], ['Contact', 'mailto:krikordecor@gmail.com']] },
            { title: 'Légal', links: [['Mentions légales', '/mentions-legales'], ['CGV', '/cgv'], ['Confidentialité', '/confidentialite'], ['SIRET 982 153 561', '#']] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontWeight: '600', marginBottom: '16px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.links.map(([label, href], j) => (
                  <Link key={j} href={href} style={{ color: 'rgba(255,255,255,0.25)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>© 2026 HERIT — KRIKOR DÉCOR (SIRET 982 153 561)</div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>Valence, France · krikordecor@gmail.com</div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        * { box-sizing: border-box; }
        ::selection { background: rgba(255,107,53,0.3); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050508; }
        ::-webkit-scrollbar-thumb { background: rgba(255,107,53,0.3); border-radius: 3px; }
      `}</style>

    </main>
  )
}