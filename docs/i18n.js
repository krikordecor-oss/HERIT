export const SUPPORTED_LANGUAGES=[
{code:'fr-FR',native:'Français',name:'French'},
{code:'en-US',native:'English',name:'English'},
{code:'es-ES',native:'Español',name:'Spanish'},
{code:'de-DE',native:'Deutsch',name:'German'},
{code:'it-IT',native:'Italiano',name:'Italian'},
{code:'pt-PT',native:'Português',name:'Portuguese'},
{code:'ar',native:'العربية',name:'Arabic'},
{code:'zh-CN',native:'简体中文',name:'Chinese'},
{code:'ja-JP',native:'日本語',name:'Japanese'},
{code:'ko-KR',native:'한국어',name:'Korean'},
{code:'hi-IN',native:'हिन्दी',name:'Hindi'},
{code:'tr-TR',native:'Türkçe',name:'Turkish'},
{code:'pl-PL',native:'Polski',name:'Polish'},
{code:'nl-NL',native:'Nederlands',name:'Dutch'},
{code:'ru-RU',native:'Русский',name:'Russian'}
];

export const I18N={
'fr':{hero:'Regardez un bâtiment.<br>Comprenez-le.',sub:'Données, historique et intelligence du bâtiment en un regard.',scan:'Scanner un bâtiment',activity:'Mon activité',language:'Langue'},
'en':{hero:'Look at a building.<br>Understand it.',sub:'Data, history and building intelligence at a glance.',scan:'Scan a building',activity:'My activity',language:'Language'},
'es':{hero:'Mira un edificio.<br>Compréndelo.',sub:'Datos, historial e inteligencia del edificio de un vistazo.',scan:'Escanear un edificio',activity:'Mi actividad',language:'Idioma'},
'de':{hero:'Sehen Sie ein Gebäude.<br>Verstehen Sie es.',sub:'Daten, Historie und Gebäudeintelligenz auf einen Blick.',scan:'Gebäude scannen',activity:'Meine Aktivität',language:'Sprache'},
'it':{hero:'Guarda un edificio.<br>Comprendilo.',sub:'Dati, storia e intelligence dell’edificio in un colpo d’occhio.',scan:'Scansiona un edificio',activity:'La mia attività',language:'Lingua'},
'pt':{hero:'Olhe para um edifício.<br>Compreenda-o.',sub:'Dados, histórico e inteligência do edifício num relance.',scan:'Digitalizar edifício',activity:'A minha atividade',language:'Idioma'},
'ar':{hero:'انظر إلى المبنى.<br>افهمه.',sub:'بيانات وتاريخ وذكاء المبنى في لمحة.',scan:'مسح مبنى',activity:'نشاطي',language:'اللغة'},
'zh':{hero:'看一栋建筑。<br>读懂它。',sub:'一眼了解建筑的数据、历史与智能信息。',scan:'扫描建筑',activity:'我的活动',language:'语言'},
'ja':{hero:'建物を見る。<br>理解する。',sub:'建物のデータ、履歴、インテリジェンスをひと目で。',scan:'建物をスキャン',activity:'マイアクティビティ',language:'言語'}
};

export function getPreferredLocale(){
  const nav=(navigator.languages&&navigator.languages[0])||navigator.language||'en-US';
  const base=nav.split('-')[0].toLowerCase();
  return SUPPORTED_LANGUAGES.find(l=>l.code.toLowerCase()===nav.toLowerCase())?.code
    ||SUPPORTED_LANGUAGES.find(l=>l.code.split('-')[0]===base)?.code
    ||'en-US';
}
export function localeLabel(code){
  return SUPPORTED_LANGUAGES.find(l=>l.code===code)?.native||code;
}
export function applyTranslations(locale){
  const base=locale.split('-')[0];
  const t=I18N[base]||I18N.en;
  const h=document.querySelector('.welcome h1');if(h)h.innerHTML=t.hero;
  const p=document.querySelector('.welcome p');if(p)p.textContent=t.sub;
  const b=document.getElementById('enterBtn');if(b)b.textContent=t.scan;
  const links=[...document.querySelectorAll('.drawerNav a')];
  const activity=links.find(a=>a.getAttribute('href')==='dashboard.html');if(activity)activity.childNodes[0].nodeValue=t.activity+' ';
  const languageBtn=document.getElementById('languageBtn');if(languageBtn)languageBtn.childNodes[0].nodeValue=t.language+' ';
}