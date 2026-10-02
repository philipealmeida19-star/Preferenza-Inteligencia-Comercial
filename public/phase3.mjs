import {cnpj,norm,aggregate} from './engine.mjs';
export const SOURCE_FILE='Preferenza_Fase_3_Consolidacao_Geral_Fs.xlsx';
export const UF={'Espírito Santo':'ES','Rio de Janeiro':'RJ','São Paulo':'SP','Minas Gerais':'MG','Bahia':'BA','Pernambuco':'PE','Santa Catarina':'SC'};
export const FACTORS={28:32,393:160/3,394:30,395:40,396:30,397:30};
export const FORMATS={28:'F15',393:'F15',394:'F25',395:'F30',396:'F35',397:'F35'};
export const SEGMENTS=['Mesma base','Entrantes','Sem compra 2026','Somente ajustes'];
function id(v){const d=String(v??'').replace(/\D/g,'');if(d.length===14)return cnpj(d);if(d.length!==11||/^(\d)\1{10}$/.test(d))throw Error('Identidade fiscal inválida');for(let len=9;len<11;len++){let sum=0;for(let i=0;i<len;i++)sum+=Number(d[i])*(len+1-i);let digit=(sum*10)%11;if(digit===10)digit=0;if(+d[len]!==digit)throw Error('CPF inválido');}return d;}
export const fiscalDisplay=v=>v.length===11?'CPF • '+v.slice(0,3)+'.***.***-'+v.slice(-2):v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5');
const entityId=v=>String(v).startsWith('REDE_')?String(v):id(v);
const n=(v,label)=>{if(typeof v!=='number'||!Number.isFinite(v))throw Error(label+': valor numérico inválido');return v;};
function rows(X,wb,name){const ws=wb.Sheets[name];if(!ws)throw Error('Aba obrigatória ausente: '+name);const data=X.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});return data.slice(4).filter(r=>r.some(v=>v!==''));}
export const isPhase3=wb=>['Resumo','Clientes','Itens','Identidades','Metodo','Base','Ponte'].every(s=>wb.SheetNames.includes(s));
export function adaptPhase3(X,wb,filename=SOURCE_FILE){
 const b={schemaVersion:2,official:true,demo:false,source:filename,importedAt:null,sourceDate:'23/09/2026',sourceExtraction:'21/09/2026 14:46:08 (fuso não informado)',scope:'Somente pizzas Fs · jan–ago 2025 × 2026',coverage:[],clients:[],entities:[],sales:[],goals:[],people:[],sources:[],checks:[]};
 b.coverage=[2025,2026].flatMap(y=>Array.from({length:8},(_,i)=>`${y}-${String(i+1).padStart(2,'0')}`));
 const entities=new Map(),clientMap=new Map(),sourceRows=new Set();
 for(const r of rows(X,wb,'Clientes')){const e=entityId(r[0]);if(entities.has(e))throw Error('Entidade duplicada');if(!SEGMENTS.includes(r[4]))throw Error('Segmento desconhecido');const obj={id:e,name:String(r[1]),profile:String(r[2]),uf:UF[r[3]],segment:r[4],priority:String(r[17]),lastSale:String(r[20])};if(!obj.uf)throw Error('UF fiscal desconhecida: '+r[3]);entities.set(e,obj);b.entities.push(obj);}
 for(const r of rows(X,wb,'Identidades')){const key=id(r[1]),e=entities.get(entityId(r[0]));if(!e)throw Error('Identidade sem entidade');if(clientMap.has(key))throw Error('Identidade fiscal duplicada');const c={cnpj:key,identityType:key.length===11?'CPF':'CNPJ',name:String(r[2]),profile:e.profile,uf:e.uf,entity:e.id,entityName:e.name,segment:e.segment};clientMap.set(key,c);b.clients.push(c);}
 for(const r of rows(X,wb,'Itens')){const key=id(r[2]),c=clientMap.get(key),row=n(r[0],'Linha Excel'),code=n(r[6],'Código'),move=n(r[8],'Movimento'),boxes=n(r[9],'Caixas'),weight=n(r[10],'Peso'),up=n(r[11],'UP'),value=n(r[12],'Valor'),year=n(r[4],'Ano'),m=n(r[5],'Mês');
  if(sourceRows.has(row))throw Error('Linha de origem repetida: '+row);sourceRows.add(row);
  if(!c||c.entity!==entityId(r[1])||c.segment!==r[14])throw Error('Identidade/segmento divergente na linha '+row);
  if(!FACTORS[code]||![1,-1].includes(move)||![2025,2026].includes(year)||m<1||m>8)throw Error('Item fora do recorte Fs na linha '+row);
  if(Math.abs(boxes*FACTORS[code]-up)>1e-6||Math.sign(value)!==move||Math.sign(weight)!==move||Math.sign(up)!==move)throw Error('Sinal ou UP divergente na linha '+row);
  const date=String(r[3]);if(!date.startsWith(`${year}-${String(m).padStart(2,'0')}-`))throw Error('Competência inconsistente');
  b.sales.push({cnpj:key,month:`${year}-${String(m).padStart(2,'0')}`,date,group:'Pizza',format:FORMATS[code],code,type:move===1?'Venda':'Devolução',gross:move===1?value:0,returns:move===-1?-value:0,up,weight,quantity:null,boxes,document:String(r[13]),sourceRow:row});
 }
 if(wb.Sheets.Plano)for(const r of rows(X,wb,'Plano')){const e=entities.get(entityId(r[1]));if(e)e.plan={action:String(r[4]),owner:String(r[5]),support:String(r[6]),deadline:String(r[7]),indicator:String(r[8]),criterion:String(r[9]),status:String(r[10])};}
 const summary=X.utils.sheet_to_json(wb.Sheets.Resumo,{header:1,defval:''});const fields={'Peso líquido kg':'weight','UP líquidas':'up','Valor líquido R$':'revenue'};
 for(const r of summary){const field=fields[r[0]];if(!field)continue;for(const [i,y] of [[1,2025],[2,2026]]){const expected=n(r[i],'Resumo'),got=aggregate(b,{start:y+'-01',end:y+'-08'})[field];if(Math.abs(got-expected)>.005)throw Error(`Resumo ${field} ${y} não concilia: ${got} × ${expected}`);b.checks.push({field,year:y,expected,actual:got});}}
 if(b.checks.length!==6)throw Error('Resumo deve conter os seis totais de controle');
 return b;
}
