import { NextResponse } from 'next/server'

export async function POST(req){
  try{
    const { code, clientId, clientSecret, redirectUri } = await req.json()
    if(!code || !clientId || !clientSecret || !redirectUri){
      return NextResponse.json({ error:'missing fields' }, { status:400 })
    }

    const params = new URLSearchParams()
    params.set('grant_type','authorization_code')
    params.set('code', code)
    params.set('redirect_uri', redirectUri)
    params.set('client_id', clientId)
    params.set('client_secret', clientSecret)

    const resp = await fetch('https://www.linkedin.com/oauth/v2/accessToken',{
      method:'POST',
      headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
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

