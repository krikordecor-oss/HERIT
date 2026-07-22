import { Suspense } from 'react'
import DiagnosticForm from './DiagnosticForm'

export default function DiagnosticPage() {
  return (
    <Suspense fallback={<div style={{backgroundColor:'#1A1A2E',minHeight:'100vh',color:'white',display:'flex',alignItems:'center',justifyContent:'center'}}>Chargement...</div>}>
      <DiagnosticForm />
    </Suspense>
  )
}
