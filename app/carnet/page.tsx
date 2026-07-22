'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function CarnetPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    nom: '', adresse: '', annee: '', surface: '', type: '', etages: ''
  })

  const handleSave = () => {
    const carnet = {
      ...form,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      score: 72,
      diagnostics: [],
      travaux: [],
      documents: [],
      artisans: []
    }
    localStorage.setItem('HERIT_carnet', JSON.stringify(carnet))
    setStep(3)
  }

  const inputStyle = {
    width:'100%', padding:'14px', background:'#21262D',
    border:'1px solid #30363D', borderRadius:'8px',
    color:'white', fontSize:'1rem', boxSizing:'border-box' as const,
    marginTop:'8px'
  }
  const labelStyle = { color:'#8B949E', fontSize:'0.9rem', fontWeight:'600' as const }

  return (
    <main style={{backgroundColor:'#0D1117', color:'white', minHeight:'100vh', fontFamily:'system-ui, sans-serif'}}>

      <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 40px', borderBottom:'1px solid #21262D', background:'#0D1117'}}>
        <Link href="/" style={{fontSize:'1.8rem', fontWeight:'900', color:'#FF6B35', textDecoration:'none'}}>🌡️ HERIT</Link>
        <div style={{color:'#484F58', fontSize:'0.9rem'}}>Carnet de Santé Thermique</div>
      </nav>

      <section style={{maxWidth:'700px', margin:'0 auto', padding:'60px 20px'}}>

        {step === 1 && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'4rem', marginBottom:'20px'}}>📋</div>
            <h1 style={{fontSize:'2.2rem', fontWeight:'900', marginBottom:'16px', lineHeight:1.2}}>
              Créer le Carnet de Santé Thermique<br/>
              <span style={{color:'#FF6B35'}}>de votre logement</span>
            </h1>
            <p style={{color:'#8B949E', fontSize:'1.1rem', lineHeight:1.7, maxWidth:'550px', margin:'0 auto 40px'}}>
              Votre diagnostic vient de créer la première page de l'histoire thermique de votre logement. Conservez gratuitement toutes les informations importantes afin de suivre son évolution année après année.
            </p>

            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'16px', marginBottom:'40px'}}>
              {[
                {e:'📊', t:'Suivi du score', d:'Évolution thermique dans le temps'},
                {e:'🔧', t:'Historique travaux', d:'Tous vos chantiers enregistrés'},
                {e:'📄', t:'Documents', d:'Factures, garanties, plans'},
                {e:'👷', t:'Artisans', d:'Tous vos intervenants'},
              ].map((item,i) => (
                <div key={i} style={{background:'#161B22', padding:'20px', borderRadius:'12px', border:'1px solid #21262D', textAlign:'center'}}>
                  <div style={{fontSize:'2rem', marginBottom:'8px'}}>{item.e}</div>
                  <div style={{fontWeight:'700', fontSize:'0.95rem', marginBottom:'4px'}}>{item.t}</div>
                  <div style={{color:'#484F58', fontSize:'0.8rem'}}>{item.d}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(2)}
              style={{background:'#FF6B35', color:'white', border:'none', padding:'18px 50px', borderRadius:'10px', fontSize:'1.2rem', fontWeight:'900', cursor:'pointer', width:'100%', maxWidth:'400px'}}>
              📋 Créer mon Carnet Thermique
            </button>
            <p style={{color:'#484F58', fontSize:'0.85rem', marginTop:'12px'}}>
              ✓ Gratuit · ✓ Données stockées sur votre appareil · ✓ Sans inscription
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{textAlign:'center', marginBottom:'40px'}}>
              <h2 style={{fontSize:'1.8rem', fontWeight:'900', marginBottom:'8px'}}>Identité de votre logement</h2>
              <p style={{color:'#8B949E'}}>Ces informations constituent la carte d'identité thermique de votre bâtiment.</p>
            </div>

            <div style={{background:'#161B22', padding:'32px', borderRadius:'16px', border:'1px solid #21262D'}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={labelStyle}>Nom du logement (ex: "Maison familiale", "Appartement Lyon")</label>
                  <input style={inputStyle} placeholder="Mon logement" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={labelStyle}>Adresse complète</label>
                  <input style={inputStyle} placeholder="123 rue de la Paix, 26000 Valence" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Année de construction</label>
                  <input style={inputStyle} placeholder="1965" value={form.annee} onChange={e => setForm({...form, annee: e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Surface habitable (m²)</label>
                  <input style={inputStyle} placeholder="85" value={form.surface} onChange={e => setForm({...form, surface: e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Type de logement</label>
                  <select style={inputStyle} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="">Choisir...</option>
                    <option>Maison individuelle</option>
                    <option>Appartement</option>
                    <option>Immeuble collectif</option>
                    <option>Villa</option>
                    <option>Maison de ville</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Nombre d'étages</label>
                  <input style={inputStyle} placeholder="2" value={form.etages} onChange={e => setForm({...form, etages: e.target.value})} />
                </div>
              </div>

              <button onClick={handleSave}
                style={{width:'100%', marginTop:'24px', background:'#FF6B35', color:'white', border:'none', padding:'16px', borderRadius:'10px', fontSize:'1.1rem', fontWeight:'900', cursor:'pointer'}}>
                Créer mon Carnet Thermique →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'5rem', marginBottom:'20px'}}>🎉</div>
            <h2 style={{fontSize:'2rem', fontWeight:'900', marginBottom:'16px', color:'#00D4AA'}}>
              Votre Carnet Thermique est créé !
            </h2>
            <p style={{color:'#8B949E', fontSize:'1.1rem', marginBottom:'40px'}}>
              L'histoire thermique de votre logement commence aujourd'hui.
            </p>
            <Link href="/dashboard"
              style={{display:'inline-block', background:'#FF6B35', color:'white', padding:'18px 50px', borderRadius:'10px', textDecoration:'none', fontSize:'1.2rem', fontWeight:'900'}}>
              📊 Accéder à mon tableau de bord →
            </Link>
          </div>
        )}

      </section>
    </main>
  )
}
