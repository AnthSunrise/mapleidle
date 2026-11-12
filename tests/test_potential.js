globalThis.window=globalThis;
globalThis.MAPDATA=require('../mapdata.js');
globalThis.MAPDATA_100040300=require('../mapdata_golem.js');
require('../maps.js');
['exptable','itemdata','items','jobs','skills','buffs','basiceff'].forEach(function(f){require('../'+f+'.js');});
var I=MapleItems,S=require('../sim.js'),ok=true;function t(n,c){console.log((c?'OK   ':'FALLA ')+n);if(!c)ok=false;}
var EQ=Object.keys(I.ITEMS).filter(function(k){return I.potEligible(k);});
var wpn=EQ.filter(function(k){return I.ITEMS[k].type==='weapon'&&!I.ITEMS[k].cls||I.ITEMS[k].cls==='warrior'&&I.ITEMS[k].type==='weapon';})[0];
var staff=EQ.filter(function(k){return I.ITEMS[k].type==='weapon'&&I.ITEMS[k].cls==='mage';})[0];
var glove=EQ.filter(function(k){return I.ITEMS[k].type==='glove';})[0],hat=EQ.filter(function(k){return I.ITEMS[k].type==='hat';})[0];
t('equipo inicial / provisional no es elegible',!I.potEligible('1052646')&&!I.potEligible('1432002')&&!I.potEligible('red_potion'));
// valores de la tabla del autor (equipo Lv0-30: Rare1/Epic2/Unique3/Legendary6 ; All Stats un rango por debajo)
function lineOf(id,tier,k){for(var i=0;i<4000;i++){var L=I.rollLines(id,tier,1,1);var l=L.filter(function(x){return x.k===k;})[0];if(l)return l;}return null;}
var lo=EQ.filter(function(k){return I.ITEMS[k].lv<=30&&I.ITEMS[k].lv>0&&I.ITEMS[k].type==='hat';})[0];
[0,1,2,3].forEach(function(tr){var l=lineOf(lo,tr,'statP');t('Lv'+I.ITEMS[lo].lv+' '+I.POT_TIERS[tr]+' STR% = '+[1,2,3,6][tr]+' (sale '+(l&&l.v)+')',l&&l.v===[1,2,3,6][tr]);});
var la=lineOf(lo,3,'allP');t('All Stats Legendary Lv0-30 = 3 (un rango por debajo) (sale '+(la&&la.v)+')',la&&la.v===3);
var hi=EQ.filter(function(k){return I.ITEMS[k].lv>=71&&I.ITEMS[k].lv<=150&&I.ITEMS[k].type==='hat';})[0];
if(hi){var l2=lineOf(hi,3,'statP');t('Lv'+I.ITEMS[hi].lv+' Legendary STR% = 12 (sale '+(l2&&l2.v)+')',l2&&l2.v===12);}
// sin lineas basura y 3 lineas sin duplicados
var junk=0,dup=0,n3=0,bad=0;for(var i=0;i<3000;i++){var id=EQ[i%EQ.length],tr=i%4,L=I.rollLines(id,tr,0.1,0.01);if(L.length===3)n3++;L.forEach(function(l){if(!I.lineText(l))junk++;});var keys=L.map(function(l){return l.k+(l.s||'');});if(new Set(keys).size!==keys.length)dup++;if(L.filter(function(l){return l.k==='crit'||l.k==='critDmg';}).length>2||L.filter(function(l){return l.k==='boss';}).length>2)bad++;}
t('siempre 3 lineas ('+n3+'/3000)',n3===3000);t('sin lineas basura',junk===0);t('ahora SÍ puede repetirse el mismo stat en varias líneas ('+dup+'/3000 equipos)',dup>100);t('crítico/boss no se pasan de su límite',bad===0);
// lineas especificas por tipo
function kinds(id,tr){var s={};for(var i=0;i<1500;i++)I.rollLines(id,tr,1,1).forEach(function(l){s[l.k]=1;});return Object.keys(s);}
t('arma (no mago): ATT%, crit y Boss; sin MATT%',kinds(wpn,3).indexOf('attP')>=0&&kinds(wpn,3).indexOf('boss')>=0&&kinds(wpn,3).indexOf('crit')>=0&&kinds(wpn,3).indexOf('mattP')<0);
if(staff)t('baston de mago: MATT% y no ATT%',kinds(staff,3).indexOf('mattP')>=0&&kinds(staff,3).indexOf('attP')<0);
t('guante: Crit Rate y Crit Damage, sin ATT',kinds(glove,3).indexOf('critDmg')>=0&&kinds(glove,3).indexOf('crit')>=0&&kinds(glove,3).indexOf('attP')<0);
t('sombrero: solo stats/HP/All Stats',kinds(hat,3).every(function(k){return ['statP','hpP','allP'].indexOf(k)>=0;}));
t('Boss solo desde Unique',kinds(wpn,1).indexOf('boss')<0&&kinds(wpn,2).indexOf('boss')>=0);
// probabilidades de subir de rango (Monte Carlo 200k)
function rate(cube,from){var up=0,N=200000;for(var i=0;i<N;i++){var r=I.cubeUse({id:hat,pot:{tier:from,lines:I.rollLines(hat,from,0,0)}},cube);if(r.up)up++;}return up/N;}
[['cube_miracle',0,.118],['cube_miracle',1,.038],['cube_super',0,.141],['cube_super',1,.06],['cube_super',2,.024],['cube_black',0,.16],['cube_black',1,.11],['cube_black',2,.05]].forEach(function(c){var r=rate(c[0],c[1]);t(c[0]+' '+I.POT_TIERS[c[1]]+'->'+I.POT_TIERS[c[1]+1]+' ~'+c[2]*100+'% (sale '+(r*100).toFixed(1)+'%)',Math.abs(r-c[2])<Math.max(0.004,c[2]*0.12));});
t('Miracle no sube Unique->Legendary',rate('cube_miracle',2)===0);
t('cubo sobre equipo sin potencial: no se puede',I.cubeUse(hat,'cube_miracle')===null&&!I.cubeCheck('cube_black',hat));
t('Miracle no sirve con Legendary (Super y Black sí)',(function(){var L={id:hat,pot:{tier:3,lines:I.rollLines(hat,3,0,0)}};return !I.cubeCheck('cube_miracle',L)&&I.cubeUse(L,'cube_miracle')===null&&I.cubeCheck('cube_super',L)&&I.cubeCheck('cube_black',L)&&I.cubeCheck('cube_miracle',{id:hat,pot:{tier:2,lines:I.rollLines(hat,2,0,0)}});})());
t('el rango nunca baja',(function(){for(var i=0;i<2000;i++){var r=I.cubeUse({id:hat,pot:{tier:2,lines:I.rollLines(hat,2,0,0)}},'cube_super');if(r.to<2)return false;}return true;})());
// prime en lineas 2/3: Black 20%/5% vs Miracle 10%/1%
function primeRate(cube,li){var N=60000,c=0,CB=I.CUBES[cube];for(var i=0;i<N;i++){var L=I.rollLines(hat,2,CB.p2,CB.p3);if(L[li].pr===2)c++;}return c/N;}
t('Black linea 2 prime ~20%',Math.abs(primeRate('cube_black',1)-0.20)<0.02);t('Black linea 3 prime ~5%',Math.abs(primeRate('cube_black',2)-0.05)<0.01);t('Miracle linea 2 prime ~10%',Math.abs(primeRate('cube_miracle',1)-0.10)<0.015);
// drops de enemigos: sin potencial / Rare / Epic / Unique
var cnt={none:0,0:0,1:0,2:0},N=200000,rr=function(){return Math.random();};for(var i=0;i<N;i++){var tr=I.potDropTier(rr);cnt[tr<0?'none':tr]++;}
console.log('drops potencial',JSON.stringify(cnt));t('drop: Rare ~28% (decente), Epic ~6%, Unique ~1%',Math.abs(cnt[0]/N-.28)<.01&&Math.abs(cnt[1]/N-.06)<.005&&Math.abs(cnt[2]/N-.01)<.003&&(cnt[3]||0)===0);
var cubes=0,drops=0;for(var i=0;i<400000;i++)I.rollDrop(40).forEach(function(d){if(d.id==='cube_miracle')cubes++;if(I.ITEMS[d.id].kind==='equip'&&d.inst&&d.inst.pot)drops++;});console.log('de 400000 kills: Miracle',cubes,'equipos con potencial',drops);t('Miracle Cube cae a muy bajo rate (~0.25%)',cubes>600&&cubes<1400);
// efecto en las stats
var base={top:'1052646',shoes:'1072850',weapon:wpn};var s0=I.calcStats(60,base,'warrior');
function withPot(line){var e=Object.assign({},base);e.hat={id:hat,pot:{tier:2,lines:[line]}};return I.calcStats(60,e,'warrior');}
var s1=withPot({k:'statP',s:'str',v:10,pr:2}),sF=withPot({k:'statF',s:'str',v:7,pr:-1}),sA=withPot({k:'allP',v:10,pr:2}),sH=withPot({k:'hpF',v:35,pr:-1}),sAt=withPot({k:'attP',v:10,pr:2}),sh=I.calcStats(60,Object.assign({},base,{hat:hat}),'warrior');
t('STR +10% sube el STR total',s1.str>sh.str&&s1.str===Math.floor(sh.str*1.1));t('STR +7 plano',sF.str===sh.str+7);t('All Stats +10% (a los 4 stats)',sA.str===Math.floor(sh.str*1.1)&&sA.dex===Math.floor(sh.dex*1.1)&&sA.int===Math.floor(sh.int*1.1)&&sA.luk===Math.floor(sh.luk*1.1)&&sA.str>sh.str);t('HP plano +35',sH.mhp===sh.mhp+35);t('ATT +10% sube ATT y el daño',sAt.att>sh.att&&sAt.max>sh.max);
// bonificaciones en sim (crit, HP%, boss)
var w=S.createWorld(MAPDATA,{});w.chars=[];S.addCharacter(w,{name:'X',cls:'warrior',level:60});S.selectChar(w,0);var c=w.chars[0];
var m0=S.maxHpOf?0:0;
c.equip.glove={id:glove,pot:{tier:3,lines:[{k:'crit',v:8,pr:3},{k:'critDmg',v:8,pr:3},{k:'hpP',v:10,pr:3}]}};
c.equip.weapon={id:wpn,pot:{tier:3,lines:[{k:'boss',v:40,pr:3},{k:'boss',v:30,pr:2},{k:'attP',v:5,pr:1}]}};
var md=S.mods?S.mods(c):null;if(md){t('crit +8% y crit dmg +8% por potencial',Math.abs(md.crit-0.08)<1e-9&&Math.abs(md.critDmg-0.08)<1e-9);t('HP% +10%',Math.abs(md.hpPct-0.10)<1e-9);t('Boss +70%',Math.abs(md.bossPct-0.70)<1e-9);}else console.log('(S.mods no exportado)');
console.log(ok?'TODO OK':'HAY FALLOS');
