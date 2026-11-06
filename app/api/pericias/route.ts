import { NextRequest, NextResponse } from 'next/server';
export const runtime='nodejs';
async function proxy(req:NextRequest,method:'GET'|'POST') {
  const endpoint=process.env.HOSTGATOR_API_URL, token=process.env.HOSTGATOR_API_TOKEN;
  if(!endpoint||!token) return NextResponse.json({conectado:false,mensagem:'Integração HostGator não configurada no servidor.'},{status:503});
  try {
    const url=new URL(endpoint); if(method==='GET') url.search=req.nextUrl.search;
    const headers:Record<string,string>={'X-Serperito-Token':token,'Accept':'application/json'};
    let body:string|undefined;
    if(method==='POST'){headers['Content-Type']='application/json';body=await req.text();}
    const upstream=await fetch(url,{method,headers,body,cache:'no-store'});
    return new NextResponse(await upstream.text(),{status:upstream.status,headers:{'Content-Type':upstream.headers.get('content-type')||'application/json; charset=utf-8','Cache-Control':'no-store'}});
  } catch {return NextResponse.json({conectado:false,mensagem:'Não foi possível comunicar com o servidor de dados.'},{status:502});}
}
export async function GET(req:NextRequest){return proxy(req,'GET');}
export async function POST(req:NextRequest){return proxy(req,'POST');}
