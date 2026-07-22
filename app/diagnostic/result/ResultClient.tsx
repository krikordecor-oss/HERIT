'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createCarnet } from '../actions'

export default function ResultClient() {
  const params = useSearchParams()
  const supabase = createClient()
  const [lang, setLang] = useState('fr')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedLang = localStorage.getItem('HERIT_lang')
    if (savedLang) setLang(savedLang)
  }, [])

  const translations: Record<string, Record<string, string>> = {
    fr: { title: "Résultats de votre Diagnostic Thermique", resilient: "✅ Bâtiment Résilient", moderate: "⚠️ Risque Modéré", high: "🔴 Risque Élevé", critical: "🆘 Risque Critique", recommendations: "🎯 Recommandations prioritaires", actionPlan: "📋 Plan d'action", urgent: "🚨 URGENT", twoYears: "📅 Dans 2 ans", fiveYears: "🌱 Dans 5 ans", costs: "💰 Estimation des coûts", artisan: "🤝 Être mis en relation avec un artisan", pdf: "📄 Télécharger mon rapport — 19€", redo: "← Refaire un diagnostic", loading: "Chargement...", rec1: "🔧 URGENT : Installer une isolation thermique", rec2: "☀️ Installer des protections solaires extérieures", rec3: "🧭 Façade sud très exposée — protection prioritaire", rec4: "📅 Bâtiment ancien — audit thermique complet recommandé", rec5: "🪟 Remplacer le simple vitrage par du double vitrage", rec6: "🌍 Zone à risque climatique élevé — ventilation naturelle recommandée", rec7: "🧱 Béton — isolation extérieure prioritaire", rec8: "🌡️ Revêtement réfléchissant sur toiture tôle recommandé", recOk: "✅ Bon niveau de résistance thermique — maintenez l'entretien", urgentDesc: "Traiter l'isolation et les points faibles", twoDesc: "Améliorer vitrage et protections solaires", fiveDesc: "Optimisation complète et transition énergétique", saveCarnet: "📋 Créer le Carnet de Santé Thermique de mon logement →" },
    en: { title: "Your Thermal Diagnostic Results", resilient: "✅ Resilient Building", moderate: "⚠️ Moderate Risk", high: "🔴 High Risk", critical: "🆘 Critical Risk", recommendations: "🎯 Priority Recommendations", actionPlan: "📋 Action Plan", urgent: "🚨 URGENT", twoYears: "📅 In 2 years", fiveYears: "🌱 In 5 years", costs: "💰 Cost Estimate", artisan: "🤝 Connect with a contractor", pdf: "📄 Download my report — €19", redo: "← Redo diagnostic", loading: "Loading...", rec1: "🔧 URGENT: Install thermal insulation", rec2: "☀️ Install external solar protection", rec3: "🧭 South-facing facade — priority protection", rec4: "📅 Old building — full thermal audit recommended", rec5: "🪟 Replace single glazing with double glazing", rec6: "🌍 High climate risk zone — natural ventilation recommended", rec7: "🧱 Concrete — exterior insulation priority", rec8: "🌡️ Reflective coating on metal roof recommended", recOk: "✅ Good thermal resistance — maintain regular upkeep", urgentDesc: "Address insulation and major weak points", twoDesc: "Improve glazing and solar protection", fiveDesc: "Full optimization and energy transition", saveCarnet: "📋 Create my Building Thermal Health Record →" },
    // ... other languages would be added here
  }

  const t = translations[lang] || translations['fr']

  const wallType = params.get('wallType') || ''
  const year = params.get('constructionYear') || ''
  const isolation = params.get('isolation') || ''
  const exposure = params.get('exposure') || ''
  const protection = params.get('solarProtection') || ''
  const region = params.get('countryRegion') || ''
  const roofType = params.get('roofType') || ''
  const glazing = params.get('glazing') || ''
  const surface = params.get('surface') || ''
  const address = params.get('address') || ''

  let score = 50
  if (['pierre_taille','pierre_calcaire','beton_parpaing','tole_ondulee','beton_tropical'].includes(wallType)) score += 15
  if (['glace_neige','tourbe','toile_bete','feuilles_palme'].includes(wallType)) score += 20
  if (['paille','chanvre','bambou','bambou_asie'].includes(wallType)) score -= 15
  if (year === 'avant_1900') score += 20
  if (year === '1900_1948') score += 15
  if (year === '1948_1975') score += 10
  if (year === 'apres_2015') score -= 15
  if (isolation === 'aucune') score += 20
  if (isolation === 'partielle') score += 10
  if (isolation === 'recente') score -= 20
  if (isolation === 'naturelle') score -= 10
  if (glazing === 'simple') score += 10
  if (glazing === 'triple') score -= 15
  if (glazing === 'sans_vitrage') score += 15
  if (exposure === 'sud') score += 10
  if (protection === 'aucune_protection') score += 10
  if (['vegetation_arbres','mur_epais','pergola'].includes(protection)) score -= 10
  if (['afrique_tropicale','moyen_orient','asie_du_sud'].includes(region)) score += 15
  if (['tole'].includes(roofType)) score += 15
  if (['chaume','feuilles_palme_toit','vegetalise'].includes(roofType)) score -= 10
  score = Math.min(100, Math.max(0, score))

  const color = score <= 30 ? '#00D4AA' : score <= 60 ? '#FFA500' : score <= 80 ? '#FF4444' : '#8B0000'
  const level = score <= 30 ? t.resilient : score <= 60 ? t.moderate : score <= 80 ? t.high : t.critical

  const recs: string[] = []
  if (isolation === 'aucune') recs.push(t.rec1)
  if (protection === 'aucune_protection') recs.push(t.rec2)
  if (exposure === 'sud') recs.push(t.rec3)
  if (['avant_1900','1900_1948'].includes(year)) recs.push(t.rec4)
  if (glazing === 'simple') recs.push(t.rec5)
  if (['afrique_tropicale','moyen_orient','asie_du_sud'].includes(region)) recs.push(t.rec6)
  if (['beton_parpaing','beton_tropical'].includes(wallType)) recs.push(t.rec7)
  if (['tole_ondulee','tole'].includes(roofType)) recs.push(t.rec8)
  if (recs.length === 0) recs.push(t.recOk)

  const cost = ['europe_ouest','amerique_nord'].includes(region)
    ? score > 80 ? '15 000€ - 40 000€' : score > 60 ? '8 000€ - 20 000€' : '2 000€ - 8 000€'
    : score > 80 ? '10 000€ - 30 000€' : '5 000€ - 15 000€'

  const handleArtisan = () => {
    window.location.href = 'mailto:krikordecor@gmail.com?subject=Mise en relation artisan HERIT&body=Bonjour, je souhaite être mis en relation avec un artisan suite à mon diagnostic HERIT.'
  }

  const handlePDF = () => {
    window.location.href = 'mailto:krikordecor@gmail.com?subject=Demande rapport PDF HERIT 19€&body=Bonjour, je souhaite recevoir mon rapport PDF détaillé HERIT (19€).'
  }

  const handleSaveCarnet = async () => {
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/signup?redirect=/diagnostic/result'
        return
      }

      await createCarnet({
        nom: 'Mon bâtiment',
        address,
        constructionYear: year,
        surface,
        score,
        healthLevel: level,
        allParams: { wallType, roofType, isolation, glazing, exposure, protection, region }
      })
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={{backgroundColor:'#1A1A2E', minHeight:'100vh', color:'white', padding:'40px'}}>
      <h1 style={{textAlign:'center', fontSize:'2.5rem', color:'#FF6B35', marginBottom:'10px'}}>HERIT</h1>
      <h2 style={{textAlign:'center', fontSize:'1.2rem', color:'#ccc', marginBottom:'40px'}}>{t.title}</h2>

      <div style={{maxWidth:'700px', margin:'0 auto'}}>

        <div style={{background:'#16213E', borderRadius:'16px', padding:'40px', textAlign:'center', marginBottom:'24px'}}>
          <div style={{fontSize:'6rem', fontWeight:'bold', color}}>{score}</div>
          <div style={{fontSize:'1.8rem', color, marginBottom:'20px'}}>{level}</div>
          <div style={{background:'#333', borderRadius:'10px', height:'24px', marginBottom:'10px'}}>
            <div style={{width:`${score}%`, background:color, height:'100%', borderRadius:'10px'}}></div>
          </div>
          <div style={{color:'#aaa', fontSize:'0.9rem'}}>Score 0-100</div>
        </div>

        <div style={{background:'#16213E', borderRadius:'16px', padding:'30px', marginBottom:'24px'}}>
          <h3 style={{color:'#00D4AA', fontSize:'1.4rem', marginBottom:'20px'}}>{t.recommendations}</h3>
          {recs.slice(0,5).map((rec, i) => (
            <div key={i} style={{background:'#1A2A4A', padding:'15px', borderRadius:'8px', marginBottom:'12px', borderLeft:'4px solid #FF6B35'}}>
              {rec}
            </div>
          ))}
        </div>

        <div style={{background:'#16213E', borderRadius:'16px', padding:'30px', marginBottom:'24px'}}>
          <h3 style={{color:'#00D4AA', fontSize:'1.4rem', marginBottom:'20px'}}>{t.actionPlan}</h3>
          <div style={{background:'#1A2A4A', padding:'15px', borderRadius:'8px', marginBottom:'12px', borderLeft:'4px solid #FF4444'}}>
            <strong style={{color:'#FF4444'}}>{t.urgent}</strong> — {t.urgentDesc}
          </div>
          <div style={{background:'#1A2A4A', padding:'15px', borderRadius:'8px', marginBottom:'12px', borderLeft:'4px solid #FFA500'}}>
            <strong style={{color:'#FFA500'}}>{t.twoYears}</strong> — {t.twoDesc}
          </div>
          <div style={{background:'#1A2A4A', padding:'15px', borderRadius:'8px', borderLeft:'4px solid #00D4AA'}}>
            <strong style={{color:'#00D4AA'}}>{t.fiveYears}</strong> — {t.fiveDesc}
          </div>
        </div>

        <div style={{background:'#16213E', borderRadius:'16px', padding:'30px', marginBottom:'24px'}}>
          <h3 style={{color:'#00D4AA', fontSize:'1.4rem', marginBottom:'10px'}}>{t.costs}</h3>
          <div style={{fontSize:'1.5rem', color:'#FF6B35', fontWeight:'bold'}}>{cost}</div>
        </div>

        <div style={{display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'24px'}}>
          <button onClick={handleArtisan}
            style={{flex:1, padding:'18px', background:'#FF6B35', color:'white', border:'none', borderRadius:'10px', fontSize:'1.1rem', cursor:'pointer', fontWeight:'bold'}}>
            {t.artisan}
          </button>
          <button onClick={handlePDF}
            style={{flex:1, padding:'18px', background:'#00D4AA', color:'white', border:'none', borderRadius:'10px', fontSize:'1.1rem', cursor:'pointer', fontWeight:'bold'}}>
            {t.pdf}
          </button>
        </div>

        <div style={{textAlign:'center'}}>
            <button onClick={handleSaveCarnet} disabled={saving}
              style={{display:'block', width:'100%', textAlign:'center', marginBottom:'16px', background:'linear-gradient(135deg, #1A1A2E, #16213E)', border:'2px solid #FF6B35', color:'white', padding:'18px', borderRadius:'10px', fontWeight:'bold', fontSize:'1.1rem', cursor: saving ? 'not-allowed' : 'pointer'}}>
              {saving ? 'Sauvegarde en cours...' : t.saveCarnet}
            </button>
            {error && <p style={{color:'#FF4444', fontSize:'0.85rem', marginBottom:'16px'}}>{error}</p>}
            <a href="/diagnostic" style={{color:'#aaa', textDecoration:'none'}}>{t.redo}</a>
        </div>
      </div>
    </main>
  )
}
