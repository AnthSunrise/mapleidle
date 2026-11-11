globalThis.window=globalThis;globalThis.MAPDATA=require('../mapdata.js');require('../maps.js');
['exptable','itemdata','items'].forEach(function(f){require('../'+f+'.js');});
var I=MapleItems,ok=true;function t(n,c){console.log((c?'OK   ':'FALLA ')+n);if(!c)ok=false;}
function A(lv,cls,br){var s=I.calcStats(lv,{},cls,br);return [s.ap.str,s.ap.dex,s.ap.int,s.ap.luk].join('/');}
t('Lv1 warrior 12/5/4/4',A(1,'warrior')==='12/5/4/4');t('Lv1 mage 4/4/12/5',A(1,'mage')==='4/4/12/5');t('Lv1 archer 5/12/4/4',A(1,'archer')==='5/12/4/4');t('Lv1 thief 4/5/4/12',A(1,'thief')==='4/5/4/12');t('Lv1 pirate 12/5/4/4',A(1,'pirate')==='12/5/4/4');
t('Lv53 warrior 272/5/4/4 ('+A(53,'warrior')+')',A(53,'warrior')==='272/5/4/4');
t('Lv53 mage 4/4/272/5',A(53,'mage')==='4/4/272/5');t('Lv53 archer 5/272/4/4',A(53,'archer')==='5/272/4/4');t('Lv53 thief 4/5/4/272',A(53,'thief')==='4/5/4/272');
t('Gunslinger Lv53 intercambia STR/DEX: 5/272/4/4 ('+A(53,'pirate','gunslinger')+')',A(53,'pirate','gunslinger')==='5/272/4/4');
t('Brawler Lv53 272/5/4/4',A(53,'pirate','brawler')==='272/5/4/4');
// el stat principal de cada clase es el que da el daño: +100 al principal sube el máximo, +100 a otro no tanto
[['warrior','str'],['mage','int'],['archer','dex'],['thief','luk'],['pirate','str'],['pirate','dex','gunslinger']].forEach(function(c){
  var eq={};var base=I.calcStats(40,{},c[0],c[2]).max;
  var key=['str','dex','int','luk'];var gain={};key.forEach(function(k){var b={};b[k]=100;gain[k]=I.calcStats(40,{},c[0],c[2],b).max-base;});
  var best=key.reduce(function(a,k){return gain[k]>gain[a]?k:a;},'str');
  t(c[0]+(c[2]?'/'+c[2]:'')+': el stat que más daño da es '+c[1]+' (+100 -> '+JSON.stringify(gain)+')',best===c[1]);});
// los requisitos de equipo (stat principal) se cumplen con solo AP al nivel del objeto
var bad=[];for(var id in I.ITEMS){var it=I.ITEMS[id];if(it.kind!=='equip'||!it.lv||it.only)continue;var cl=it.cls;if(!cl)continue;var s=I.calcStats(it.lv,{},cl),s2=cl==='pirate'?I.calcStats(it.lv,{},cl,'gunslinger'):s;(it.req||[]).forEach(function(r,i){var k=['str','dex','int','luk'][i];if(r>Math.max(s[k],s2[k]))bad.push(it.name+' L'+it.lv+' '+k+' '+r+'>'+s[k]);});}
t('ningún equipo queda imposible de equipar por requisito ('+bad.length+') '+bad.slice(0,5).join('; '),bad.length===0);
console.log(ok?'TODO OK':'HAY FALLOS');
