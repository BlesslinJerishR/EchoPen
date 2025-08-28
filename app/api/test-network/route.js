import { NextResponse } from 'next/server'
import axios from 'axios'
import https from 'https'

// Test different network configurations
export async function GET() {
  const results = {}
  
  try {
    // Test 1: Basic internet connectivity
    console.log('Testing basic internet connectivity...')
    const googleTest = await axios.get('https://www.google.com', { 
      timeout: 5000,
      validateStatus: () => true 
    })
    results.internet = {
      status: googleTest.status,
      success: googleTest.status === 200
    }
  } catch (error) {
    results.internet = {
      error: error.message,
      code: error.code,
      success: false
    }
  }

  try {
    // Test 2: LinkedIn API with default axios
    console.log('Testing LinkedIn API with default axios...')
    const linkedinDefault = await axios.get('https://api.linkedin.com/v2/ugcPosts', {
      headers: { 'X-Restli-Protocol-Version': '2.0.0' },
      timeout: 10000,
      validateStatus: () => true
    })
    results.linkedinDefault = {
      status: linkedinDefault.status,
      success: linkedinDefault.status === 401, // 401 means reachable but needs auth
      headers: Object.fromEntries(Object.entries(linkedinDefault.headers).slice(0, 5))
    }
  } catch (error) {
    results.linkedinDefault = {
      error: error.message,
      code: error.code,
      success: false
    }
  }

  try {
    // Test 3: LinkedIn API with custom HTTPS agent
    console.log('Testing LinkedIn API with custom HTTPS agent...')
    const customAxios = axios.create({
      timeout: 10000,
      httpsAgent: new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 30000,
        timeout: 10000,
        // Uncomment for development if SSL issues
        // rejectUnauthorized: false
      })
    })
    
    const linkedinCustom = await customAxios.get('https://api.linkedin.com/v2/ugcPosts', {
      headers: { 'X-Restli-Protocol-Version': '2.0.0' },
      validateStatus: () => true
    })
    results.linkedinCustom = {
      status: linkedinCustom.status,
      success: linkedinCustom.status === 401,
      headers: Object.fromEntries(Object.entries(linkedinCustom.headers).slice(0, 5))
    }
  } catch (error) {
    results.linkedinCustom = {
      error: error.message,
      code: error.code,
      success: false
    }
  }

  // Test 4: DNS resolution
  try {
    console.log('Testing DNS resolution...')
    const dns = require('dns').promises
    const addresses = await dns.resolve4('api.linkedin.com')
    results.dns = {
      success: true,
      addresses: addresses.slice(0, 3) // First 3 IPs
    }
  } catch (error) {
    results.dns = {
      error: error.message,
      success: false
    }
  }

  // Summary
  const summary = {
    internetWorking: results.internet?.success || false,
    linkedinReachable: results.linkedinDefault?.success || results.linkedinCustom?.success || false,
    dnsWorking: results.dns?.success || false,
    recommendation: ''
  }

  if (!summary.internetWorking) {
    summary.recommendation = 'No internet connectivity detected. Check your network connection.'
  } else if (!summary.dnsWorking) {
    summary.recommendation = 'DNS resolution failed. Try using different DNS servers (8.8.8.8, 1.1.1.1).'
  } else if (!summary.linkedinReachable) {
    summary.recommendation = 'LinkedIn API is not reachable. This could be due to firewall, proxy, or LinkedIn being down.'
  } else {
    summary.recommendation = 'Network connectivity looks good. The issue might be with authentication or request format.'
  }

  return NextResponse.json({
    summary,
    details: results,
    timestamp: new Date().toISOString()
  })
}
