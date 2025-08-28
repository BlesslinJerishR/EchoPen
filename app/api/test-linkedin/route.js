import { NextResponse } from 'next/server'

// Simple connectivity test for LinkedIn API
export async function GET() {
  try {
    console.log('Testing LinkedIn API connectivity...')
    
    // Test basic connectivity to LinkedIn API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    // First test general internet connectivity
    const googleTest = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal
    }).catch(e => ({ error: e.message }))

    if (googleTest.error) {
      return NextResponse.json({
        status: 'error',
        message: 'No internet connectivity detected',
        suggestion: 'Check your internet connection'
      }, { status: 503 })
    }

    // Then test LinkedIn UGC API specifically
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'GET',
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    
    return NextResponse.json({
      status: 'success',
      message: 'LinkedIn API is reachable',
      httpStatus: response.status,
      headers: Object.fromEntries(response.headers.entries())
    })
    
  } catch (error) {
    console.error('LinkedIn connectivity test failed:', error)
    
    let errorType = 'unknown'
    let suggestion = 'Check your internet connection'
    
    if (error.name === 'AbortError') {
      errorType = 'timeout'
      suggestion = 'Request timed out - check your internet connection or try again later'
    } else if (error.code === 'ETIMEDOUT' || error.cause?.code === 'ETIMEDOUT') {
      errorType = 'network_timeout'
      suggestion = 'Network timeout - check firewall/proxy settings or try again later'
    } else if (error.code === 'ENOTFOUND') {
      errorType = 'dns_error'
      suggestion = 'DNS resolution failed - check your DNS settings'
    } else if (error.code === 'ECONNRESET') {
      errorType = 'connection_reset'
      suggestion = 'Connection was reset - possible firewall or proxy interference'
    }
    
    return NextResponse.json({
      status: 'error',
      errorType,
      message: error.message,
      suggestion,
      code: error.code,
      cause: error.cause?.code
    }, { status: 503 })
  }
}
