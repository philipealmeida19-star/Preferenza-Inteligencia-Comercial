export const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[_\s-]+/g,' ');
export function cnpj(v) {
 const s=String(v??'').trim();
 if(!s || /[a-z]/i.test(s)) throw Error('CNPJ ausente ou inválido');
 const d=s.replace(/\D/g,'').padStart(14,'0');
 if(d.length!==14 || /^(\d)\1{13}$/.test(d)) throw Error('CNPJ deve ter 14 dígitos válidos');
 for(let len=12;len<=13;len++){let sum=0,w=len-7;for(let i=0;i<len;i++){sum+=Number(d[i])*w--;if(w<2)w=9;}const r=sum%11, check=r<2?0:11-r;if(Number(d[len])!==check)throw Error('Dígitos verificadores do CNPJ inválidos');}
 return d;
}
export function number(v, optional=false) {
 if(v===null||v===undefined||String(v).trim()===''){if(optional)return null;throw Error('Valor numérico ausente');}
 let s=String(v).replace(/R\$|\s|kg/gi,'');
 if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
 if(!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(s))throw Error('Número inválido: '+v);
 const n=Number(s);if(!Number.isFinite(n))throw Error('Número inválido');return n;
}
export function month(v) {
 if(v instanceof Date && !isNaN(v)) return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}`;
 if(typeof v==='number'){if(v<1||v>200000)throw Error('Data Excel inválida');const d=new Date(Date.UTC(1899,11,30)+Math.round(v)*86400000);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;}
 const s=String(v??'').trim();let m;
 if((m=s.match(/^(\d{4})-(\d{2})(?:-(\d{2})(?:T.*)?)?$/))){if(+m[2]<1||+m[2]>12||(m[3]&&(+m[3]<1||+m[3]>new Date(+m[1],+m[2],0).getDate())))throw Error('Data inválida');return m[1]+'-'+m[2];}
 if((m=s.match(/^(?:(\d{1,2})\/)?(\d{1,2})\/(\d{4})$/))){if(+m[2]<1||+m[2]>12||(m[1]&&(+m[1]<1||+m[1]>new Date(+m[3],+m[2],0).getDate())))throw Error('Data inválida');return m[3]+'-'+m[2].padStart(2,'0');}
 throw Error('Data inválida; use data Excel, AAAA-MM ou DD/MM/AAAA');
}
export const profileName=v=>{
 const s=String(v??'').trim();const aliases={'CARONE':'CARONE - ESPIRITO SANTO','CARREFOUR':'CARREFOUR - SÃO PAULO','CASAGRANDE':'CASAGRANDE ES','GRUPO BH':'GRUPO BH - ES',"SAM’S":"SAM’S - ESPIRITO SANTO","SAM'S":"SAM’S - ESPIRITO SANTO"};return aliases[norm(s)]||s;
};
const group=v=>{const s=norm(v);if(['PIZZA','PIZZAS','MASSA PIZZA','MASSA PARA PIZZA'].includes(s))return 'Pizza';if(['PASTEL','PASTEIS','PASTEL PREFERENZA','GRUPO PASTEL'].includes(s))return 'Pastel';throw Error('Grupo deve ser Pizza ou Pastel');};
export const SCHEMA={
 clients:{label:'Cadastro de clientes',fields:{cnpj:['CNPJ',true,['CNPJ CLIENTE','CNPJ DESTINATARIO','CPF CNPJ','CNPJ/CPF']],name:['Cliente',true,['CLIENTE','NOME DESTINATARIO','RAZAO SOCIAL','NOME']],profile:['Perfil',true,['PERFIL','PERFIL CLIENTE']],uf:['UF',true,['UF','ESTADO','UF DESTINATARIO']]}},
 sales:{label:'Vendas',fields:{date:['Data / mês',true,['DATA','DATA VENDA','DATA EMISSAO','MES','PERIODO','DT NEG']],cnpj:['CNPJ',true,['CNPJ CLIENTE','CNPJ DESTINATARIO','CPF CNPJ','CNPJ/CPF']],type:['Tipo de movimento',false,['TIPO','OPERACAO','TIPO MOVIMENTO']],group:['Grupo',true,['GRUPO','GRUPO PRODUTO','CATEGORIA']],format:['Formato da pizza',false,['FORMATO','TAMANHO']],quantity:['Unidades líquidas',false,['QUANTIDADE','QTD','UNIDADES','QTD LIQUIDA']],gross:['Venda bruta (R$)',true,['VALOR BRUTO','VENDA BRUTA','BRUTA','VALOR','VALOR TOTAL']],returns:['Devolução (R$)',false,['DEVOLUCAO','VALOR DEVOLUCAO','DEVOLUCOES']],weight:['Peso líquido (kg)',true,['PESO','PESO LIQUIDO','PESO KG','KG']],up:['UP líquida',false,['UP','UNID PADRAO','UNIDADE PADRAO','UNIDADES PADRAO']]}},
 goals:{label:'Metas',fields:{date:['Mês',true,['DATA','MES','PERIODO']],cnpj:['CNPJ',true,['CNPJ CLIENTE']],group:['Grupo',true,['GRUPO','CATEGORIA']],revenue:['Meta de venda (R$)',true,['META VENDA','META VALOR','PREVISTO','META FATURAMENTO']],up:['Meta de UP',false,['META UP','UP PREVISTA']],weight:['Meta de peso (kg)',false,['META PESO','PESO PREVISTO']]}},
 people:{label:'Pessoas efetivas',fields:{date:['Mês',true,['DATA','MES','PERIODO']],cnpj:['CNPJ',true,['CNPJ CLIENTE']],people:['Pessoas efetivas',true,['PESSOAS','PESSOAS EFETIVAS','EFETIVO','TOTAL PESSOAS']]}}
};
export function autoMapping(headers,role){const r={};for(const [key,[label,required,aliases]] of Object.entries(SCHEMA[role].fields)){r[key]=headers.findIndex(h=>[key,label,...aliases].some(a=>norm(a)===norm(h)));}return r;}
export function inferRole(name){const s=norm(name);if(/CLIENT|PARCEIR|CADASTRO/.test(s))return 'clients';if(/META|PREVIST/.test(s))return 'goals';if(/PESSOA|EFETIVO|ROTEIR/.test(s))return 'people';if(/VENDA|FATUR|MOVIMENTO/.test(s))return 'sales';return 'ignore';}
export function compileImport(sheets,filename='Planilha',current=null) {
 const base=current?{...structuredClone(current),importedAt:new Date().toISOString()}:{clients:[],sales:[],goals:[],people:[],source:filename,demo:false,importedAt:new Date().toISOString()},errors=[],warnings=[];
 if(current&&sheets.some(s=>s.role==='goals')){delete base.goalPlan;base.sources=base.sources?.filter(s=>s.kind!=='goals2026');}
 if(current){for(const role of ['goals','people'])if(sheets.some(s=>s.role===role))base[role]=[];base.sources=[...(base.sources||[]),{name:filename,role:'Complemento importado localmente: metas/pessoas'}];}
 const staged={clients:[],sales:[],goals:[],people:[]};
 for(const sheet of sheets){if(sheet.role==='ignore')continue;const fields=SCHEMA[sheet.role]?.fields;if(!fields){errors.push(`Aba ${sheet.name}: tipo desconhecido.`);continue;}
 for(const [k,[label,required]] of Object.entries(fields))if(required&&!(sheet.map[k]>=0))errors.push(`Aba ${sheet.name}: associe a coluna ${label}.`);
 const selected=Object.values(sheet.map).filter(x=>x>=0);if(new Set(selected).size!==selected.length)errors.push(`Aba ${sheet.name}: uma coluna foi associada a mais de um campo.`);
 for(let i=0;i<sheet.rows.length;i++){const row=sheet.rows[i];if(!row.some(x=>x!==''&&x!==null&&x!==undefined))continue;const r={_loc:`${sheet.name}, linha ${i+(sheet.headerIndex||0)+2}`};for(const k of Object.keys(fields))r[k]=sheet.map[k]>=0?row[sheet.map[k]]:undefined;staged[sheet.role].push(r);}
 }
 if(!current&&!staged.clients.length)errors.push('Associe uma aba com o cadastro de clientes.');if(!current&&!staged.sales.length)errors.push('Associe pelo menos uma aba de vendas.');
 if(errors.length)return {base,errors,warnings};
 const clients=new Map(current?current.clients.map(c=>[c.cnpj,c]):[]);const seen={goals:new Set(),people:new Set()}, movements=new Set();let ignored=0;
 for(const r of staged.clients){try{const id=cnpj(r.cnpj);if(clients.has(id))throw Error('CNPJ duplicado no cadastro');if(!String(r.name??'').trim()||!String(r.profile??'').trim())throw Error('Cliente e perfil são obrigatórios');const uf=norm(r.uf);if(!['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].includes(uf))throw Error('UF inválida');const c={cnpj:id,name:String(r.name).trim(),profile:profileName(r.profile),uf};clients.set(id,c);base.clients.push(c);}catch(e){errors.push(`${r._loc}: ${e.message}`);}}
 for(const role of ['sales','goals','people'])for(const r of staged[role]){try{
 const id=cnpj(r.cnpj);if(!clients.has(id))throw Error('CNPJ sem correspondência no cadastro');const m=month(r.date);const o={cnpj:id,month:m};
 if(role==='sales'){
 const t=norm(r.type||'VENDA');const exclude=['BONIFICACAO','BONIFICACAO/TROCA/REMESSA','TROCA','REMESSA'];if(exclude.includes(t)){ignored++;continue;}
 if(!['VENDA','DEVOLUCAO','DEVOLUCOES'].includes(t))throw Error('Tipo desconhecido: use Venda, Devolução, Bonificação, Troca ou Remessa');
 const g=group(r.group);const ret=t!=='VENDA';const gross=number(r.gross),dv=number(r.returns,true)??0;if(gross<0||dv<0)throw Error('Valores monetários devem ser positivos; sinal definido pelo tipo');if(ret&&dv!==0)throw Error('Na linha Devolução, preencha o valor em Venda bruta e deixe Devolução vazia ou zero');
 const weight=number(r.weight),rawUP=number(r.up,true),qty=number(r.quantity,true);let up=0;
 if(g==='Pizza'){if(rawUP!==null)up=rawUP;else{const f=norm(r.format).replace(/\s/g,'');if(!['F15','F25','F30','F35'].includes(f)||qty===null)throw Error('Pizza exige UP ou quantidade e formato F15/F25/F30/F35');up=qty/(f==='F15'?3:1);}}
 Object.assign(o,{group:g,format:String(r.format??''),type:ret?'Devolução':'Venda',gross:ret?0:gross,returns:ret?gross:dv,weight:ret?-Math.abs(weight):weight,up:ret?-Math.abs(up):up,quantity:qty===null?null:ret?-Math.abs(qty):qty});
 const fp=JSON.stringify(o);if(movements.has(fp))warnings.push(`${r._loc}: movimento idêntico a outro; foi mantido. Confira duplicidades.`);movements.add(fp);
 }else if(role==='goals'){
 Object.assign(o,{group:group(r.group),revenue:number(r.revenue),up:number(r.up,true),weight:number(r.weight,true)});
 if([o.revenue,o.up,o.weight].some(x=>x!==null&&x<0))throw Error('Metas não podem ser negativas');if(o.group==='Pastel'&&o.up>0)throw Error('Pastel não compõe UP');
 }else{o.people=number(r.people);if(o.people<0)throw Error('Pessoas não podem ser negativas');}
 if(role!=='sales'){const key=id+'|'+m+(role==='goals'?'|'+o.group:'');if(seen[role].has(key))throw Error('Chave duplicada: CNPJ / mês'+(role==='goals'?' / grupo':''));seen[role].add(key);}
 base[role].push(o);
 }catch(e){errors.push(`${r._loc}: ${e.message}`);}}
 if(ignored)warnings.push(`${ignored} movimento(s) de bonificação, troca ou remessa excluído(s) dos indicadores.`);
 if(!base.goals.length)warnings.push('Sem metas: previsto e atingimento ficarão indisponíveis.');if(!base.people.length)warnings.push('Sem pessoas: produtividade ficará indisponível.');
 if(staged.sales.some(r=>r.type===undefined))warnings.push('Movimentos sem coluna Tipo foram tratados como Venda.');
 if(current&&sheets.some(s=>s.role==='goals')){const keep=new Set([...base.goals,...base.people].map(r=>r.cnpj));base.clients=base.clients.filter(c=>!c.goalOnly||keep.has(c.cnpj));}
 if(!base.sales.length)errors.push('Nenhuma venda ou devolução válida para importar.');
 return {base,errors,warnings};
}
export function monthsBetween(start,end){const result=[];if(!start||!end||start>end)return result;let [y,m]=start.split('-').map(Number);for(let i=0;i<1200;i++){const s=`${y}-${String(m).padStart(2,'0')}`;if(s>end)break;result.push(s);if(++m>12){m=1;y++;}}return result;}
export function filterBase(base,f={}){
 const clients=base.clients.filter(c=>(!f.profile||f.profile==='all'||c.profile===f.profile)&&(!f.uf||f.uf==='all'||c.uf===f.uf)&&(!f.cnpj||c.cnpj===f.cnpj)&&(!f.entity||(c.entity||c.cnpj)===f.entity)&&(!f.segment||f.segment==='all'||c.segment===f.segment));const ids=new Set(clients.map(c=>c.cnpj));
 const selected=r=>ids.has(r.cnpj)&&(!f.start||r.month>=f.start)&&(!f.end||r.month<=f.end);
 const grouped=r=>selected(r)&&(!f.group||f.group==='all'||r.group===f.group);const selectedSales=r=>grouped(r)&&(!f.format||f.format==='all'||r.format===f.format);
 return {...base,clients,sales:base.sales.filter(selectedSales),goals:f.format&&f.format!=='all'?[]:base.goals.filter(grouped),people:f.group==='Pastel'||(f.format&&f.format!=='all')?[]:base.people.filter(selected)};
}
const sum=(xs,k)=>xs.reduce((a,r)=>a+(r[k]??0),0);
export function aggregate(base,f={}){
 const b=filterBase(base,f),gross=sum(b.sales,'gross'),returns=sum(b.sales,'returns'),revenue=gross-returns,up=sum(b.sales,'up'),weight=sum(b.sales,'weight'),people=sum(b.people,'people');
 const goalKeys=new Set(b.goals.map(r=>r.cnpj+'|'+r.month+'|'+r.group));const missingGoals=new Set(b.sales.filter(r=>!goalKeys.has(r.cnpj+'|'+r.month+'|'+r.group)).map(r=>r.cnpj+'|'+r.month+'|'+r.group));
 const actualCovered=!base.coverage||monthsBetween(f.start,f.end).every(m=>base.coverage.includes(m));const hasGoals=b.goals.length>0,goalReview=b.goals.some(r=>r.duplicate||r.unmatched),goalComplete=hasGoals&&missingGoals.size===0&&!goalReview&&actualCovered;
 const target=hasGoals?sum(b.goals,'revenue'):null;const targetUP=b.goals.some(r=>r.up!==null)?sum(b.goals,'up'):null,targetWeight=b.goals.some(r=>r.weight!==null)?sum(b.goals,'weight'):null;
 const pkeys=new Set(b.people.map(r=>r.cnpj+'|'+r.month)),pizza=b.sales.filter(r=>r.group==='Pizza');const missingPeople=new Set(pizza.filter(r=>!pkeys.has(r.cnpj+'|'+r.month)).map(r=>r.cnpj+'|'+r.month));
 const productivity=f.group!=='Pastel'&&people>0&&missingPeople.size===0?up/people:null;
 const result={actualCovered,goalReview,missingGoalUP:b.goals.filter(r=>r.up===null).length,missingGoalWeight:b.goals.filter(r=>r.weight===null).length,gross,returns,revenue,up,weight,people,productivity,target,targetUP,targetWeight,attainment:goalComplete&&target>0?100*revenue/target:null,gap:goalComplete&&target!==null?revenue-target:null,missingGoals:missingGoals.size,missingPeople:missingPeople.size,goalComplete,rows:b.sales.length,activeClients:new Set(b.sales.filter(r=>r.gross>0).map(r=>r.cnpj)).size,activeEntities:new Set(b.sales.filter(r=>r.gross>0).map(r=>b.clients.find(c=>c.cnpj===r.cnpj)?.entity||r.cnpj)).size,documents:new Set(b.sales.filter(r=>r.gross>0&&r.document).map(r=>r.document)).size};for(const key of Object.keys(result))if(typeof result[key]==='number'&&Math.abs(result[key])<1e-8)result[key]=0;return result;
}
export function byProfile(base,f){return [...new Set(filterBase(base,f).clients.map(c=>c.profile))].map(profile=>({profile,...aggregate(base,{...f,profile})})).filter(r=>r.rows||r.target!==null||r.people).sort((a,b)=>b.revenue-a.revenue);}

export function previousFilters(f,year){return {...f,start:year+'-'+f.start.slice(5),end:year+'-'+f.end.slice(5)};}
export function hasComparison(base,f,year){if(!year||String(year)===f.start.slice(0,4)||f.start.slice(0,4)!==f.end.slice(0,4))return false;const p=previousFilters(f,year),available=new Set(base.coverage||base.sales.map(r=>r.month));return monthsBetween(p.start,p.end).every(m=>available.has(m));}
export function growth(actual,previous){return previous>1e-8?(actual-previous)/previous*100:null;}
export function ranking(base,f,previous,view='profile'){
 const key=view==='profile'?'profile':'entity';const cs=filterBase(base,f).clients;const candidates=new Map();for(const c of cs){const id=key==='profile'?c.profile:(c.entity||c.cnpj);if(!candidates.has(id))candidates.set(id,{id,name:key==='profile'?c.profile:(c.entityName||c.name),profile:c.profile,segment:c.segment,uf:c.uf});}
 return [...candidates.values()].map(r=>{const ff={...f,[key]:r.id},a=aggregate(base,ff),p=previous?aggregate(base,{...previous,[key]:r.id}):null;return {...r,...a,previous:p,growth:p&&a.actualCovered?growth(a.revenue,p.revenue):null};}).filter(r=>r.rows||r.previous?.rows||r.target!==null||r.people).sort((a,b)=>b.revenue-a.revenue);
}
