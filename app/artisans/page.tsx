import Link from 'next/link'

export default function ArtisansPage() {
  return (
    <main style={{backgroundColor:'#0D1117', color:'white', minHeight:'100vh', fontFamily:'system-ui, sans-serif'}}>

      <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 40px', borderBottom:'1px solid #21262D', background:'#0D1117'}}>
        <Link href="/" style={{fontSize:'1.8rem', fontWeight:'900', color:'#FF6B35', textDecoration:'none'}}>🌡️ HERIT</Link>
        <div style={{display:'flex', gap:'30px', alignItems:'center'}}>
          <Link href="/diagnostic" style={{color:'#ccc', textDecoration:'none'}}>Diagnostic</Link>
          <Link href="/aide" style={{color:'#ccc', textDecoration:'none'}}>Aide</Link>
          <Link href="/diagnostic" style={{background:'#FF6B35', color:'white', padding:'10px 24px', borderRadius:'8px', textDecoration:'none', fontWeight:'bold'}}>Démarrer →</Link>
        </div>
      </nav>

      <section style={{textAlign:'center', padding:'80px 20px 60px', maxWidth:'800px', margin:'0 auto'}}>
        <div style={{background:'#00D4AA', color:'#0D1117', display:'inline-block', padding:'8px 20px', borderRadius:'20px', fontWeight:'700', marginBottom:'20px', fontSize:'0.9rem'}}>
          ESPACE ARTISAN
        </div>
        <h1 style={{fontSize:'clamp(2rem, 5vw, 3.5rem)', fontWeight:'900', marginBottom:'20px', lineHeight:1.1}}>
          Recevez des leads<br/>qualifiés chaque semaine
        </h1>
        <p style={{fontSize:'1.2rem', color:'#8B949E', maxWidth:'600px', margin:'0 auto', lineHeight:1.6}}>
          Les propriétaires qui utilisent HERIT ont déjà identifié leurs besoins. Ils cherchent un artisan qualifié maintenant.
        </p>
      </section>

      <section style={{background:'#161B22', padding:'60px 20px'}}>
        <div style={{maxWidth:'900px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'40px', textAlign:'center'}}>
          {[
            {n:'49€', l:'/mois — abonnement artisan'},
            {n:'100%', l:'des leads sont qualifiés'},
            {n:'0€', l:'de commission sur vos chantiers'},
            {n:'24h', l:'pour recevoir vos premiers leads'},
          ].map((s,i) => (
            <div key={i}>
              <div style={{fontSize:'2.5rem', fontWeight:'900', color:'#00D4AA'}}>{s.n}</div>
              <div style={{color:'#8B949E', marginTop:'8px'}}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{padding:'80px 20px', maxWidth:'900px', margin:'0 auto'}}>
        <h2 style={{textAlign:'center', fontSize:'2rem', fontWeight:'800', marginBottom:'60px'}}>Ce que vous recevez</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'30px'}}>
          {[
            {e:'📍', t:'Adresse exacte', d:'Vous savez exactement où intervenir avant même de contacter le client.'},
            {e:'🌡️', t:'Score thermique', d:'Vous connaissez la vulnérabilité du bâtiment et les travaux prioritaires recommandés.'},
            {e:'💰', t:'Budget estimé', d:'Chaque lead inclut une fourchette de budget pour vous aider à prioriser vos interventions.'},
            {e:'📋', t:'Plan d\'action', d:'Le diagnostic HERIT liste déjà les 3 priorités — vous arrivez avec des solutions concrètes.'},
            {e:'🌍', t:'Zone géographique', d:'Vous choisissez votre zone d\'intervention — département, région ou national.'},
            {e:'📞', t:'Contact direct', d:'Coordonnées complètes du propriétaire pour le contacter immédiatement.'},
          ].map((s,i) => (
            <div key={i} style={{background:'#161B22', padding:'24px', borderRadius:'12px', border:'1px solid #21262D'}}>
              <div style={{fontSize:'2rem', marginBottom:'12px'}}>{s.e}</div>
              <h3 style={{fontWeight:'700', marginBottom:'8px'}}>{s.t}</h3>
              <p style={{color:'#8B949E', fontSize:'0.9rem', lineHeight:1.6}}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{background:'#161B22', padding:'80px 20px'}}>
        <div style={{maxWidth:'600px', margin:'0 auto'}}>
          <h2 style={{textAlign:'center', fontSize:'2rem', fontWeight:'800', marginBottom:'40px'}}>Rejoindre HERIT</h2>
          <div style={{background:'#0D1117', padding:'40px', borderRadius:'16px', border:'1px solid #21262D'}}>
            <div style={{marginBottom:'20px', padding:'20px', background:'#161B22', borderRadius:'10px', border:'2px solid #00D4AA', textAlign:'center'}}>
              <div style={{fontSize:'2.5rem', fontWeight:'900', color:'#00D4AA'}}>49€<span style={{fontSize:'1rem', color:'#8B949E'}}>/mois</span></div>
              <div style={{color:'#8B949E', marginTop:'8px'}}>Sans engagement · Résiliable à tout moment</div>
            </div>
            <ul style={{listStyle:'none', padding:0, marginBottom:'30px'}}>
              {['Leads qualifiés illimités dans votre zone','Accès au score thermique complet de chaque bâtiment','Support par email 7j/7','Profil artisan visible sur HERIT','Badge "Artisan certifié HERIT"'].map((item,i) => (
                <li key={i} style={{padding:'10px 0', borderBottom:'1px solid #21262D', color:'#ccc', display:'flex', gap:'10px'}}>
                  <span style={{color:'#00D4AA'}}>✓</span> {item}
                </li>
              ))}
            </ul>
            <a href="mailto:krikordecor@gmail.com?subject=Inscription Artisan HERIT 49€/mois&body=Bonjour,%0A%0AJe souhaite rejoindre HERIT en tant qu'artisan abonné (49€/mois).%0A%0AMon nom : %0AMa spécialité : %0AMa zone d'intervention : %0AMon téléphone : %0A%0AMerci"
              style={{display:'block', width:'100%', padding:'18px', background:'#00D4AA', color:'#0D1117', border:'none', borderRadius:'10px', fontSize:'1.2rem', cursor:'pointer', fontWeight:'900', textAlign:'center', textDecoration:'none', boxSizing:'border-box'}}>
              🤝 Rejoindre HERIT — 49€/mois
            </a>
            <p style={{textAlign:'center', color:'#484F58', fontSize:'0.85rem', marginTop:'12px'}}>
              Paiement par virement ou chèque · Facture KRIKOR DÉCOR
            </p>
          </div>
        </div>
      </section>

      <footer style={{background:'#010409', padding:'30px 20px', borderTop:'1px solid #21262D', textAlign:'center'}}>
        <div style={{display:'flex', gap:'20px', justifyContent:'center', flexWrap:'wrap', marginBottom:'16px'}}>
          <Link href="/" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Accueil</Link>
          <Link href="/diagnostic" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Diagnostic</Link>
          <Link href="/aide" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Aide</Link>
          <Link href="/mentions-legales" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Mentions légales</Link>
          <Link href="/cgv" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>CGV</Link>
          <Link href="/confidentialite" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Confidentialité</Link>
        </div>
        <div style={{color:'#484F58', fontSize:'0.85rem'}}>© 2026 HERIT — KRIKOR DÉCOR (SIRET 982 153 561)</div>
      </footer>

    </main>
  )
}
