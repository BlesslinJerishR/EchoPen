import { NextResponse } from 'next/server'
import axios from 'axios'
import https from 'https'

// Test LinkedIn image upload flow specifically
export async function POST(req) {
  try {
    const form = await req.formData()
    const token = form.get('token')?.toString()
    const author = form.get('author')?.toString()
    
    if (!token || !author) {
      return NextResponse.json({ error: 'Missing token or author' }, { status: 400 })
    }

    // Get the first image file
    let imageFile = null
    for (const [key, val] of form.entries()) {
      if (val instanceof File && (key === 'images' || key.startsWith('image'))) {
        imageFile = val
        break
      }
    }

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file found' }, { status: 400 })
    }

    console.log(`Testing image upload: ${imageFile.name}, ${imageFile.size} bytes, ${imageFile.type}`)

    // Create axios instance
    const linkedInAxios = axios.create({
      timeout: 30000,
      httpsAgent: new https.Agent({
        keepAlive: true,
        timeout: 30000,
      }),
      headers: {
        'User-Agent': 'Echo-Pen/1.0 (Node.js)',
      }
    })

    const ownerUrn = `urn:li:person:${author}`
    const results = {}

    // Step 1: Register upload
    console.log('Step 1: Registering image upload...')
    const registerResponse = await linkedInAxios({
      method: 'POST',
      url: 'https://api.linkedin.com/v2/assets?action=registerUpload',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
      data: {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: ownerUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }
          ]
        }
      },
      validateStatus: () => true
    })

    results.registration = {
      status: registerResponse.status,
      success: registerResponse.status >= 200 && registerResponse.status < 300,
      data: registerResponse.data
    }

    if (!results.registration.success) {
      return NextResponse.json({
        error: 'Registration failed',
        results
      }, { status: registerResponse.status })
    }

    const registerData = registerResponse.data
    const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl
    const assetUrn = registerData.value?.asset

    results.uploadUrl = uploadUrl
    results.assetUrn = assetUrn

    if (!uploadUrl || !assetUrn) {
      return NextResponse.json({
        error: 'Missing upload URL or asset URN',
        results
      }, { status: 502 })
    }

    // Step 2: Upload binary
    console.log('Step 2: Uploading image binary...')
    const fileBuffer = Buffer.from(await imageFile.arrayBuffer())
    
    const uploadResponse = await linkedInAxios({
      method: 'PUT',
      url: uploadUrl,
      headers: {
        'Content-Type': imageFile.type || 'application/octet-stream',
      },
      data: fileBuffer,
      validateStatus: () => true,
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    })

    results.upload = {
      status: uploadResponse.status,
      success: uploadResponse.status >= 200 && uploadResponse.status < 300,
      headers: uploadResponse.headers
    }

    return NextResponse.json({
      success: results.upload.success,
      message: results.upload.success ? 'Image upload test successful' : 'Image upload test failed',
      results
    }, { status: results.upload.success ? 200 : uploadResponse.status })

  } catch (error) {
    console.error('Image upload test error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error.message
    }, { status: 500 })
  }
}
