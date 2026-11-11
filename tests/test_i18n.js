// Idiomas: fallback al español, sustitución de {n}, y que tutorial + misiones estén traducidos con marcadores idénticos
var fs=require('fs'),path=require('path'),ok=true;
function t(n,c){console.log((c?'OK   ':'FALLA ')+n);if(!c)ok=false;}
function rd(f){return fs.readFileSync(path.join(__dirname,'..',f),'utf8');}
globalThis.localStorage={getItem:function(k){return k==='maple_lang'?globalThis.__lang:null;},setItem:function(){}};

globalThis.window=globalThis;
new Function(rd('lang_en.js'))();
var EN=globalThis.MAPLE_EN;
function load(l){globalThis.__lang=l;delete require.cache[require.resolve('../i18n.js')];return require('../i18n.js');}
var es=load('es');t('español: devuelve el mismo texto',es.t('Hola {0}','x')==='Hola x');
var en=load('en');t('inglés: traduce',en.t('Siguiente')==='Next');
t('inglés: sustituye {n}',en.t('Misiones ({0}/{1})',2,6)==='Quests (2/6)');
t('inglés: sin traducción cae al español',en.t('texto sin traducir')==='texto sin traducir');
t('lang() devuelve en',en.lang()==='en');
var m=rd('tutorial.js').match(/var STEPS = (\[[\s\S]*?\n  \]);/),STEPS=new Function('return '+m[1])();
var Q=require('../quests.js');
var keys=[];STEPS.forEach(function(s){keys.push(s.title,s.text);});keys.push('Saltar tutorial','Anterior','Siguiente','Entendido');
Q.QUESTS.forEach(function(q){keys.push(q.title,q.desc,q.obj);});
keys.forEach(function(k){t('traducido: '+k.slice(0,40),Object.prototype.hasOwnProperty.call(EN,k)&&EN[k]!==''&&EN[k]!==k||/^(Equip|Stat|Skill|No|mesos)$/.test(k));});
function marks(s,r){return (s.match(r)||[]).length;}
Object.keys(EN).forEach(function(k){var v=EN[k];
  if(marks(k,/\[/g)!==marks(v,/\[/g)||marks(k,/\]/g)!==marks(v,/\]/g))t('negritas [ ] iguales: '+k.slice(0,40),false);
  if((k.match(/\{\d+\}/g)||[]).sort().join()!==(v.match(/\{\d+\}/g)||[]).sort().join())t('placeholders iguales: '+k.slice(0,40),false);
  if(marks(k,/\n\n/g)!==marks(v,/\n\n/g))t('párrafos iguales: '+k.slice(0,40),false);});
t('index.html carga lang_en.js e i18n.js antes del resto',(function(h){return h.indexOf('lang_en.js')>0&&h.indexOf('lang_en.js')<h.indexOf('i18n.js')&&h.indexOf('i18n.js')<h.indexOf('mapdata.js');})(rd('index.html')));
// todas las llamadas $t('...') con texto literal de los módulos tienen traducción
['tutorial','quests','mui','items','skills','jobs','buffs','chars','worldmap','ui','game','sim'].forEach(function(f){
  var src=rd(f+'.js'),re=/\$t\('((?:[^'\\]|\\.)*)'/g,m,miss=[];
  while((m=re.exec(src))){var k=m[1].replace(/\\'/g,"'").replace(/\\n/g,'\n');if(!Object.prototype.hasOwnProperty.call(EN,k))miss.push(k);}
  t(f+'.js: todos sus $t() tienen traducción'+(miss.length?' (faltan: '+miss.slice(0,4).join(' | ')+')':''),miss.length===0);});
console.log(ok?'TODO OK':'HAY FALLOS');
