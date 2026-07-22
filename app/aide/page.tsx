import Link from 'next/link'

export default function AidePage() {
  return (
    <main style={{backgroundColor:'#0D1117', color:'white', minHeight:'100vh', fontFamily:'system-ui, sans-serif'}}>
      <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 40px', borderBottom:'1px solid #21262D', background:'#0D1117'}}>
        <Link href="/" style={{fontSize:'1.8rem', fontWeight:'900', color:'#FF6B35', textDecoration:'none'}}>🌡️ HERIT</Link>
        <Link href="/diagnostic" style={{background:'#FF6B35', color:'white', padding:'10px 24px', borderRadius:'8px', textDecoration:'none', fontWeight:'bold'}}>Démarrer →</Link>
      </nav>

      <section style={{maxWidth:'800px', margin:'0 auto', padding:'60px 20px'}}>
        <h1 style={{fontSize:'2.5rem', fontWeight:'900', marginBottom:'40px', textAlign:'center'}}>Aide & FAQ</h1>

        {[
          {q:'Comment fonctionne le diagnostic HERIT ?', r:'Répondez à 12 questions sur votre bâtiment (matériaux, année de construction, isolation, exposition). Notre algorithme calcule un score de vulnérabilité thermique de 0 à 100 et génère un plan d\'action personnalisé.'},
          {q:'Le diagnostic est-il vraiment gratuit ?', r:'Oui, le diagnostic de base est 100% gratuit et sans inscription. Le rapport PDF détaillé est disponible pour 19€ sur demande.'},
          {q:'Dans quels pays fonctionne HERIT ?', r:'HERIT fonctionne dans le monde entier. L\'outil prend en compte les matériaux de construction de toutes les régions du monde, des maisons en pierre d\'Europe aux habitats en banco d\'Afrique ou en bambou d\'Asie.'},
          {q:'Que signifie mon score thermique ?', r:'0-30 : Bâtiment résilient — peu de risques. 31-60 : Risque modéré — travaux recommandés à moyen terme. 61-80 : Risque élevé — intervention dans les 2 ans. 81-100 : Risque critique — intervention urgente recommandée.'},
          {q:'Comment être mis en relation avec un artisan ?', r:'Cliquez sur le bouton "Être mis en relation avec un artisan" sur votre page de résultats. Un email sera envoyé à notre équipe qui vous contactera dans les 48h avec des références d\'artisans qualifiés dans votre zone.'},
          {q:'Comment obtenir mon rapport PDF ?', r:'Cliquez sur "Télécharger mon rapport — 19€" sur votre page de résultats. Envoyez votre demande par email à krikordecor@gmail.com. Vous recevrez votre rapport détaillé sous 24h après paiement.'},
          {q:'Je suis artisan, comment rejoindre HERIT ?', r:'Rendez-vous sur la page Espace Artisan et remplissez le formulaire d\'inscription. L\'abonnement est de 49€/mois sans engagement. Vous recevrez des leads qualifiés dans votre zone géographique.'},
          {q:'Les données de mon diagnostic sont-elles conservées ?', r:'Non. HERIT ne conserve aucune donnée personnelle lors du diagnostic gratuit. Vos réponses sont traitées localement dans votre navigateur et ne sont jamais envoyées à nos serveurs.'},
          {q:'Comment changer la langue ?', r:'Utilisez le sélecteur de langue orange en haut du formulaire de diagnostic. HERIT est disponible en 46 langues.'},
          {q:'Qui a créé HERIT ?', r:'HERIT a été créé par Krikor Simonian, expert en bâtiment avec 40 ans d\'expérience en peinture, plâtrerie, isolation thermique et rénovation haut de gamme (KRIKOR DÉCOR, Valence, France).'},
        ].map((item, i) => (
          <div key={i} style={{background:'#161B22', borderRadius:'12px', padding:'24px', marginBottom:'16px', border:'1px solid #21262D'}}>
            <h3 style={{color:'#FF6B35', fontSize:'1.1rem', marginBottom:'12px'}}>❓ {item.q}</h3>
            <p style={{color:'#8B949E', lineHeight:1.7}}>{item.r}</p>
          </div>
        ))}

        <div style={{background:'linear-gradient(135deg, #1A1A2E, #16213E)', borderRadius:'16px', padding:'40px', textAlign:'center', marginTop:'40px'}}>
          <h2 style={{fontSize:'1.5rem', fontWeight:'800', marginBottom:'16px'}}>Une question non répondue ?</h2>
          <p style={{color:'#8B949E', marginBottom:'24px'}}>Notre équipe répond sous 24h</p>
          <a href="mailto:krikordecor@gmail.com?subject=Question HERIT"
            style={{background:'#FF6B35', color:'white', padding:'16px 40px', borderRadius:'10px', textDecoration:'none', fontWeight:'bold', fontSize:'1.1rem'}}>
            ✉️ Nous contacter
          </a>
        </div>
      </section>

      <footer style={{background:'#010409', padding:'30px 20px', borderTop:'1px solid #21262D', textAlign:'center'}}>
        <div style={{display:'flex', gap:'20px', justifyContent:'center', flexWrap:'wrap', marginBottom:'16px'}}>
          <Link href="/" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Accueil</Link>
          <Link href="/diagnostic" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Diagnostic</Link>
          <Link href="/artisans" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Artisans</Link>
          <Link href="/mentions-legales" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Mentions légales</Link>
          <Link href="/cgv" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>CGV</Link>
          <Link href="/confidentialite" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Confidentialité</Link>
        </div>
        <div style={{color:'#484F58', fontSize:'0.85rem'}}>© 2026 HERIT — KRIKOR DÉCOR (SIRET 982 153 561)</div>
      </footer>
    </main>
  )
}
