import Link from 'next/link'

export default function Navbar() {
  return (
    <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 40px', borderBottom:'1px solid #21262D', background:'#0D1117', position:'sticky', top:0, zIndex:100}}>
      <Link href="/" style={{fontSize:'1.8rem', fontWeight:'900', color:'#FF6B35', textDecoration:'none'}}>
        🌡️ HERIT
      </Link>
      <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
        <Link href="/diagnostic" style={{color:'#ccc', textDecoration:'none'}}>Diagnostic</Link>
        <Link href="/artisans" style={{color:'#ccc', textDecoration:'none'}}>Artisans</Link>
        <Link href="/aide" style={{color:'#ccc', textDecoration:'none'}}>Aide</Link>
        <Link href="/diagnostic" style={{background:'#FF6B35', color:'white', padding:'10px 24px', borderRadius:'8px', textDecoration:'none', fontWeight:'bold'}}>
          Démarrer →
        </Link>
      </div>
    </nav>
  )
}
