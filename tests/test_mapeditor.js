// Mapa creado con tools/map_editor.html (2 plataformas conectadas con pendiente + 1 aislada + 1 cuerda + 3 enemigos) cargado en el simulador.
var D={"footholds":[{"id":1,"x1":-200,"y1":460,"x2":0,"y2":460,"prev":0,"next":2},{"id":2,"x1":0,"y1":460,"x2":200,"y2":440,"prev":1,"next":3},{"id":3,"x1":200,"y1":440,"x2":400,"y2":440,"prev":2,"next":0},{"id":4,"x1":-100,"y1":260,"x2":100,"y2":260,"prev":0,"next":0}],"ladders":[{"l":0,"x":50,"y1":260,"y2":460}],"life":[{"type":"m","id":"9010028","x":-50,"y":460,"fh":1,"cy":429,"rx0":-200,"rx1":400},{"type":"m","id":"9010028","x":300,"y":440,"fh":3,"cy":409,"rx0":-200,"rx1":400},{"type":"m","id":"9010028","x":0,"y":260,"fh":4,"cy":229,"rx0":-100,"rx1":100}]};
globalThis.MAPDATA=require('../mapdata.js');
require('../maps.js');
MAPLE_MAPS.ed={name:'Editor',region:'Henesys',lv:1,img:'map/x.png',off:{x:0,y:0},data:D,homeFh:2,spawnX:100};
['exptable','itemdata','items','skills','buffs'].forEach(function(f){require('../'+f+'.js');});
var S=require('../sim.js'),ok=true;
function t(n,c){console.log((c?'OK   ':'FALLA ')+n);if(!c)ok=false;}
var w=S.createWorld(MAPDATA,{});w.chars=[];S.addCharacter(w,{name:'A',cls:'warrior',level:30,mapId:'ed'});S.selectChar(w,0);var c=w.chars[0];
t('3 enemigos',w.mobs.length===3);
t('personaje aparece en la plataforma de inicio',c.player.node&&c.player.node.segs.length===3&&Math.abs(c.player.y-450)<=10);
t('la cuerda conecta las dos plataformas',w.map.ladders.length===1&&!!w.map.ladders[0].top);
var r=S.bfs(w.map,c.player.node.i),un=w.mobs.filter(function(m){return r.dist[m.node.i]===Infinity;}).length;
t('enemigos alcanzables ('+un+' no)',un===0);
c.skills.slashBlast.level=20;for(var i=0;i<60*120;i++){S.step(w,S.STEP);c.stats.mp=c.stats.maxMp;}
t('farmea sin errores ('+w.kills+' kills)',w.kills>0);
console.log(ok?'TODO OK':'HAY FALLOS');
