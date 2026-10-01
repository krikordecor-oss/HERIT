import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm';

const SUPABASE_URL='https://qzqqrwyaejtsbcwbrwue.supabase.co';
const SUPABASE_KEY='sb_publishable_LHbvqEdeSTYMcVreNlqocA_nTRMUP9N';

export const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});

export async function cloudGetSession(){
  const {data,error}=await supabase.auth.getSession();if(error)throw error;return data.session;
}
export function cloudOnAuthChange(cb){return supabase.auth.onAuthStateChange(cb);}
export async function cloudSignIn(email,password){
  if(!email||!password)throw new Error('E-mail et mot de passe requis.');
  const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;return data.session;
}
export async function cloudSignUp(email,password){
  if(!email||password.length<8)throw new Error('Utilisez un e-mail valide et un mot de passe d’au moins 8 caractères.');
  const {data,error}=await supabase.auth.signUp({email,password});if(error)throw error;return data.session||data;
}
export async function cloudSignOut(){const {error}=await supabase.auth.signOut();if(error)throw error;}
async function invoke(name,body){
  const {data,error}=await supabase.functions.invoke(name,{body});
  if(error)throw error;return data;
}
export function cloudIngestScan(payload){return invoke('ingest-scan',payload);}
export function cloudIngestObservation(payload){return invoke('ingest-observation',payload);}

export function cloudLibrary(action='list',payload={}){return invoke('user-library',{action,...payload});}

export function cloudOpportunity(building_id,vertical='real_estate'){return invoke('opportunity-engine',{building_id,vertical});}
export function cloudProspects(action='list',payload={}){return invoke('prospect-manager',{action,...payload});}

export function cloudEnrichBuilding(building_id){return invoke('enrich-building',{building_id});}
