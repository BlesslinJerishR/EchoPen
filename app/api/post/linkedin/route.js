export const runtime = "nodejs"
import { NextResponse } from 'next/server'
import axios from 'axios'
import https from 'https'

// Create axios instance with custom configuration for better network handling
const linkedInAxios = axios.create({
  timeout: 30000, // Reduced timeout for faster failure detection
  httpsAgent: new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 10,
    maxFreeSockets: 5,
    timeout: 30000,
    // Uncomment these for development if you have SSL/firewall issues
    // rejectUnauthorized: false,
    // secureProtocol: 'TLSv1_2_method'
  }),
  headers: {
    'User-Agent': 'Echo-Pen/1.0 (Node.js)',
    'Connection': 'keep-alive',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  },
  // Add proxy support if needed
  ...(process.env.HTTP_PROXY && {
    proxy: {
      protocol: 'http',
      host: new URL(process.env.HTTP_PROXY).hostname,
      port: new URL(process.env.HTTP_PROXY).port,
    }
  })
})

// LinkedIn Share on LinkedIn implementation using UGC Posts API
// Based on: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
// Supports text-only posts and image posts
export async function POST(req) {
  try {
    // Pre-flight connectivity check
    const isConnected = await testLinkedInConnectivity()
    if (!isConnected) {
      return NextResponse.json({
        error: 'Unable to reach LinkedIn API. Please check your internet connection or try again later.',
        suggestion: 'This might be a network firewall, DNS, or LinkedIn API availability issue.'
      }, { status: 503 })
    }

    const ctype = req.headers.get('content-type') || ''

    if (ctype.includes('multipart/form-data')) {
      // Handle multi-image posts
      const form = await req.formData()
      const content = form.get('content')?.toString() || ''
      const author = form.get('author')?.toString() || ''
      const token = form.get('token')?.toString() || ''

      if (!content || !author || !token) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Collect image files
      const files = []
      for (const [key, val] of form.entries()) {
        if (val instanceof File && (key === 'images' || key.startsWith('image'))) {
          files.push(val)
        }
      }

      if (files.length === 0) {
        // No images, create text-only post
        return createTextPost({ content, author, token })
      }

      // Upload images using LinkedIn Assets API and create image share
      const ownerUrn = `urn:li:person:${author}`
      const mediaAssets = []

      for (const file of files) {
        try {
          console.log(`Processing image: ${file.name}, size: ${file.size}, type: ${file.type}`)

          // Step 1: Register image upload using Assets API
          let registerResponse
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              console.log(`Registering image upload attempt ${attempt}`)
              registerResponse = await linkedInAxios({
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
                timeout: 45000,
                validateStatus: () => true
              })

              break // Success, exit retry loop

            } catch (retryError) {
              if (attempt === 2 || retryError.name === 'AbortError') {
                throw retryError // Final attempt or non-retryable error
              }
              console.log(`Image register attempt ${attempt} failed, retrying...`)
              await new Promise(resolve => setTimeout(resolve, 2000))
            }
          }

          if (registerResponse.status < 200 || registerResponse.status >= 300) {
            const error = registerResponse.data || `HTTP ${registerResponse.status}`
            console.error('Image registration failed:', registerResponse.status, error)
            return NextResponse.json({
              error: 'Failed to register image upload',
              details: error
            }, { status: registerResponse.status })
          }

          const registerData = registerResponse.data
          console.log('Registration response:', JSON.stringify(registerData, null, 2))

          const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl
          const assetUrn = registerData.value?.asset

          if (!uploadUrl || !assetUrn) {
            console.error('Missing upload URL or asset URN:', { uploadUrl, assetUrn })
            return NextResponse.json({
              error: 'Invalid response from LinkedIn Assets API',
              details: registerData
            }, { status: 502 })
          }

          console.log(`Got upload URL and asset URN: ${assetUrn}`)

          // Step 2: Upload image binary to LinkedIn (using PUT to pre-signed URL)
          let uploadResponse
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              // Convert File to Buffer for axios
              const fileBuffer = Buffer.from(await file.arrayBuffer())
              console.log(`Uploading ${fileBuffer.length} bytes to LinkedIn`)

              uploadResponse = await linkedInAxios({
                method: 'PUT', // LinkedIn uses PUT for binary uploads
                url: uploadUrl,
                headers: {
                  'Content-Type': file.type || 'application/octet-stream',
                  // Don't include Authorization - the URL is pre-signed
                },
                data: fileBuffer,
                timeout: 90000,
                validateStatus: () => true,
                maxBodyLength: Infinity,
                maxContentLength: Infinity
              })

              break // Success, exit retry loop

            } catch (retryError) {
              if (attempt === 2 || retryError.name === 'AbortError') {
                throw retryError // Final attempt or non-retryable error
              }
              console.log(`Image upload attempt ${attempt} failed, retrying...`)
              await new Promise(resolve => setTimeout(resolve, 3000))
            }
          }

          if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
            console.error('Image upload failed:', uploadResponse.status, uploadResponse.data)
            return NextResponse.json({
              error: 'Failed to upload image',
              details: `HTTP ${uploadResponse.status}: ${uploadResponse.data || 'Unknown error'}`
            }, { status: uploadResponse.status })
          }

          console.log(`Image uploaded successfully: ${uploadResponse.status}`)

          mediaAssets.push({
            status: 'READY',
            description: {
              text: `Image ${mediaAssets.length + 1}`
            },
            media: assetUrn,
            title: {
              text: file.name || `Image ${mediaAssets.length + 1}`
            }
          })
        } catch (error) {
          console.error('Image upload error:', error)

          if (error.name === 'AbortError') {
            return NextResponse.json({
              error: 'Image upload timed out. Please try again with smaller images.'
            }, { status: 408 })
          }

          if (error.code === 'ETIMEDOUT' || error.cause?.code === 'ETIMEDOUT') {
            return NextResponse.json({
              error: 'Network timeout during image upload. Please check your connection.'
            }, { status: 504 })
          }

          return NextResponse.json({
            error: 'Image upload failed',
            details: error.message
          }, { status: 500 })
        }
      }

      // Step 3: Create image share
      console.log(`Creating image share with ${mediaAssets.length} media assets`)
      console.log('Media assets:', JSON.stringify(mediaAssets, null, 2))
      return createImageShare({ content, author, token, mediaAssets })

    } else {
      // Handle text-only posts
      const { content, author, token } = await req.json()
      if (!content || !author || !token) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
      return createTextPost({ content, author, token })
    }
  } catch (error) {
    console.error('LinkedIn API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// Create text-only share using UGC Posts API
async function createTextPost({ content, author, token }) {
  const shareBody = {
    author: `urn:li:person:${author}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content
        },
        shareMediaCategory: 'NONE'
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  }

  return createUGCPost({ token, shareBody })
}

// Create image share using UGC Posts API
async function createImageShare({ content, author, token, mediaAssets }) {
  const shareBody = {
    author: `urn:li:person:${author}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content
        },
        shareMediaCategory: 'IMAGE',
        media: mediaAssets
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  }

  console.log('Creating UGC post with body:', JSON.stringify(shareBody, null, 2))
  return createUGCPost({ token, shareBody })
}

// Create UGC post via LinkedIn UGC Posts API with retry logic

export async function createUGCPost({ token, shareBody }) {
  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`LinkedIn UGC API attempt ${attempt}/${maxRetries}`);

      const response = await linkedInAxios({
        method: "POST",
        url: "https://api.linkedin.com/v2/ugcPosts",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Content-Type": "application/json",
        },
        data: shareBody,
        timeout: 30000, // 30s timeout with better network config
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        const postId = response.headers["x-restli-id"];
        return NextResponse.json(
          { ...response.data, id: postId },
          { status: 201 }
        );
      }

      const errorDetails = response.data || `HTTP ${response.status}`;

      if (response.status >= 400 && response.status < 500) {
        // client errors → no retry
        return NextResponse.json(
          { error: "LinkedIn post creation failed", details: errorDetails },
          { status: response.status }
        );
      }

      if (attempt < maxRetries && response.status >= 500) {
        const delay = 2000 * attempt; // exponential backoff
        console.log(
          `LinkedIn API returned ${response.status}, retrying in ${delay}ms...`
        );
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      return NextResponse.json(
        { error: "LinkedIn post creation failed", details: errorDetails },
        { status: response.status }
      );
    } catch (err) {
       const code =
    err.code ||
    err?.cause?.code ||
    (Array.isArray(err?.errors) && err.errors[0]?.code) ||
    null;

  console.error(`LinkedIn Posts API error (attempt ${attempt}):`);
  console.error("  Code:", code);
  console.error("  Message:", err.message);
  console.error("  Stack:", err.stack);

  if (err.response) {
    console.error("  Status:", err.response.status);
    console.error("  Response Headers:", err.response.headers);
    console.error("  Response Data:", err.response.data);
  } else if (err.request) {
    console.error("  No response received. Request object:");
    console.error("  Request path:", err.request.path);
    console.error("  Request method:", err.request.method);
    console.error("  Request headers:", err.request._header);
  } else {
    console.error("  Unknown error:", err);
  }

  lastError = { code, message: err.message };

      if (["ENOTFOUND", "ECONNREFUSED"].includes(code)) {
        break;
      }

      if (
        attempt < maxRetries &&
        (code === "ETIMEDOUT" ||
          code === "ECONNABORTED" ||
          err.message?.includes("timeout"))
      ) {
        const delay = 3000 * attempt;
        console.log(`Network timeout, retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      break;
    }
  }

  // Final error handling
  if (!lastError) {
    return NextResponse.json(
      { error: "Unknown error during LinkedIn post creation." },
      { status: 500 }
    );
  }

  switch (lastError.code) {
    case "ECONNABORTED":
      return NextResponse.json(
        {
          error:
            "LinkedIn API is taking too long to respond. Please try again later.",
        },
        { status: 408 }
      );
    case "ETIMEDOUT":
      return NextResponse.json(
        {
          error:
            "LinkedIn API is currently slow or unavailable. Please try again shortly.",
        },
        { status: 504 }
      );
    case "ECONNRESET":
    case "ENOTFOUND":
    case "ECONNREFUSED":
      return NextResponse.json(
        {
          error:
            "Unable to connect to LinkedIn API. Please check your network or try later.",
        },
        { status: 503 }
      );
    default:
      return NextResponse.json(
        {
          error:
            "LinkedIn posting failed after multiple attempts. Please try again later.",
          details: lastError.message,
        },
        { status: 500 }
      );
  }
}

// Network diagnostic function
async function testLinkedInConnectivity() {
  try {
    console.log('Testing LinkedIn API connectivity...')

    // Test with a simple GET request first
    const testResponse = await linkedInAxios({
      method: 'GET',
      url: 'https://api.linkedin.com/v2/ugcPosts',
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
      },
      timeout: 10000,
      validateStatus: () => true
    })

    console.log(`LinkedIn connectivity test: ${testResponse.status}`)
    return testResponse.status === 401 // 401 means API is reachable but needs auth
  } catch (error) {
    console.error('LinkedIn connectivity test failed:', error.code, error.message)
    return false
  }
}
