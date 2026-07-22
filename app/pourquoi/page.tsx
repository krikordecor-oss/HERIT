import Link from 'next/link'

export default function PourquoiPage() {
  return (
    <main style={{backgroundColor:'#0D1117', color:'white', minHeight:'100vh', fontFamily:'system-ui, sans-serif'}}>
      <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 40px', borderBottom:'1px solid #21262D', background:'#0D1117'}}>
        <Link href="/" style={{fontSize:'1.8rem', fontWeight:'900', color:'#FF6B35', textDecoration:'none'}}>🌡️ HERIT</Link>
        <Link href="/diagnostic" style={{background:'#FF6B35', color:'white', padding:'10px 24px', borderRadius:'8px', textDecoration:'none', fontWeight:'bold'}}>Démarrer →</Link>
      </nav>

      <section style={{maxWidth:'800px', margin:'0 auto', padding:'80px 20px'}}>
        <div style={{textAlign:'center', marginBottom:'60px'}}>
          <h1 style={{fontSize:'clamp(2rem, 5vw, 3.5rem)', fontWeight:'900', lineHeight:1.2, marginBottom:'24px'}}>
            Pourquoi <span style={{color:'#FF6B35'}}>HERIT</span> ?
          </h1>
          <p style={{fontSize:'1.2rem', color:'#8B949E', lineHeight:1.7}}>
            Une histoire simple. Un problème universel.
          </p>
        </div>

        {/* HISTOIRE */}
        <div style={{background:'#161B22', borderRadius:'16px', padding:'40px', border:'1px solid #21262D', marginBottom:'32px'}}>
          <h2 style={{color:'#FF6B35', fontSize:'1.5rem', marginBottom:'24px'}}>📖 L'histoire</h2>
          {[
            'Aujourd\'hui, les bâtiments vivent parfois plus de 100 ans.',
            'Pourtant, leur mémoire se perd à chaque changement de propriétaire.',
            'Les travaux réalisés, les artisans qui sont intervenus, les diagnostics effectués, les garanties obtenues — tout disparaît.',
            'Le nouveau propriétaire repart de zéro. Toujours.',
            'HERIT est né pour changer cela.',
          ].map((text, i) => (
            <p key={i} style={{color: i === 4 ? '#00D4AA' : '#ccc', lineHeight:1.8, fontSize:'1.1rem', marginBottom:'16px', fontWeight: i === 4 ? '700' : '400'}}>
              {text}
            </p>
          ))}
        </div>

        {/* MISSION */}
        <div style={{background:'linear-gradient(135deg, #1A1A2E, #16213E)', borderRadius:'16px', padding:'40px', border:'1px solid #FF6B35', marginBottom:'32px', textAlign:'center'}}>
          <h2 style={{color:'#FF6B35', fontSize:'1.3rem', marginBottom:'16px'}}>🎯 Notre mission</h2>
          <p style={{fontSize:'1.4rem', fontWeight:'700', lineHeight:1.6, color:'white'}}>
            "Aider chaque bâtiment à comprendre, améliorer et préserver sa santé thermique tout au long de sa vie."
          </p>
        </div>

        {/* FONDATEUR */}
        <div style={{background:'#161B22', borderRadius:'16px', padding:'40px', border:'1px solid #21262D', marginBottom:'32px'}}>
          <h2 style={{color:'#FF6B35', fontSize:'1.5rem', marginBottom:'24px'}}>👤 Le fondateur</h2>
          <div style={{display:'flex', gap:'24px', alignItems:'start', flexWrap:'wrap'}}>
            <div style={{width:'80px', height:'80px', background:'linear-gradient(135deg, #FF6B35, #FF4444)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', flexShrink:0}}>
              K
            </div>
            <div style={{flex:1}}>
              <h3 style={{fontSize:'1.3rem', fontWeight:'800', marginBottom:'8px'}}>Krikor Simonian</h3>
              <p style={{color:'#00D4AA', fontWeight:'600', marginBottom:'16px'}}>40 ans d'expertise bâtiment · Fondateur KRIKOR DÉCOR</p>
              {[
                '🏗️ Compagnon professionnel depuis 1986 — de pré-apprenti à Maître Ouvrier',
                '🎓 Formateur technique senior chez ROCKFON (groupe ROCKWOOL)',
                '📊 Conseiller Technique Régional chez TOUPRET S.A pendant 10 ans',
                '🌍 Expert intervenu en France, Suisse, Monaco et Europe',
                '💡 Pionnier de l\'intégration de l\'IA dans les diagnostics de chantier',
              ].map((item, i) => (
                <div key={i} style={{padding:'10px 0', borderBottom:'1px solid #21262D', color:'#8B949E', fontSize:'0.95rem'}}>
                  {item}
                </div>
              ))}
              <p style={{color:'#ccc', lineHeight:1.7, marginTop:'16px', fontSize:'0.95rem'}}>
                "J'ai passé 40 ans à toucher, diagnostiquer et rénover des bâtiments. J'ai vu des milliers de logements perdre leur histoire à chaque changement de propriétaire. HERIT est la solution que j'aurais voulu avoir dès le début de ma carrière."
              </p>
            </div>
          </div>
        </div>

        {/* VISION */}
        <div style={{background:'#161B22', borderRadius:'16px', padding:'40px', border:'1px solid #21262D', marginBottom:'40px'}}>
          <h2 style={{color:'#FF6B35', fontSize:'1.5rem', marginBottom:'24px'}}>🔭 La vision</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px'}}>
            {[
              {e:'📋', t:'Carnet de Santé', d:'Chaque bâtiment a sa mémoire thermique — pour toujours.'},
              {e:'🌍', t:'Mondial', d:'46 langues, tous les matériaux de construction du monde.'},
              {e:'⏳', t:'Générationnel', d:'Un carnet qui traverse les décennies et les propriétaires.'},
              {e:'🤝', t:'Communauté', d:'Artisans, propriétaires et collectivités unis pour un bâti meilleur.'},
            ].map((item, i) => (
              <div key={i} style={{textAlign:'center', padding:'20px', background:'#0D1117', borderRadius:'12px', border:'1px solid #21262D'}}>
                <div style={{fontSize:'2rem', marginBottom:'8px'}}>{item.e}</div>
                <div style={{fontWeight:'700', marginBottom:'8px'}}>{item.t}</div>
                <div style={{color:'#8B949E', fontSize:'0.85rem', lineHeight:1.5}}>{item.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{textAlign:'center'}}>
          <Link href="/diagnostic" style={{display:'inline-block', background:'#FF6B35', color:'white', padding:'18px 50px', borderRadius:'10px', textDecoration:'none', fontWeight:'900', fontSize:'1.2rem', marginBottom:'16px'}}>
            🌡️ Créer le Carnet de mon logement
          </Link>
          <p style={{color:'#484F58', fontSize:'0.85rem'}}>Gratuit · Sans inscription · 2 minutes</p>
        </div>
      </section>

      <footer style={{background:'#010409', padding:'30px 20px', borderTop:'1px solid #21262D', textAlign:'center'}}>
        <div style={{display:'flex', gap:'20px', justifyContent:'center', flexWrap:'wrap', marginBottom:'16px'}}>
          <Link href="/" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Accueil</Link>
          <Link href="/diagnostic" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Diagnostic</Link>
          <Link href="/artisans" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Artisans</Link>
          <Link href="/mentions-legales" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Mentions légales</Link>
        </div>
        <div style={{color:'#484F58', fontSize:'0.85rem'}}>© 2026 HERIT — KRIKOR DÉCOR (SIRET 982 153 561)</div>
      </footer>
    </main>
  )
}
