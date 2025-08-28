import { NextResponse } from 'next/server'

// Exchanges OAuth2 code for token via server-side proxy to avoid CORS. Nothing is stored.
export async function POST(req){
  try{
    const { code, clientId, clientSecret, redirectUri, codeVerifier } = await req.json()
    if(!code || !clientId || !clientSecret || !redirectUri){
      return NextResponse.json({ error:'missing fields' }, { status:400 })
    }

    const params = new URLSearchParams()
    params.set('grant_type','authorization_code')
    params.set('code', code)
    params.set('redirect_uri', redirectUri)
    if(codeVerifier) params.set('code_verifier', codeVerifier)

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const resp = await fetch('https://api.twitter.com/2/oauth2/token',{
      method:'POST',
      headers:{ 'Content-Type':'application/x-www-form-urlencoded', 'Authorization': `Basic ${basic}` },
      body: params.toString()
    })
    const text = await resp.text()
    if(!resp.ok) return new Response(text||'token exchange failed', { status: resp.status })
    return new Response(text, { status: 200 })
  }catch(e){
    console.error(e)
    return NextResponse.json({ error:'server error' }, { status:500 })
  }
}

