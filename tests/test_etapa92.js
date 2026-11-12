// Etapa 92: aggro (el primero que golpea), jefes persistentes al refrescar, estado de personajes (posición/HP/buffs)
var D={"footholds":[{"id":1,"x1":-200,"y1":460,"x2":0,"y2":460,"prev":0,"next":2},{"id":2,"x1":0,"y1":460,"x2":200,"y2":440,"prev":1,"next":3},{"id":3,"x1":200,"y1":440,"x2":400,"y2":440,"prev":2,"next":0},{"id":4,"x1":-100,"y1":260,"x2":100,"y2":260,"prev":0,"next":0}],"ladders":[{"l":0,"x":50,"y1":260,"y2":460}],"life":[{"type":"m","id":"9010028","x":-50,"y":460,"fh":1,"cy":429,"rx0":-200,"rx1":400},{"type":"m","id":"9010028","x":300,"y":440,"fh":3,"cy":409,"rx0":-200,"rx1":400},{"type":"m","id":"9010028","x":0,"y":260,"fh":4,"cy":229,"rx0":-100,"rx1":100}]};
globalThis.MAPDATA=require('../mapdata.js');
require('../maps.js');
MAPLE_MAPS.ed={name:'Editor',region:'Henesys',lv:1,img:'map/x.png',off:{x:0,y:0},data:D,homeFh:2,spawnX:100};
['exptable','itemdata','items','skills','buffs'].forEach(function(f){require('../'+f+'.js');});
var S=require('../sim.js'),ok=true;function t(n,c){console.log((c?'OK   ':'FALLA ')+n);if(!c)ok=false;}
var w=S.createWorld(MAPDATA,{fieldBosses:{ed:[{id:'6130101',kind:'mushmom',x:300,fh:3,respawn:900,drops:10}]}});w.chars=[];
['A','B'].forEach(function(n){S.addCharacter(w,{name:n,cls:'warrior',level:60,mapId:'ed'});});S.selectChar(w,0);
// --- aggro: el enemigo normal persigue a quien lo golpeó primero
var m=w.zones.ed.mobs.filter(function(x){return !x.boss;})[0]||null;
if(!m){ // el mapa de prueba no trae enemigos: creamos uno junto al personaje A
  var A=w.chars[0].player;m={id:'100100',kind:'snail_blue',spawnX:A.x+150,x:A.x+150,y:A.y,node:A.node,dir:1,hp:1e9,maxHp:1e9,state:'move',t:5};w.zones.ed.mobs.push(m);}
var A=w.chars[0],B=w.chars[1];
w.chars.forEach(function(c){c.ai.auto=false;});
m.hp=m.maxHp=1e9;S.step(w,S.STEP);
t('sin golpes no hay aggro',!m.aggro);
m.hp-=10;m.aggro=null;S.aggroScan(w,B);t('el primero en golpear queda de objetivo',m.aggro===B);
m.hp-=10;S.aggroScan(w,A);t('un segundo atacante NO le quita el aggro',m.aggro===B);
B.player.x=m.x+200;B.player.node=m.node;B.player.y=m.y;m.state='move';m.t=5;var d0=Math.abs(m.x-B.player.x);
for(var i=0;i<60;i++){m.state=m.state==='hit'?'move':m.state;S.step(w,S.STEP);}
t('el enemigo se acerca a su objetivo ('+Math.round(d0)+' -> '+Math.round(Math.abs(m.x-B.player.x))+')',Math.abs(m.x-B.player.x)<d0-15);
for(var i=0;i<60*10;i++)S.step(w,S.STEP);
t('el aggro expira tras unos segundos sin golpes',!m.aggro);
// --- jefes persistentes
var b=w.zones.ed.mobs.filter(function(x){return x.boss;})[0];
b.hp=Math.round(b.maxHp/2);var s1=JSON.parse(JSON.stringify(S.bossSnap(w)));
b.hp=0;b.state='dead';b.t=500;var s2=JSON.parse(JSON.stringify(S.bossSnap(w)));
var w2=S.createWorld(MAPDATA,{fieldBosses:{ed:[{id:'6130101',kind:'mushmom',x:300,fh:3,respawn:900,drops:10}]}});
var b2=w2.zones.ed.mobs.filter(function(x){return x.boss;})[0];
S.bossRestore(w2,s1,Date.now());t('jefe vivo conserva su vida ('+b2.hp+'/'+b2.maxHp+')',b2.state!=='dead'&&Math.abs(b2.hp-Math.round(b2.maxHp/2))<2);
S.bossRestore(w2,s2,Date.now());t('jefe muerto sigue muerto tras refrescar',b2.state==='dead'&&b2.t>490&&b2.t<=500);
b2.state='move';S.bossRestore(w2,s2,Date.now()-600000);t('si pasó más que el respawn reaparece',b2.state==='move');
b2.hp=b2.maxHp;
// --- estado de personaje
var c=A;c.player.x=c.player.x+37;c.player.dir=-1;c.stats.hp=Math.round(c.stats.maxHp/2);c.stats.mp=5;
c.buffs=[{id:'haste',name:'Haste',t:100,dur:200,mods:{speed:10},icon:null},{id:'x',name:'x',t:5,dur:5,mods:{}}];
var snap=JSON.parse(JSON.stringify(S.charSnap(c)));
var w3=S.createWorld(MAPDATA,{});w3.chars=[];S.addCharacter(w3,{name:'A',cls:'warrior',level:60,mapId:'ed'});var c3=w3.chars[0];
S.charRestore(w3,c3,snap,Date.now()-10000);
t('posición restaurada',Math.abs(c3.player.x-c.player.x)<0.2&&c3.player.dir===-1);
t('HP/MP restaurados',c3.stats.hp===c.stats.hp&&c3.stats.mp===5);
t('buffs vigentes se restauran descontando el tiempo ausente',c3.buffs.length===1&&c3.buffs[0].id==='haste'&&c3.buffs[0].t>85&&c3.buffs[0].t<91);
S.charRestore(w3,c3,{x:'zzz',n:9999,hp:'a',b:'no'},Date.now());t('datos corruptos no rompen',true);
console.log(ok?'TODO OK':'HAY FALLOS');
