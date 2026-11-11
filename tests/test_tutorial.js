// Comprueba los datos del tutorial (sin DOM): 11 pasos, el último marcado, imágenes existentes, negritas balanceadas
var fs=require('fs'),path=require('path'),ok=true;
function t(n,c){console.log((c?'OK   ':'FALLA ')+n);if(!c)ok=false;}
var src=fs.readFileSync(path.join(__dirname,'../tutorial.js'),'utf8');
var m=src.match(/var STEPS = (\[[\s\S]*?\n  \]);/);
var STEPS=new Function('return '+m[1])();
t('11 pasos (10 + final)',STEPS.length===11);
t('solo el último es "last"',STEPS.filter(function(s){return s.last;}).length===1&&STEPS[10].last);
t('todos tienen título y texto',STEPS.every(function(s){return s.title&&s.text;}));
t('negritas [ ] balanceadas',STEPS.every(function(s){return (s.text.match(/\[/g)||[]).length===(s.text.match(/\]/g)||[]).length;}));
t('imágenes existen',STEPS.every(function(s){return !s.img||fs.existsSync(path.join(__dirname,'../assets/tutorial',s.img));}));
t('el texto de pociones menciona la pestaña USE',/USE/.test(STEPS[7].text));
t('index.html carga tutorial.js después de mui.js',(function(h){return h.indexOf('tutorial.js')>h.indexOf('mui.js')&&h.indexOf('mui.js')>0;})(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8')));
console.log(ok?'TODO OK':'HAY FALLOS');
