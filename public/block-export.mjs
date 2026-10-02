import html2canvas from './vendor/html2canvas.mjs';

// A one-page, lossless visual PDF of the selected block, with no network services.
export async function canvasPDF(canvas,scale=2){
 const ctx=canvas.getContext('2d'),rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 const rgb=new Uint8Array(canvas.width*canvas.height*3);for(let i=0,j=0;i<rgba.length;i+=4){rgb[j++]=rgba[i];rgb[j++]=rgba[i+1];rgb[j++]=rgba[i+2];}
 let bytes,filter;
 if(typeof CompressionStream!=='undefined'){bytes=new Uint8Array(await new Response(new Blob([rgb]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());filter='FlateDecode';}
 else{const encoded=canvas.toDataURL('image/jpeg',.98).split(',')[1];bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));filter='DCTDecode';}
 const w=+(canvas.width/scale*.75).toFixed(2),h=+(canvas.height/scale*.75).toFixed(2),enc=new TextEncoder(),chunks=[],offsets=[0];let size=0;
 const add=value=>{const b=typeof value==='string'?enc.encode(value):value;chunks.push(b);size+=b.length;};
 const object=(id,start,stream)=>{offsets[id]=size;add(`${id} 0 obj\n${start}`);if(stream){add('\nstream\n');add(stream);add('\nendstream');}add('\nendobj\n');};
 add('%PDF-1.4\n% Preferenza block export\n');
 object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 object(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
 object(4,`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /${filter} /Length ${bytes.length} >>`,bytes);
 const content=enc.encode(`q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ`);object(5,`<< /Length ${content.length} >>`,content);
 const xref=size;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);return new Blob(chunks,{type:'application/pdf'});
}
export async function captureBlock(element,context){
 if(!element)throw Error('Bloco não encontrado.');
 const stage=document.createElement('div');stage.className='export-capture';stage.setAttribute('aria-hidden','true');
 stage.style.cssText='position:absolute;left:-20000px;top:0;width:1280px;padding:20px;background:#12231C;color:#F8F5E8;pointer-events:none;';
 const copy=element.cloneNode(true);copy.querySelectorAll('[data-no-export]').forEach(n=>n.remove());
 const originalInputs=element.querySelectorAll('input,select'),copiedInputs=copy.querySelectorAll('input,select');copiedInputs.forEach((n,i)=>{n.value=originalInputs[i]?.value||'';if(n.tagName==='INPUT')n.setAttribute('value',n.value);});
 stage.append(copy);const footer=document.createElement('div');footer.className='export-context';footer.textContent=context;stage.append(footer);document.body.append(stage);
 try{await document.fonts.ready;return await html2canvas(stage,{scale:2,backgroundColor:'#12231C',windowWidth:1500,windowHeight:1100,scrollX:0,scrollY:0,logging:false,useCORS:false,allowTaint:false,imageTimeout:10000,onclone:doc=>{doc.querySelectorAll('.export-capture [data-no-export]').forEach(n=>n.remove());}});}finally{stage.remove();}
}
export async function exportBlock(element,type,context){const canvas=await captureBlock(element,context);if(type==='pdf')return canvasPDF(canvas);if(type!=='png')throw Error('Formato inválido.');return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Não foi possível gerar a imagem.')),'image/png'));}
