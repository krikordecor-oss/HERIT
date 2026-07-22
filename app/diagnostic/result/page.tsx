import { Suspense } from 'react'
import ResultClient from './ResultClient'

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div style={{backgroundColor:'#1A1A2E', minHeight:'100vh', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem'}}>
        Chargement...
      </div>
    }>
      <ResultClient />
    </Suspense>
  )
}
