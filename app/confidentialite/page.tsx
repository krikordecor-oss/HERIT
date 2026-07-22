import Link from 'next/link'

export default function ConfidentialitePage() {
  return (
    <main style={{backgroundColor:'#0D1117', color:'white', minHeight:'100vh', fontFamily:'system-ui, sans-serif'}}>
      <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 40px', borderBottom:'1px solid #21262D', background:'#0D1117'}}>
        <Link href="/" style={{fontSize:'1.8rem', fontWeight:'900', color:'#FF6B35', textDecoration:'none'}}>🌡️ HERIT</Link>
        <Link href="/diagnostic" style={{background:'#FF6B35', color:'white', padding:'10px 24px', borderRadius:'8px', textDecoration:'none', fontWeight:'bold'}}>Démarrer →</Link>
      </nav>

      <section style={{maxWidth:'800px', margin:'0 auto', padding:'60px 20px'}}>
        <h1 style={{fontSize:'2.5rem', fontWeight:'900', marginBottom:'10px'}}>Politique de Confidentialité</h1>
        <p style={{color:'#484F58', marginBottom:'40px'}}>Dernière mise à jour : 1er juillet 2026</p>

        {[
          {t:'1. Responsable du traitement', c:`KRIKOR DÉCOR — Krikor Simonian\nSIRET : 982 153 561\nValence (26), Drôme, France\nEmail : krikordecor@gmail.com`},
          {t:'2. Données collectées', c:`HERIT collecte les données suivantes :\n\n• Diagnostic gratuit : aucune donnée personnelle n'est collectée. Les réponses au formulaire sont traitées localement dans votre navigateur.\n\n• Demande de rapport PDF (19€) : nom, email, adresse (facultative), transmis par email.\n\n• Abonnement artisan (49€/mois) : nom, prénom, email, téléphone, zone géographique, spécialité.`},
          {t:'3. Finalités du traitement', c:`Les données collectées sont utilisées exclusivement pour :\n• Traiter votre demande de rapport PDF\n• Gérer votre abonnement artisan\n• Vous envoyer votre rapport et facture\n• Vous mettre en relation avec des artisans (si demandé)`},
          {t:'4. Base légale', c:`Le traitement de vos données repose sur :\n• L'exécution d'un contrat (commande de rapport, abonnement artisan)\n• Votre consentement explicite (formulaire de contact)`},
          {t:'5. Durée de conservation', c:`Vos données sont conservées pendant la durée nécessaire à l'exécution du service, puis archivées 3 ans conformément aux obligations légales comptables françaises.`},
          {t:'6. Partage des données', c:`Vos données ne sont jamais vendues ni partagées avec des tiers à des fins commerciales. Elles peuvent être transmises uniquement à des artisans partenaires HERIT dans le cadre d'une mise en relation explicitement demandée.`},
          {t:'7. Vos droits (RGPD)', c:`Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :\n• Droit d'accès à vos données\n• Droit de rectification\n• Droit à l'effacement (droit à l'oubli)\n• Droit d'opposition\n• Droit à la portabilité\n\nPour exercer ces droits : krikordecor@gmail.com`},
          {t:'8. Cookies', c:`HERIT n'utilise pas de cookies de suivi ou publicitaires. Seul un cookie technique de langue (HERIT_lang) est stocké localement dans votre navigateur pour mémoriser votre préférence de langue. Ce cookie ne contient aucune donnée personnelle et n'est pas transmis à nos serveurs.`},
          {t:'9. Hébergement', c:`Le site est hébergé par Vercel Inc. (San Francisco, USA). Les données transitant par le formulaire de contact sont transmises par email uniquement et ne sont pas stockées sur les serveurs de Vercel.`},
          {t:'10. Contact', c:`Pour toute question relative à vos données personnelles :\nkrikordecor@gmail.com\nKRIKOR DÉCOR — Valence (26), France`},
        ].map((s,i) => (
          <div key={i} style={{marginBottom:'40px'}}>
            <h2 style={{color:'#FF6B35', fontSize:'1.2rem', fontWeight:'700', marginBottom:'16px', paddingBottom:'8px', borderBottom:'1px solid #21262D'}}>{s.t}</h2>
            <p style={{color:'#8B949E', lineHeight:1.8, whiteSpace:'pre-line'}}>{s.c}</p>
          </div>
        ))}
      </section>

      <footer style={{background:'#010409', padding:'30px 20px', borderTop:'1px solid #21262D', textAlign:'center'}}>
        <div style={{display:'flex', gap:'20px', justifyContent:'center', flexWrap:'wrap', marginBottom:'16px'}}>
          <Link href="/" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Accueil</Link>
          <Link href="/mentions-legales" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Mentions légales</Link>
          <Link href="/cgv" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>CGV</Link>
        </div>
        <div style={{color:'#484F58', fontSize:'0.85rem'}}>© 2026 HERIT — KRIKOR DÉCOR (SIRET 982 153 561)</div>
      </footer>
    </main>
  )
}
