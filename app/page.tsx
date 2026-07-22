'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Home() {
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [lang, setLang] = useState('fr')

  useEffect(() => {
    const saved = localStorage.getItem('HERIT_lang')
    if (saved) setLang(saved)
  }, [])

  return (
    <main style={{backgroundColor:'#0D1117', color:'white', minHeight:'100vh', fontFamily:'system-ui, sans-serif'}}>

      {/* NAV */}
      <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 40px', borderBottom:'1px solid #21262D', position:'sticky', top:0, background:'#0D1117', zIndex:100, flexWrap:'wrap', gap:'12px'}}>
        <Link href="/" style={{fontSize:'1.8rem', fontWeight:'900', color:'#FF6B35', textDecoration:'none'}}>🌡️ HERIT</Link>
        <div style={{display:'flex', gap:'24px', alignItems:'center', flexWrap:'wrap'}}>
          <Link href="/carnet" style={{color:'#ccc', textDecoration:'none', fontSize:'0.95rem'}}>📋 Carnet</Link>
          <Link href="/pourquoi" style={{color:'#ccc', textDecoration:'none', fontSize:'0.95rem'}}>Fonctionnement</Link>
          <Link href="/artisans" style={{color:'#ccc', textDecoration:'none', fontSize:'0.95rem'}}>Professionnels</Link>
          <Link href="/aide" style={{color:'#ccc', textDecoration:'none', fontSize:'0.95rem'}}>Collectivités</Link>
          <Link href="/login" style={{color:'#8B949E', textDecoration:'none', fontSize:'0.95rem'}}>Connexion</Link>
          <Link href="/signup" style={{background:'#FF6B35', color:'white', padding:'10px 24px', borderRadius:'8px', textDecoration:'none', fontWeight:'bold', fontSize:'0.95rem'}}>
            Créer mon Passeport →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{textAlign:'center', padding:'120px 20px 80px', maxWidth:'1000px', margin:'0 auto'}}>
        <div style={{fontSize:'clamp(3rem, 7vw, 6rem)', fontWeight:'900', lineHeight:1.05, marginBottom:'24px', letterSpacing:'-2px'}}>
          Chaque bâtiment<br/>
          <span style={{background:'linear-gradient(135deg, #FF6B35, #FF4444)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>
            mérite une mémoire.
          </span>
        </div>
        <p style={{fontSize:'1.3rem', color:'#8B949E', maxWidth:'650px', margin:'0 auto 16px', lineHeight:1.7}}>
          Votre bâtiment vivra encore 50 à 100 ans. HERIT devient sa mémoire climatique — pour vous, et pour tous les propriétaires qui viendront après vous.
        </p>
        <p style={{fontSize:'1rem', color:'#00D4AA', maxWidth:'600px', margin:'0 auto 40px', fontWeight:'600', lineHeight:1.6}}>
          Découvrez comment il vieillira face aux futures canicules, suivez ses travaux et protégez sa valeur pendant des décennies.
        </p>
        <div style={{display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap', marginBottom:'16px'}}>
          <Link href="/diagnostic" style={{background:'#FF6B35', color:'white', padding:'20px 48px', borderRadius:'10px', textDecoration:'none', fontWeight:'900', fontSize:'1.2rem'}}>
            📋 Créer le Passeport de mon bâtiment
          </Link>
          <Link href="/artisans" style={{background:'transparent', color:'#00D4AA', padding:'20px 40px', borderRadius:'10px', textDecoration:'none', fontWeight:'bold', fontSize:'1.1rem', border:'2px solid #00D4AA'}}>
            👷 Espace Professionnel
          </Link>
        </div>
        <p style={{color:'#484F58', fontSize:'0.9rem'}}>✓ Gratuit ✓ Sans inscription ✓ 46 langues ✓ Mondial</p>

        {/* EXEMPLE CONCRET */}
        <div style={{marginTop:'60px', background:'#161B22', borderRadius:'20px', padding:'32px', border:'1px solid #21262D', textAlign:'left', maxWidth:'560px', margin:'60px auto 0'}}>
          <div style={{color:'#484F58', fontSize:'0.8rem', marginBottom:'16px', textTransform:'uppercase', letterSpacing:'2px'}}>
            📋 Exemple — Passeport Thermique
          </div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'16px', marginBottom:'20px'}}>
            <div>
              <div style={{fontWeight:'900', fontSize:'1.3rem', marginBottom:'4px'}}>Maison individuelle</div>
              <div style={{color:'#8B949E', fontSize:'0.9rem'}}>Construite en 1981 · Valence · 95 m²</div>
            </div>
            <div style={{textAlign:'center', background:'#FFA50015', border:'2px solid #FFA500', borderRadius:'12px', padding:'12px 20px'}}>
              <div style={{fontSize:'0.7rem', color:'#484F58', marginBottom:'4px'}}>SANTÉ THERMIQUE</div>
              <div style={{fontSize:'1.8rem'}}>🟠</div>
              <div style={{color:'#FFA500', fontWeight:'900', fontSize:'0.9rem'}}>À améliorer</div>
            </div>
          </div>

          {/* TIMELINE */}
          <div style={{borderLeft:'2px solid #21262D', paddingLeft:'20px', marginBottom:'20px'}}>
            {[
              {year:'2026', label:'Création du Passeport', color:'#FF6B35', done:true},
              {year:'2028', label:'Pose de volets extérieurs', color:'#00D4AA', done:false},
              {year:'2030', label:'Canicule — Alerte HERIT', color:'#FF4444', done:false},
              {year:'2033', label:'Isolation des combles', color:'#00D4AA', done:false},
              {year:'2038', label:'Nouvelle toiture', color:'#8B949E', done:false},
              {year:'2041', label:'Revente — Passeport transmis', color:'#FF6B35', done:false},
            ].map((item, i) => (
              <div key={i} style={{position:'relative', marginBottom:'12px', opacity: item.done ? 1 : 0.6}}>
                <div style={{position:'absolute', left:'-26px', top:'4px', width:'10px', height:'10px', background: item.color, borderRadius:'50%'}}></div>
                <span style={{color: item.color, fontWeight:'700', fontSize:'0.85rem'}}>{item.year}</span>
                <span style={{color:'#8B949E', fontSize:'0.85rem', marginLeft:'8px'}}>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{padding:'12px', background:'#FF444415', borderRadius:'8px', border:'1px solid #FF444430', marginBottom:'12px'}}>
            <div style={{color:'#FF4444', fontWeight:'700', fontSize:'0.85rem'}}>🌡️ 2032 — Risque élevé de surchauffe prévu</div>
          </div>
          <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'12px'}}>
            {['Volets extérieurs','Ventilation','Isolation toiture'].map((t,i) => (
              <span key={i} style={{background:'#21262D', padding:'4px 10px', borderRadius:'20px', fontSize:'0.8rem'}}>🔧 {t}</span>
            ))}
          </div>
          <div style={{padding:'10px', background:'#00D4AA15', borderRadius:'8px', border:'1px solid #00D4AA30', textAlign:'center'}}>
            <span style={{color:'#00D4AA', fontWeight:'700'}}>Résultat attendu après travaux : </span>
            <span style={{color:'white', fontWeight:'900'}}>-6°C en été</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{background:'#161B22', padding:'60px 20px', marginTop:'60px'}}>
        <div style={{maxWidth:'1000px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'40px', textAlign:'center'}}>
          {[
            {n:'1,6 Md', l:'bâtiments à diagnostiquer dans le monde'},
            {n:'50 ans', l:'de mémoire climatique par bâtiment'},
            {n:'46', l:'langues disponibles'},
            {n:'9', l:'types de clients professionnels'},
          ].map((s,i) => (
            <div key={i}>
              <div style={{fontSize:'2.5rem', fontWeight:'900', color:'#FF6B35'}}>{s.n}</div>
              <div style={{color:'#8B949E', marginTop:'8px'}}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section style={{padding:'80px 20px', maxWidth:'1000px', margin:'0 auto'}}>
        <h2 style={{textAlign:'center', fontSize:'2rem', fontWeight:'800', marginBottom:'12px'}}>Comment ça marche ?</h2>
        <p style={{textAlign:'center', color:'#8B949E', marginBottom:'60px'}}>Le diagnostic est juste la porte d'entrée. Le Passeport est le produit.</p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'24px'}}>
          {[
            {n:'01', t:'Diagnostic gratuit', d:'Répondez à 12 questions sur votre bâtiment. Obtenez votre Santé Thermique en 2 minutes.', c:'#FF6B35'},
            {n:'02', t:'Création du Passeport', d:'Votre bâtiment reçoit son identité numérique. La mémoire commence à s\'écrire.', c:'#00D4AA'},
            {n:'03', t:'Historique vivant', d:'Chaque travaux, chaque intervention, chaque document s\'ajoute au Passeport.', c:'#FFD700'},
            {n:'04', t:'Transmission', d:'Lors d\'une vente, le Passeport est transmis au nouveau propriétaire. L\'histoire continue.', c:'#FF6B35'},
          ].map((s,i) => (
            <div key={i} style={{background:'#161B22', padding:'28px', borderRadius:'14px', border:'1px solid #21262D'}}>
              <div style={{fontSize:'2.5rem', fontWeight:'900', color: s.c, opacity:0.3, marginBottom:'8px'}}>{s.n}</div>
              <h3 style={{fontSize:'1.1rem', fontWeight:'700', margin:'0 0 10px', color: s.c}}>{s.t}</h3>
              <p style={{color:'#8B949E', lineHeight:1.6, fontSize:'0.95rem'}}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POUR QUI */}
      <section style={{background:'#161B22', padding:'80px 20px'}}>
        <div style={{maxWidth:'1000px', margin:'0 auto'}}>
          <h2 style={{textAlign:'center', fontSize:'2rem', fontWeight:'800', marginBottom:'12px'}}>Pour qui ?</h2>
          <p style={{textAlign:'center', color:'#8B949E', marginBottom:'60px'}}>HERIT n'a pas un client. Il en a plusieurs.</p>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px'}}>
            {[
              {e:'🏠', t:'Propriétaires', d:'Gratuit — Carnet de Santé complet'},
              {e:'👷', t:'Artisans', d:'99€/mois — Leads qualifiés'},
              {e:'🏢', t:'Syndics', d:'Professionnel — Gestion de parc'},
              {e:'📋', t:'Notaires', d:'Passeport à la vente'},
              {e:'🛡️', t:'Assureurs', d:'Données risques sur devis'},
              {e:'🏦', t:'Banques', d:'Valeur patrimoine sur devis'},
              {e:'🏙️', t:'Agences immo', d:'Valorisation bien'},
              {e:'🏛️', t:'Collectivités', d:'499€/mois — Parc public'},
              {e:'🌍', t:'États', d:'Infrastructure nationale'},
            ].map((s,i) => (
              <div key={i} style={{background:'#0D1117', padding:'20px', borderRadius:'12px', border:'1px solid #21262D', textAlign:'center'}}>
                <div style={{fontSize:'2rem', marginBottom:'8px'}}>{s.e}</div>
                <div style={{fontWeight:'700', marginBottom:'4px', fontSize:'0.95rem'}}>{s.t}</div>
                <div style={{color:'#484F58', fontSize:'0.8rem'}}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODÈLE ÉCONOMIQUE */}
      <section style={{padding:'80px 20px', maxWidth:'1000px', margin:'0 auto'}}>
        <h2 style={{textAlign:'center', fontSize:'2rem', fontWeight:'800', marginBottom:'12px'}}>Tarifs</h2>
        <p style={{textAlign:'center', color:'#8B949E', marginBottom:'60px'}}>On ne bloque pas le produit. On ajoute de la valeur.</p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'24px'}}>
          {[
            {
              name:'HERIT Gratuit', price:'0€', sub:'Pour toujours',
              color:'#8B949E', border:'#21262D',
              features:['Diagnostic thermique complet','Carnet de Santé Thermique','Historique des travaux','5 documents maximum','1 logement','Conseils généraux'],
              cta:'Commencer gratuitement', href:'/diagnostic'
            },
            {
              name:'HERIT Plus', price:'9,90€', sub:'/mois ou 99€/an',
              color:'#FF6B35', border:'#FF6B35',
              features:['Logements illimités','Documents illimités','Alertes avant canicules','Rapport PDF professionnel','Comparaison année après année','Conseils personnalisés','Support prioritaire'],
              cta:'Démarrer l\'essai', href:'/signup', featured:true
            },
            {
              name:'HERIT Pro', price:'99€', sub:'/mois',
              color:'#00D4AA', border:'#00D4AA',
              features:['Tout HERIT Plus','Gestion clients illimitée','Dépôt de rapports dans les Carnets','Envoi de devis intégré','Badge Professionnel certifié','Accès aux demandes qualifiées','Support dédié'],
              cta:'Rejoindre le réseau Pro', href:'/artisans'
            },
          ].map((plan, i) => (
            <div key={i} style={{background: plan.featured ? 'linear-gradient(135deg, #1A1A2E, #16213E)' : '#161B22', borderRadius:'16px', padding:'32px', border:`2px solid ${plan.border}`, position:'relative'}}>
              {plan.featured && (
                <div style={{position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:'#FF6B35', color:'white', padding:'4px 16px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'700', whiteSpace:'nowrap'}}>
                  ⭐ RECOMMANDÉ
                </div>
              )}
              <div style={{color: plan.color, fontWeight:'700', fontSize:'0.9rem', marginBottom:'8px'}}>{plan.name}</div>
              <div style={{fontSize:'2.5rem', fontWeight:'900', marginBottom:'4px'}}>{plan.price}</div>
              <div style={{color:'#484F58', fontSize:'0.85rem', marginBottom:'24px'}}>{plan.sub}</div>
              <ul style={{listStyle:'none', padding:0, marginBottom:'24px'}}>
                {plan.features.map((f,j) => (
                  <li key={j} style={{padding:'8px 0', borderBottom:'1px solid #21262D', color:'#ccc', display:'flex', gap:'8px', fontSize:'0.9rem'}}>
                    <span style={{color: plan.color}}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} style={{display:'block', textAlign:'center', padding:'14px', background: plan.featured ? '#FF6B35' : 'transparent', color: plan.featured ? 'white' : plan.color, border:`2px solid ${plan.color}`, borderRadius:'8px', textDecoration:'none', fontWeight:'700'}}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p style={{textAlign:'center', color:'#484F58', marginTop:'24px', fontSize:'0.9rem'}}>
          Assureurs · Banques · Foncières · Constructeurs → <a href="mailto:krikordecor@gmail.com?subject=Partenariat HERIT" style={{color:'#FF6B35', textDecoration:'none'}}>Contactez-nous pour un devis</a>
        </p>
      </section>

      {/* TÉMOIGNAGES */}
      <section style={{background:'#161B22', padding:'80px 20px'}}>
        <div style={{maxWidth:'1000px', margin:'0 auto'}}>
          <h2 style={{textAlign:'center', fontSize:'2rem', fontWeight:'800', marginBottom:'60px'}}>Ce que disent nos utilisateurs</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'24px'}}>
            {[
              {t:'Mon appartement de 1965 a obtenu la mention "À améliorer". Le Passeport m\'a permis d\'obtenir une subvention MaPrimeRénov\' pour l\'isolation.', n:'Marie L.', v:'Lyon, France'},
              {t:'En tant qu\'artisan, je reçois maintenant des demandes de clients qui ont déjà leur Passeport HERIT. Je sais exactement quoi proposer.', n:'Ahmed B.', v:'Marseille, France'},
              {t:'Parfait pour notre maison en adobe au Maroc. Les recommandations tenaient compte de nos matériaux locaux.', n:'Fatima K.', v:'Marrakech, Maroc'},
            ].map((s,i) => (
              <div key={i} style={{background:'#0D1117', padding:'28px', borderRadius:'12px', border:'1px solid #21262D'}}>
                <div style={{color:'#FF6B35', fontSize:'1.5rem', marginBottom:'12px'}}>★★★★★</div>
                <p style={{color:'#ccc', lineHeight:1.6, fontStyle:'italic', marginBottom:'16px'}}>"{s.t}"</p>
                <div style={{fontWeight:'700'}}>{s.n}</div>
                <div style={{color:'#8B949E', fontSize:'0.9rem'}}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{padding:'100px 20px', textAlign:'center', background:'#0D1117'}}>
        <div style={{maxWidth:'700px', margin:'0 auto'}}>
          <div style={{fontSize:'clamp(2rem, 5vw, 3.5rem)', fontWeight:'900', lineHeight:1.2, marginBottom:'20px'}}>
            Votre bâtiment<br/>
            <span style={{background:'linear-gradient(135deg, #FF6B35, #FF4444)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>
              se souviendra de tout.
            </span>
          </div>
          <p style={{color:'#8B949E', fontSize:'1.1rem', marginBottom:'40px', lineHeight:1.6}}>
            Créez gratuitement le Passeport Climatique de votre bâtiment aujourd'hui.
          </p>
          <Link href="/diagnostic" style={{display:'inline-block', background:'#FF6B35', color:'white', padding:'22px 60px', borderRadius:'12px', textDecoration:'none', fontWeight:'900', fontSize:'1.3rem', marginBottom:'16px'}}>
            📋 Créer mon Passeport gratuitement
          </Link>
          <p style={{color:'#484F58', fontSize:'0.85rem'}}>Gratuit · 2 minutes · Sans inscription</p>
        </div>
      </section>

      {/* LISTE D'ATTENTE */}
      <section style={{background:'#161B22', padding:'60px 20px', borderTop:'1px solid #21262D'}}>
        <div style={{maxWidth:'600px', margin:'0 auto', textAlign:'center'}}>
          <h3 style={{fontSize:'1.5rem', fontWeight:'900', marginBottom:'12px'}}>Rejoignez les premiers</h3>
          <p style={{color:'#8B949E', marginBottom:'24px'}}>
            Rejoignez les premiers propriétaires qui construisent la mémoire thermique de leur logement.
          </p>
          <div style={{display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap'}}>
            <input type="email" placeholder="Votre email"
              style={{padding:'14px 20px', borderRadius:'8px', border:'1px solid #30363D', background:'#21262D', color:'white', fontSize:'1rem', minWidth:'260px'}} />
            <button style={{background:'#FF6B35', color:'white', border:'none', padding:'14px 28px', borderRadius:'8px', fontSize:'1rem', fontWeight:'900', cursor:'pointer'}}>
              Je rejoins HERIT →
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:'#010409', padding:'40px 20px', borderTop:'1px solid #21262D'}}>
        <div style={{maxWidth:'1000px', margin:'0 auto'}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'40px', marginBottom:'40px'}}>
            <div>
              <div style={{fontSize:'1.5rem', fontWeight:'900', color:'#FF6B35', marginBottom:'12px'}}>🌡️ HERIT</div>
              <p style={{color:'#484F58', fontSize:'0.9rem', lineHeight:1.6}}>Le Passeport Climatique Mondial des bâtiments.</p>
              <p style={{color:'#484F58', fontSize:'0.85rem', marginTop:'8px', fontStyle:'italic'}}>"Confiance · Mémoire · Transmission"</p>
            </div>
            <div>
              <div style={{fontWeight:'700', marginBottom:'12px', color:'#ccc'}}>Plateforme</div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <Link href="/diagnostic" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Diagnostic gratuit</Link>
                <Link href="/carnet" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Carnet Thermique</Link>
                <Link href="/dashboard" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Mon tableau de bord</Link>
                <Link href="/pourquoi" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Pourquoi HERIT ?</Link>
              </div>
            </div>
            <div>
              <div style={{fontWeight:'700', marginBottom:'12px', color:'#ccc'}}>Professionnels</div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <Link href="/artisans" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Artisans & Rénovateurs</Link>
                <Link href="/artisans" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Syndics & Agences</Link>
                <Link href="/artisans" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Collectivités</Link>
                <a href="mailto:krikordecor@gmail.com" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Assureurs & Banques</a>
              </div>
            </div>
            <div>
              <div style={{fontWeight:'700', marginBottom:'12px', color:'#ccc'}}>Légal</div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <Link href="/mentions-legales" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Mentions légales</Link>
                <Link href="/cgv" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>CGV</Link>
                <Link href="/confidentialite" style={{color:'#484F58', textDecoration:'none', fontSize:'0.9rem'}}>Confidentialité</Link>
              </div>
              <div style={{marginTop:'16px', color:'#484F58', fontSize:'0.85rem', lineHeight:1.7}}>
                KRIKOR DÉCOR<br/>SIRET : 982 153 561<br/>Valence (26), France<br/>krikordecor@gmail.com
              </div>
            </div>
          </div>
          <div style={{borderTop:'1px solid #21262D', paddingTop:'20px', textAlign:'center', color:'#484F58', fontSize:'0.85rem'}}>
            © 2026 HERIT — KRIKOR DÉCOR (SIRET 982 153 561) — Tous droits réservés
          </div>
        </div>
      </footer>

    </main>
  )
}
