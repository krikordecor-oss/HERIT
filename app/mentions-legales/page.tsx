import Link from 'next/link'

export default function MentionsLegalesPage() {
  return (
    <main style={{backgroundColor:'#0D1117', color:'white', minHeight:'100vh', fontFamily:'system-ui, sans-serif'}}>
      <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 40px', borderBottom:'1px solid #21262D', background:'#0D1117'}}>
        <Link href="/" style={{fontSize:'1.8rem', fontWeight:'900', color:'#FF6B35', textDecoration:'none'}}>🌡️ HERIT</Link>
        <Link href="/diagnostic" style={{background:'#FF6B35', color:'white', padding:'10px 24px', borderRadius:'8px', textDecoration:'none', fontWeight:'bold'}}>Démarrer →</Link>
      </nav>

      <section style={{maxWidth:'800px', margin:'0 auto', padding:'60px 20px'}}>
        <h1 style={{fontSize:'2.5rem', fontWeight:'900', marginBottom:'40px'}}>Mentions Légales</h1>

        {[
          {t:'Éditeur du site', c:`Raison sociale : KRIKOR DÉCOR\nForme juridique : Entreprise Individuelle (EI)\nSIRET : 982 153 561\nSiège social : Valence (26), Drôme, France\nReprésentant légal : Krikor Simonian\nEmail : krikordecor@gmail.com`},
          {t:'Hébergeur', c:`Vercel Inc.\n340 Pine Street, Suite 1200\nSan Francisco, CA 94104\nÉtats-Unis\nSite : https://vercel.com`},
          {t:'Propriété intellectuelle', c:`L'ensemble du contenu de ce site (textes, algorithmes, design, logos) est la propriété exclusive de KRIKOR DÉCOR. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.`},
          {t:'Responsabilité', c:`Les informations fournies par HERIT sont à titre indicatif et ne remplacent pas un diagnostic professionnel sur site. KRIKOR DÉCOR ne saurait être tenu responsable des décisions prises sur la base des résultats fournis par la plateforme.`},
          {t:'Droit applicable', c:`Le présent site est soumis au droit français. Tout litige relatif à son utilisation sera soumis à la compétence exclusive des tribunaux français.`},
        ].map((s,i) => (
          <div key={i} style={{marginBottom:'40px'}}>
            <h2 style={{color:'#FF6B35', fontSize:'1.3rem', fontWeight:'700', marginBottom:'16px', paddingBottom:'8px', borderBottom:'1px solid #21262D'}}>{s.t}</h2>
            <p style={{color:'#8B949E', lineHeight:1.8, whiteSpace:'pre-line'}}>{s.c}</p>
          </div>
        ))}
      </section>

      <footer style={{background:'#010409', padding:'30px 20px', borderTop:'1px solid #21262D', textAlign:'center'}}>
        <div style={{display:'flex', gap:'20px', justifyContent:'center', flexWrap:'wrap', marginBottom:'16px'}}>
          <Link href="/" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Accueil</Link>
          <Link href="/cgv" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>CGV</Link>
          <Link href="/confidentialite" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Confidentialité</Link>
        </div>
        <div style={{color:'#484F58', fontSize:'0.85rem'}}>© 2026 HERIT — KRIKOR DÉCOR (SIRET 982 153 561)</div>
      </footer>
    </main>
  )
}
