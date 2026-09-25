export type ImportedDocument = {id:string;title:string;filename:string;mimeType:string;status:string;documentType:string;matterId?:string;matterName?:string;text:string};

async function readPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  // @ts-ignore worker URL supported by pdfjs-dist in browser builds
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({data:bytes}).promise;
  let out='';
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i); const content=await page.getTextContent();
    out += `\n\n[Page ${i}]\n` + content.items.map((item:any)=>item.str||'').join(' ');
  }
  return out.trim();
}

async function readDocx(file: File): Promise<string> {
  // @ts-ignore mammoth ships browser support without complete TS declarations\n  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
  return result.value;
}

export async function ingestFile(file: File, index:number): Promise<ImportedDocument> {
  const ext=file.name.toLowerCase().split('.').pop();
  if(file.size>12*1024*1024) throw new Error(`${file.name}: file exceeds 12 MB prototype limit`);
  let text='';
  if(ext==='txt'||ext==='md') text=await file.text();
  else if(ext==='pdf') text=await readPdf(file);
  else if(ext==='docx') text=await readDocx(file);
  else throw new Error(`${file.name}: unsupported file type`);
  if(text.trim().length<20) throw new Error(`${file.name}: very little readable text was extracted`);
  return {id:`upload-${Date.now()}-${index}`,title:file.name.replace(/\.[^.]+$/,''),filename:file.name,mimeType:file.type||`application/${ext}`,status:'UNKNOWN',documentType:'OTHER',text};
}
