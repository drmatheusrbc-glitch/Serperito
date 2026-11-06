import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const expected=process.env.SERPERITO_LOGIN_PASSWORD, secret=process.env.SERPERITO_SESSION_SECRET;
  if (!expected || !secret) return NextResponse.json({error:'Login não configurado no servidor.'},{status:503});
  const body=await req.json().catch(()=>null), supplied=typeof body?.password==='string'?body.password:'';
  const a=Buffer.from(supplied), b=Buffer.from(expected);
  if(a.length!==b.length || !timingSafeEqual(a,b)) return NextResponse.json({error:'Senha incorreta.'},{status:401});
  const payload=Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+43200})).toString('base64url');
  const sig=createHmac('sha256',secret).update(payload).digest('base64url');
  const res=NextResponse.json({ok:true});
  res.cookies.set('serperito_session',payload+'.'+sig,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:43200});
  return res;
}
