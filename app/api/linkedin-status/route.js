import { NextResponse } from 'next/server'

// Quick LinkedIn API health check
export async function GET() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    const start = Date.now()
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'GET',
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    const responseTime = Date.now() - start
    
    let status = 'healthy'
    if (responseTime > 10000) status = 'slow'
    if (responseTime > 20000) status = 'very_slow'
    
    return NextResponse.json({
      status,
      responseTime,
      httpStatus: response.status,
      message: response.status === 401 ? 'API reachable (auth required)' : 'API reachable'
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'unavailable',
      error: error.message,
      code: error.code,
      suggestion: error.name === 'AbortError' ? 
        'LinkedIn API is very slow or down' : 
        'Network connectivity issue'
    }, { status: 503 })
  }
}
