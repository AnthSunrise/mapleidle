// Misiones de bienvenida: detección, regalos, inventario lleno y normalización del guardado
['exptable','itemdata','items'].forEach(function(f){require('../'+f+'.js');});
var I=require('../items.js'),Q=require('../quests.js'),ok=true;
function t(n,c){console.log((c?'OK   ':'FALLA ')+n);if(!c)ok=false;}
function W(){return {chars:[{zones:{},stats:{level:1},mapId:'henesys'}],leader:null,mesos:0,inv:I.newInventory(),quests:null};}
var w=W();
t('sin hacer nada no se completa ninguna',Q.tick(w).length===0);
w.chars[0].zones.henesys={x1:0,y1:0,x2:10,y2:10};
t('zona detectada',Q.tick(w).join()==='zone');
t('no se repite',Q.tick(w).length===0);
w.leader=w.chars[0];t('líder',Q.tick(w).join()==='leader');
t('evento de poción',Q.event(w,'potion').join()==='potions'&&Q.event(w,'potion').length===0);
t('evento de tienda',Q.event(w,'shop').join()==='shop');
w.chars[0].stats.level=10;t('nivel 10',Q.tick(w).join()==='level10');
t('el bono aún no',!w.quests.done.all);
w.chars[0].mapId='forest';t('viaje + bono',Q.tick(w).join()==='travel,all'||Q.tick(w).join()==='travel');
Q.tick(w);t('bono completado tras las seis',w.quests.done.all===true);
t('no se puede reclamar lo no hecho',!Q.claim(W(),'zone',I).ok);
var r=Q.claim(w,'zone',I);t('reclamar zona da 1000 mesos',r.ok&&w.mesos===1000);
t('no se reclama dos veces',!Q.claim(w,'zone',I).ok&&w.mesos===1000);
Q.claim(w,'potions',I);t('regalo de pociones llega al inventario',I.countItem(w.inv,'red_potion')===20&&I.countItem(w.inv,'blue_potion')===20);
// inventario USE lleno: no entrega nada y no marca como reclamada
var f=W();Q.event(f,'shop');f.inv.use=f.inv.use.map(function(){return {id:'scroll_piece',count:9999};});
var fr=Q.claim(f,'shop',I);t('inventario lleno rechaza el regalo',!fr.ok&&!f.quests.claimed.shop&&I.countItem(f.inv,'red_potion')===0);
// normalización de un guardado corrupto
var c=W();c.quests={done:{zone:'sí',falsa:true},claimed:{leader:true}};Q.normalize(c);
t('normaliza: solo booleanos y ids conocidos; reclamada implica hecha',!c.quests.done.zone&&!c.quests.done.falsa&&c.quests.done.leader&&c.quests.claimed.leader);
t('cada misión tiene regalo',Q.QUESTS.every(function(q){return q.reward&&(q.reward.mesos||q.reward.items);}));
t('cada misión tiene test o evento',Q.QUESTS.every(function(q){return q.test||q.event;}));
t('los ids de regalo existen',Q.QUESTS.every(function(q){return (q.reward.items||[]).every(function(i){return I.ITEMS[i[0]];});}));
console.log(ok?'TODO OK':'HAY FALLOS');
