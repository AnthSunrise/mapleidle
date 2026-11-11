globalThis.MAPDATA=require('../mapdata.js');
globalThis.MAPDATA_100020300=require('../mapdata_mushroom.js');
globalThis.MAPDATA_100040300=require('../mapdata_golem.js');
globalThis.MAPDATA_103020300=require('../mapdata_kerning.js');
globalThis.MAPDATA_103030200=require('../mapdata_swamp.js');
globalThis.MAPDATA_103010000=require('../mapdata_octopus.js');
require('../maps.js');
['exptable','itemdata','items','skills','buffs'].forEach(function(f){require('../'+f+'.js');});
var S=require('../sim.js'),SK=MapleSkills,I=MapleItems,M=SK.SKILLS.magicClaw,ok=true;
function t(n,c){console.log((c?'OK   ':'FALLA ')+n);if(!c)ok=false;}
function one(cls,lv){var w=S.createWorld(MAPDATA,{});w.chars=[];S.addCharacter(w,{name:'X',cls:cls,level:lv||1});S.selectChar(w,0);return w;}
t('Magic Claw: daño 73% (Lv1) y 130% (Lv20)',M.damage(1)===73&&M.damage(20)===130);
t('Magic Claw: MP 10 (Lv1..3), 12 (Lv4), 20 (Lv20)',M.mpCon(1)===10&&M.mpCon(3)===10&&M.mpCon(4)===12&&M.mpCon(20)===20);
t('Magic Claw: 2 golpes, 4 enemigos, 250 px, nivel máx. 20',M.attackCount===2&&M.mobCount===4&&M.range.x2===250&&M.maxLevel===20);
var w=one('mage');var c=w.chars[0];
t('empieza con Longcoat, botas y bastón Beginner',c.equip.top==='1052646'&&c.equip.shoes==='1072850'&&c.equip.weapon==='1382100');
var ids=['1002017','1002102','1002072','1050009','1050023','1050027','1072006','1072024','1072019','1082019','1082021','1382003','1382004'];
t('catálogo trae los 13 equipos nuevos del Mage',ids.every(function(i){return I.ITEMS[i]&&I.ITEMS[i].cls==='mage';}));
t('58+13+1+5 = 91 equipos',Object.keys(I.ITEMS).filter(function(k){return I.ITEMS[k].kind==='equip';}).length>=91);
// requisitos
var inv=I.newInventory(),eqp={};I.addItem(inv,'1382003',1);var r=I.equipItem(inv,eqp,14,0,'mage');t('Sapphire Staff pide nivel 15 ('+r.msg+')',!r.ok);
inv=I.newInventory();eqp={};I.addItem(inv,'1382003',1);r=I.equipItem(inv,eqp,15,0,'mage');t('Mage Lv15 equipa Sapphire Staff (INT base alcanza)',r.ok&&eqp.weapon==='1382003');
inv=I.newInventory();eqp={};I.addItem(inv,'1382003',1);r=I.equipItem(inv,eqp,40,0,'warrior');t('el Warrior no puede usar el bastón',!r.ok);
inv=I.newInventory();eqp={};I.addItem(inv,'1050009',1);r=I.equipItem(inv,eqp,13,0,'mage');t('el Mage equipa la túnica Blue Plain Robe en Lv13 (ocupa Top y Bottom)',r.ok&&eqp.top==='1050009');
// daño mágico
var a=I.calcStats(20,{weapon:'1382100'},'mage'),b=I.calcStats(20,{weapon:'1382004'},'mage');
t('el daño del Mage sale del ATT mágico (Old Wooden Staff MATT 35 > Beginner 27): '+a.max+' < '+b.max,b.max>a.max);
var s1=I.calcStats(1,I.startEquip('mage'),'mage');t('daño del Mage Lv1 razonable ('+s1.min+'-'+s1.max+') frente al Warrior ('+I.calcStats(1,I.startEquip('warrior'),'warrior').min+'-'+I.calcStats(1,I.startEquip('warrior'),'warrior').max+')',s1.max>=5&&s1.max<=30);
// ataque básico: misma cadencia y 1 solo golpe
var cfg=S.createWorld(MAPDATA,{}).cfg;t('config Mage: ataque normal melee con más alcance',cfg.classes.mage.hitRange>85&&!cfg.classes.mage.ranged);
function gapUnused(cls){var w=one(cls,20),c=w.chars[0],last=-1,was=false,gs=[];for(var i=0;i<60*120;i++){S.step(w,S.STEP);c.stats.hp=c.stats.maxHp;var a=!!c.player.atk&&!c.player.atk.skill;if(a&&!was){var tt=i/60;if(last>=0&&tt-last<3)gs.push(tt-last);last=tt;}was=a;}gs.sort(function(a,b){return a-b;});return gs[Math.floor(gs.length*0.1)];}
var at=cfg.attack;t('cadencia del ataque normal del Mage = la del Warrior (swingO1/2: '+at.swingO1.frames*at.swingO1.delay+' ms + 0.12 s)',at.swingO1.frames===3&&at.swingO1.delay===140&&at.swingO2.delay===140);
// Magic Claw en auto
var w=one('mage',30),c=w.chars[0];c.skills.magicClaw.level=20;
var used=0,was=false,maxHit=0;
for(var i=0;i<60*120;i++){S.step(w,S.STEP);c.stats.hp=c.stats.maxHp;c.stats.mp=c.stats.maxMp;var a=c.player.atk&&c.player.atk.skill;if(a&&!was)used++;was=!!a;
  var n=w.texts.filter(function(x){return x.t<0.02&&x.c==='#ffb347';}).length;if(n>maxHit)maxHit=n;}
t('la usa sola en auto ('+used+' veces)',used>5);
t('golpea varios números a la vez (máx '+maxHit+')',maxHit>=2&&maxHit<=8);
t('no falla por alcance ('+(c.missNear||0)+' fallos, '+(c.missGone||0)+' enemigos muertos/idos)',(c.missNear||0)<=Math.max(1,used*0.02));
var w2=one('mage',30),c2=w2.chars[0],u2=0,wa=false;for(var i=0;i<60*60;i++){S.step(w2,S.STEP);var a=c2.player.atk&&c2.player.atk.skill;if(a&&!wa)u2++;wa=!!a;}
t('sin aprenderla no la usa',u2===0);
['warrior','thief','archer'].forEach(function(cl){var w3=one(cl,30),c3=w3.chars[0];c3.skills.magicClaw.level=20;c3.stats.mp=c3.stats.maxMp=500;var u=0,wb=false;for(var i=0;i<60*30;i++){S.step(w3,S.STEP);var a=c3.player.atk&&c3.player.atk.skill;if(a&&a.id==='magicClaw'&&!wb)u++;wb=!!(a&&a.id==='magicClaw');}t(cl+' no puede usar Magic Claw',u===0);});
// balance
function kills(cls,lv,sk,lvl,map){var w=one(cls,lv);if(map)S.travel(w,w.chars[0],map);var c=w.chars[0];if(sk)c.skills[sk].level=lvl;
  for(var i=0;i<60*300;i++){S.step(w,S.STEP);c.stats.hp=c.stats.maxHp;if(sk)c.stats.mp=c.stats.maxMp;}return w.kills;}
console.log('Henesys Lv1 300 s: warrior',kills('warrior',1),'thief',kills('thief',1),'archer',kills('archer',1),'mage',kills('mage',1),'mage+MC1',kills('mage',1,'magicClaw',1));
console.log('Hongos Lv15 300 s: warrior',kills('warrior',15,0,0,'mushroom'),'thief',kills('thief',15,0,0,'mushroom'),'archer',kills('archer',15,0,0,'mushroom'),'mage',kills('mage',15,0,0,'mushroom'),'mage+MC10',kills('mage',15,'magicClaw',10,'mushroom'));
console.log(ok?'TODO OK':'HAY FALLOS');
