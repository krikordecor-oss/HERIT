'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getTranslation, SupportedLanguage, diagnosticTranslations } from '@/lib/i18n/diagnostic'

const languages = [
  { code: 'fr', name: '🇫🇷 Français' },
  { code: 'en', name: '🇬🇧 English' },
  { code: 'es', name: '🇪🇸 Español' },
  { code: 'pt', name: '🇧🇷 Português' },
  { code: 'de', name: '🇩🇪 Deutsch' },
  { code: 'it', name: '🇮🇹 Italiano' },
  { code: 'ru', name: '🇷🇺 Русский' },
  { code: 'ar', name: '🇸🇦 العربية' },
  { code: 'zh', name: '🇨🇳 中文' },
  { code: 'hi', name: '🇮🇳 हिन्दी' },
  { code: 'ja', name: '🇯🇵 日本語' },
  { code: 'ko', name: '🇰🇷 한국어' },
  { code: 'tr', name: '🇹🇷 Türkçe' },
  { code: 'nl', name: '🇳🇱 Nederlands' },
  { code: 'pl', name: '🇵🇱 Polski' },
  { code: 'sv', name: '🇸🇪 Svenska' },
  { code: 'da', name: '🇩🇰 Dansk' },
  { code: 'fi', name: '🇫🇮 Suomi' },
  { code: 'no', name: '🇳🇴 Norsk' },
  { code: 'cs', name: '🇨🇿 Čeština' },
  { code: 'ro', name: '🇷🇴 Română' },
  { code: 'hu', name: '🇭🇺 Magyar' },
  { code: 'uk', name: '🇺🇦 Українська' },
  { code: 'fa', name: '🇮🇷 فارسی' },
  { code: 'id', name: '🇮🇩 Bahasa Indonesia' },
  { code: 'ms', name: '🇲🇾 Bahasa Melayu' },
  { code: 'th', name: '🇹🇭 ภาษาไทย' },
  { code: 'vi', name: '🇻🇳 Tiếng Việt' },
  { code: 'sw', name: '🇰🇪 Kiswahili' },
  { code: 'bn', name: '🇧🇩 বাংলা' },
  { code: 'ur', name: '🇵🇰 اردو' },
  { code: 'el', name: '🇬🇷 Ελληνικά' },
  { code: 'he', name: '🇮🇱 עברית' },
  { code: 'ca', name: '🏴 Català' },
  { code: 'sk', name: '🇸🇰 Slovenčina' },
  { code: 'bg', name: '🇧🇬 Български' },
  { code: 'sr', name: '🇷 la Српски' },
  { code: 'hr', name: '🇭🇷 Hrvatski' },
  { code: 'lt', name: '🇱🇹 Lietuvių' },
  { code: 'lv', name: '🇱🇻 Latviešu' },
  { code: 'et', name: '🇪🇪 Eesti' },
  { code: 'ha', name: '🇳🇬 Hausa' },
  { code: 'yo', name: '🇳🇬 Yorùbá' },
  { code: 'zu', name: '🇿🇦 isiZulu' },
  { code: 'am', name: '🇪🇹 አማርኛ' },
  { code: 'ig', name: '🇳🇬 Igbo' },
]

export default function DiagnosticForm() {
  const router = useRouter()
  const [lang, setLang] = useState('fr')

  useEffect(() => {
    const savedLang = localStorage.getItem('HERIT_lang')
    if (savedLang && diagnosticTranslations[savedLang as SupportedLanguage]) {
      setLang(savedLang)
    }
  }, [])

  const handleLangChange = (newLang: string) => {
    setLang(newLang)
    localStorage.setItem('HERIT_lang', newLang)
  }

  const t = getTranslation(lang)
  const opt = t.options

  const [form, setForm] = useState({
    buildingType: '', wallType: '', constructionYear: '',
    roofType: '', glazing: '', isolation: '',
    exposure: '', solarProtection: '', heating: '',
    surface: '', countryRegion: '', address: ''
  })

  const handleSubmit = () => {
    const params = new URLSearchParams({...form, lang} as any)
    router.push(`/diagnostic/result?${params.toString()}`)
  }

  const selectStyle = {
    width:'100%', padding:'12px', marginTop:'8px',
    background:'#2A2A3E', color:'white',
    border:'1px solid #444', borderRadius:'8px', fontSize:'1rem'
  }
  const labelStyle = { fontSize:'1.1rem', fontWeight:'bold' as const, color:'#00D4AA' }
  const divStyle = { marginBottom:'24px' }

  return (
    <main style={{backgroundColor:'#1A1A2E', minHeight:'100vh', color:'white', padding:'40px'}}>
      <div style={{textAlign:'center', marginBottom:'10px'}}>
        <a href="/" style={{fontSize:'2.5rem', fontWeight:'900', color:'#FF6B35', textDecoration:'none'}}>🏛️ HERIT</a>
      </div>
      <h2 style={{textAlign:'center', fontSize:'1.3rem', color:'#ccc', marginBottom:'30px'}}>{t.title}</h2>

      <div style={{maxWidth:'700px', margin:'0 auto 30px auto'}}>
        <label style={{...labelStyle, display:'block', marginBottom:'8px'}}>{t.languageLabel}</label>
        <select style={{...selectStyle, background:'#FF6B35', fontWeight:'bold', fontSize:'1.1rem'}}
          value={lang} onChange={e => handleLangChange(e.target.value)}>
          {languages.map(l => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>

      <div style={{maxWidth:'700px', margin:'0 auto', background:'#16213E', padding:'40px', borderRadius:'16px'}}>

        <div style={divStyle}>
          <label style={labelStyle}>{t.region}</label>
          <select style={selectStyle} onChange={e => setForm({...form, countryRegion: e.target.value})}>
            <option value="">{t.choose}</option>
            {Object.entries(opt.regions).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>{t.buildingType}</label>
          <select style={selectStyle} onChange={e => setForm({...form, buildingType: e.target.value})}>
            <option value="">{t.choose}</option>
            {Object.entries(opt.buildingTypes).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>{t.wallType}</label>
          <select style={selectStyle} onChange={e => setForm({...form, wallType: e.target.value})}>
            <option value="">{t.choose}</option>
            <optgroup label={t.wallMaterialsLabels.europe}>
              {Object.entries(opt.wallMaterials.europe).map(([key, val]) => (
                <option key={`eur-${key}`} value={key}>{val}</option>
              ))}
            </optgroup>
            <optgroup label={t.wallMaterialsLabels.afrique}>
              {Object.entries(opt.wallMaterials.afrique).map(([key, val]) => (
                <option key={`afr-${key}`} value={key}>{val}</option>
              ))}
            </optgroup>
            <optgroup label={t.wallMaterialsLabels.asie}>
              {Object.entries(opt.wallMaterials.asie).map(([key, val]) => (
                <option key={`asi-${key}`} value={key}>{val}</option>
              ))}
            </optgroup>
            <optgroup label={t.wallMaterialsLabels.ameriques}>
              {Object.entries(opt.wallMaterials.ameriques).map(([key, val]) => (
                <option key={`ame-${key}`} value={key}>{val}</option>
              ))}
            </optgroup>
            <optgroup label={t.wallMaterialsLabels.extremes}>
              {Object.entries(opt.wallMaterials.extremes).map(([key, val]) => (
                <option key={`ext-${key}`} value={key}>{val}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>{t.roofType}</label>
          <select style={selectStyle} onChange={e => setForm({...form, roofType: e.target.value})}>
            <option value="">{t.choose}</option>
            {Object.entries(opt.roofTypes).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>{t.constructionYear}</label>
          <select style={selectStyle} onChange={e => setForm({...form, constructionYear: e.target.value})}>
            <option value="">{t.choose}</option>
            {Object.entries(opt.constructionYears).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>{t.isolation}</label>
          <select style={selectStyle} onChange={e => setForm({...form, isolation: e.target.value})}>
            <option value="">{t.choose}</option>
            {Object.entries(opt.isolationLevels).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>{t.glazing}</label>
          <select style={selectStyle} onChange={e => setForm({...form, glazing: e.target.value})}>
            <option value="">{t.choose}</option>
            {Object.entries(opt.glazingTypes).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>{t.exposure}</label>
          <select style={selectStyle} onChange={e => setForm({...form, exposure: e.target.value})}>
            <option value="">{t.choose}</option>
            {Object.entries(opt.exposures).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>{t.solarProtection}</label>
          <select style={selectStyle} onChange={e => setForm({...form, solarProtection: e.target.value})}>
            <option value="">{t.choose}</option>
            {Object.entries(opt.solarProtections).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>{t.heating}</label>
          <select style={selectStyle} onChange={e => setForm({...form, heating: e.target.value})}>
            <option value="">{t.choose}</option>
            {Object.entries(opt.heatingSystems).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>{t.surface}</label>
          <select style={selectStyle} onChange={e => setForm({...form, surface: e.target.value})}>
            <option value="">{t.choose}</option>
            {Object.entries(opt.surfaces).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>

        <div style={divStyle}>
          <label style={labelStyle}>{t.address}</label>
          <input type="text"
            placeholder={t.addressPlaceholder}
            style={{...selectStyle, marginTop:'8px'}}
            onChange={e => setForm({...form, address: e.target.value})} />
        </div>

        <button onClick={handleSubmit}
          style={{width:'100%', padding:'18px', background:'#FF6B35',
          color:'white', border:'none', borderRadius:'10px',
          fontSize:'1.3rem', cursor:'pointer', fontWeight:'bold', marginTop:'20px'}}>
          {t.submit}
        </button>
      </div>
    </main>
  )
}
