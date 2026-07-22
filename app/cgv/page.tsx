import Link from 'next/link'

export default function CGVPage() {
  return (
    <main style={{backgroundColor:'#0D1117', color:'white', minHeight:'100vh', fontFamily:'system-ui, sans-serif'}}>
      <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 40px', borderBottom:'1px solid #21262D', background:'#0D1117'}}>
        <Link href="/" style={{fontSize:'1.8rem', fontWeight:'900', color:'#FF6B35', textDecoration:'none'}}>🌡️ HERIT</Link>
        <Link href="/diagnostic" style={{background:'#FF6B35', color:'white', padding:'10px 24px', borderRadius:'8px', textDecoration:'none', fontWeight:'bold'}}>Démarrer →</Link>
      </nav>

      <section style={{maxWidth:'800px', margin:'0 auto', padding:'60px 20px'}}>
        <h1 style={{fontSize:'2.5rem', fontWeight:'900', marginBottom:'10px'}}>Conditions Générales de Vente</h1>
        <p style={{color:'#484F58', marginBottom:'40px'}}>En vigueur au 1er juillet 2026</p>

        {[
          {t:'1. Vendeur', c:`KRIKOR DÉCOR — Entreprise Individuelle\nSIRET : 982 153 561\nSiège : Valence (26), Drôme, France\nEmail : krikordecor@gmail.com`},
          {t:'2. Services proposés', c:`HERIT propose les services suivants :\n\n• Diagnostic thermique gratuit en ligne (sans inscription)\n• Rapport PDF de diagnostic détaillé : 19€ TTC\n• Abonnement artisan — accès aux leads qualifiés : 49€ TTC/mois`},
          {t:'3. Prix', c:`Tous les prix sont indiqués en euros TTC. KRIKOR DÉCOR est non assujetti à la TVA (franchise en base de TVA — article 293B du CGI). Les prix peuvent être modifiés à tout moment, les commandes étant facturées au tarif en vigueur au moment de la commande.`},
          {t:'4. Commande et paiement', c:`Les commandes sont effectuées par email à krikordecor@gmail.com. Le paiement est accepté par virement bancaire ou chèque. La prestation est délivrée après réception du paiement complet.`},
          {t:'5. Droit de rétractation', c:`Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de 14 jours calendaires à compter de la date de commande pour exercer votre droit de rétractation, sans avoir à justifier de motifs. Pour exercer ce droit, contactez-nous à krikordecor@gmail.com.`},
          {t:'6. Livraison', c:`Le rapport PDF est envoyé par email dans un délai de 24h ouvrées après réception du paiement. L'abonnement artisan est activé dans les 24h ouvrées suivant la réception du paiement.`},
          {t:'7. Responsabilité', c:`Les diagnostics fournis par HERIT sont indicatifs et ne remplacent pas une expertise professionnelle sur site. KRIKOR DÉCOR ne saurait être tenu responsable des décisions prises sur la base des résultats de la plateforme.`},
          {t:'8. Litiges', c:`En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux compétents seront ceux du ressort du siège de KRIKOR DÉCOR (Valence, Drôme, France). Le droit applicable est le droit français.`},
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
          <Link href="/confidentialite" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Confidentialité</Link>
        </div>
        <div style={{color:'#484F58', fontSize:'0.85rem'}}>© 2026 HERIT — KRIKOR DÉCOR (SIRET 982 153 561)</div>
      </footer>
    </main>
  )
}
