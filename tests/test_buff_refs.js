// Todo buff que usa una skill (o applyBuff) debe existir en buffs.js; si no, la skill se lanza en bucle sin aplicar nada
var vm=require('vm'),fs=require('fs'),path=require('path'),ok=true,d=path.join(__dirname,'..');
var w={};w.window=w;vm.createContext(w);['itemdata.js','items.js','jobs.js','buffs.js','skills.js'].forEach(function(f){vm.runInContext(fs.readFileSync(path.join(d,f),'utf8'),w);});
var B=w.MapleBuffs.BUFFS,S=w.MapleSkills.SKILLS,miss=[];
Object.keys(S).forEach(function(k){if(S[k].buff&&!B[S[k].buff])miss.push(k+'->'+S[k].buff);});
var sim=fs.readFileSync(path.join(d,'sim.js'),'utf8'),re=/applyBuff\(w, [^,]+, '(\w+)'/g,m;while((m=re.exec(sim)))if(!B[m[1]])miss.push('sim->'+m[1]);
console.log((miss.length?'FALLA ':'OK   ')+'buffs referenciados existen'+(miss.length?': '+miss.join(', '):''));if(miss.length)ok=false;
console.log(ok?'TODO OK':'HAY FALLOS');process.exit(ok?0:1);
