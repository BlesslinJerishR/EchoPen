'use client'
import { useEffect, useState } from 'react'

function getLS(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}

// Function to split text into Twitter threads
function splitIntoThreads(text, maxLength = 280) {
  if (text.length <= maxLength) return [text]

  const sentences = text.split(/[.!?]+/).filter(s => s.trim())
  const threads = []
  let currentThread = ''

  for (let sentence of sentences) {
    sentence = sentence.trim()
    if (!sentence) continue

    // Add punctuation back
    if (!sentence.match(/[.!?]$/)) sentence += '.'

    const threadNumber = threads.length + 1
    const threadPrefix = threadNumber > 1 ? `${threadNumber}/ ` : ''
    const potentialThread = currentThread ? `${currentThread} ${sentence}` : sentence

    if ((threadPrefix + potentialThread).length <= maxLength) {
      currentThread = potentialThread
    } else {
      if (currentThread) {
        const finalPrefix = threads.length > 0 ? `${threads.length + 1}/ ` : ''
        threads.push(finalPrefix + currentThread)
        currentThread = sentence
      } else {
        // Single sentence is too long, split by words
        const words = sentence.split(' ')
        let chunk = ''
        for (let word of words) {
          const testChunk = chunk ? `${chunk} ${word}` : word
          const testWithPrefix = threadPrefix + testChunk
          if (testWithPrefix.length <= maxLength) {
            chunk = testChunk
          } else {
            if (chunk) {
              threads.push(threadPrefix + chunk)
              chunk = word
            } else {
              // Single word too long, just add it
              threads.push(threadPrefix + word)
            }
          }
        }
        if (chunk) currentThread = chunk
      }
    }
  }

  if (currentThread) {
    const finalPrefix = threads.length > 0 ? `${threads.length + 1}/ ` : ''
    threads.push(finalPrefix + currentThread)
  }

  return threads
}

export default function Composer() {
  const [content, setContent] = useState("")
  const [images, setImages] = useState([])
  const [li, setLi] = useState(() => getLS('linkedin_creds', { personId: '', accessToken: '' }))
  const [tw, setTw] = useState(() => getLS('twitter_creds', { accessToken: '', accessTokenSecret: '', userId: '', consumerKey:'', consumerSecret:'' }))
  const [threads, setThreads] = useState([])
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    linkedin: true,
    twitter: true,
    all: true
  })

  // Update threads when content changes
  useEffect(() => {
    if (content.trim()) {
      setThreads(splitIntoThreads(content.trim()))
    } else {
      setThreads([])
    }
  }, [content])

  // Handle platform toggle
  const handlePlatformToggle = (platform) => {
    if (platform === 'all') {
      const newAllState = !selectedPlatforms.all
      setSelectedPlatforms({
        all: newAllState,
        linkedin: newAllState,
        twitter: newAllState
      })
    } else {
      const newPlatforms = {
        ...selectedPlatforms,
        [platform]: !selectedPlatforms[platform]
      }
      newPlatforms.all = newPlatforms.linkedin && newPlatforms.twitter
      setSelectedPlatforms(newPlatforms)
    }
  }

  async function postTwitterThread() {
    if (!content.trim()) return alert('Add some content to post')
    if (!tw?.cookies) return alert('Configure Twitter session in Config first')

    try {
      const threadPosts = splitIntoThreads(content.trim())
      let previousTweetId = null

      for (let i = 0; i < threadPosts.length; i++) {
        const tweetContent = threadPosts[i]
        const payload = {
          content: tweetContent,
          creds: tw,
          replyToId: previousTweetId
        }

        const response = await fetch('/api/post/twitter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(`Tweet ${i + 1} failed: ${error}`)
        }

        const result = await response.json()
        previousTweetId = result.data?.id

        // Small delay between tweets
        if (i < threadPosts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      alert(`Successfully posted Twitter thread with ${threadPosts.length} tweets!`)
      setContent('')
      setImages([])
    } catch (error) {
      console.error('Twitter thread error:', error)
      let errorMessage = 'Twitter thread failed: '

      if (error.message.includes('timeout')) {
        errorMessage += 'Request timed out. Please check your internet connection and try again.'
      } else if (error.message.includes('Network error')) {
        errorMessage += 'Network error. Please check your internet connection.'
      } else {
        errorMessage += error.message
      }

      alert(errorMessage)
    }
  }

  async function handlePost() {
    if (!content.trim() && images.length===0) return alert('Add some content or an image')

    const tasks = []

    // LinkedIn posting
    if (selectedPlatforms.linkedin && li?.accessToken && li?.personId) {
      if (images.length > 0) {
        const fd = new FormData()
        fd.set('content', content)
        fd.set('author', li.personId)
        fd.set('token', li.accessToken)
        images.forEach((f,i)=>fd.append(`image${i+1}`, f))
        tasks.push(fetch('/api/post/linkedin', { method:'POST', body: fd }))
      } else {
        tasks.push(fetch('/api/post/linkedin', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content, author: li.personId, token: li.accessToken }) }))
      }
    }

    // Twitter posting (single tweet only)
    if (selectedPlatforms.twitter && tw?.cookies && threads.length === 1) {
      tasks.push(fetch('/api/post/twitter', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content, creds: tw }) }))
    }

    if (tasks.length===0) return alert('Select platforms and configure API credentials first')

    const resps = await Promise.allSettled(tasks)
    const ok = resps.every(r => r.status==='fulfilled' && r.value.ok)
    if (!ok) {
      const errorMessages = []
      for (let i = 0; i < resps.length; i++) {
        const resp = resps[i]
        if (resp.status === 'rejected') {
          errorMessages.push(`Network error: ${resp.reason?.message || 'Unknown error'}`)
        } else if (!resp.value.ok) {
          try {
            const errorData = await resp.value.json()
            errorMessages.push(errorData.error || `HTTP ${resp.value.status} error`)
          } catch {
            const errorText = await resp.value.text()
            errorMessages.push(errorText || `HTTP ${resp.value.status} error`)
          }
        }
      }
      console.error('Posting errors:', errorMessages)
      alert(`Posting failed:\n\n${errorMessages.join('\n\n')}`)
    } else {
      alert('Posted to selected platforms!')
      setContent('')
      setImages([])
    }
  }

async function handleTwitterOnly() {
  if (!content.trim()) return alert("Add some content to post");
  if (!tw?.cookies) return alert("Configure Twitter session in Config first");

  if (threads.length === 1) {
    // Parse the cookie string: "auth_token=...; ct0=..."
    const cookieParts = tw.cookies.split(";").map((s) => s.trim());
    const cookieMap = {};
    cookieParts.forEach((part) => {
      const [key, value] = part.split("=");
      cookieMap[key] = value;
    });

    const auth_token = cookieMap.auth_token;
    const ct0 = cookieMap.ct0;

    if (!auth_token || !ct0) {
      return alert("Missing auth_token or ct0 in your cookies");
    }

    // Now send separate fields (what backend expects)
    const response = await fetch("/api/post/twitter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, auth_token, ct0 }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        alert(
          "Twitter post failed: " +
            (errorData.error || `HTTP ${response.status} error`)
        );
      } catch {
        const errorText = await response.text();
        alert(
          "Twitter post failed: " +
            (errorText || `HTTP ${response.status} error`)
        );
      }
    } else {
      alert("Posted to Twitter!");
      setContent("");
      setImages([]);
    }
  } else {
    await postTwitterThread();
  }
}




  async function handleLinkedInOnly() {
    if (!content.trim() && images.length===0) return alert('Add some content or an image')
    if (!li?.accessToken || !li?.personId) return alert('Configure LinkedIn API in Config first')

    let response;
    if (images.length > 0) {
      // Use FormData for image uploads
      const fd = new FormData()
      fd.set('content', content)
      fd.set('author', li.personId)
      fd.set('token', li.accessToken)
      images.forEach((f, i) => fd.append(`image${i+1}`, f))
      response = await fetch('/api/post/linkedin', { method: 'POST', body: fd })
    } else {
      // Use JSON for text-only posts
      response = await fetch('/api/post/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, author: li.personId, token: li.accessToken })
      })
    }

    if (!response.ok) {
      try {
        const errorData = await response.json()
        alert('LinkedIn post failed: ' + (errorData.error || `HTTP ${response.status} error`))
      } catch {
        const errorText = await response.text()
        alert('LinkedIn post failed: ' + (errorText || `HTTP ${response.status} error`))
      }
    } else {
      alert('Posted to LinkedIn!')
      setContent('')
      setImages([])
    }
  }

  function pickImages(e){
    const files = Array.from(e.target.files||[])
    setImages(files)
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#000000', padding: '2rem 0', fontFamily: 'Poppins, sans-serif'}}>
      <div style={{maxWidth: '50rem', margin: '0 auto', padding: '0 1.5rem'}}>
        <div style={{textAlign: 'center', marginBottom: '3rem'}}>
          <h1 style={{fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem', color: '#ffffff'}}>Composer</h1>
          <p style={{fontSize: '1.2rem', color: '#cccccc', fontWeight: '300', marginBottom: '1.5rem'}}>Write once, publish everywhere</p>
          
          {/* Connection Status Indicators */}
          <div style={{display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '2rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: li?.accessToken && li?.personId ? '#4ade80' : '#f87171',
                animation: `${li?.accessToken && li?.personId ? 'pulse-green' : 'pulse-red'} 2s infinite`
              }} />
              <span style={{color: '#ffffff', fontSize: '0.9rem'}}>
                LinkedIn: {li?.accessToken && li?.personId ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: tw?.cookies ? '#4ade80' : '#f87171',
                animation: `${tw?.cookies ? 'pulse-green' : 'pulse-red'} 2s infinite`
              }} />
              <span style={{color: '#ffffff', fontSize: '0.9rem'}}>
                Twitter: {tw?.cookies ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <style jsx>{`
            @keyframes pulse-green {
              0% {
                box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4);
              }
              70% {
                box-shadow: 0 0 0 10px rgba(74, 222, 128, 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
              }
            }
            @keyframes pulse-red {
              0% {
                box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.4);
              }
              70% {
                box-shadow: 0 0 0 10px rgba(248, 113, 113, 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(248, 113, 113, 0);
              }
            }
          `}</style>
        </div>

        <div style={{backgroundColor: '#111111', border: '1px solid #333333', borderRadius: '16px', padding: '2rem'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
            <div>
              <label style={{display: 'block', fontSize: '1rem', fontWeight: '500', marginBottom: '0.75rem', color: '#ffffff'}}>Content</label>
              <textarea
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: '#000000',
                  border: '1px solid #444444',
                  borderRadius: '12px',
                  color: '#ffffff',
                  resize: 'none',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '1rem',
                  lineHeight: '1.6'
                }}
                rows="10"
                placeholder="Write something amazing..."
                value={content}
                onChange={e=>setContent(e.target.value)}
              />
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem'}}>
                <div style={{fontSize: '0.875rem', color: '#888888'}}>
                  {content.length} characters
                </div>
                {threads.length > 1 && (
                  <div style={{fontSize: '0.875rem', color: '#ffaa00', fontWeight: '500'}}>
                    Will create {threads.length} tweets (thread)
                  </div>
                )}
              </div>
            </div>

            

            {/* Thread Preview */}
            {threads.length > 1 && (
              <div>
                <h3 style={{fontSize: '1rem', fontWeight: '500', marginBottom: '1rem', color: '#ffffff'}}>Thread Preview</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto'}}>
                  {threads.map((thread, index) => (
                    <div key={index} style={{
                      backgroundColor: '#000000',
                      border: '1px solid #333333',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem'
                    }}>
                      <div style={{color: '#888888', marginBottom: '0.25rem'}}>Tweet {index + 1}</div>
                      <div style={{color: '#ffffff'}}>{thread}</div>
                      <div style={{color: '#666666', fontSize: '0.75rem', marginTop: '0.25rem'}}>
                        {thread.length} characters
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={{display: 'block', fontSize: '1rem', fontWeight: '500', marginBottom: '0.75rem', color: '#ffffff'}}>Images</label>
              <div style={{position: 'relative'}}>
                <input
                  id="file-upload"
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={pickImages}
                />
                <div style={{
                  width: '100%',
                  padding: '1.5rem',
                  backgroundColor: '#000000',
                  border: '2px dashed #444444',
                  borderRadius: '12px',
                  color: '#cccccc',
                  fontFamily: 'Poppins, sans-serif',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.3s ease, background-color 0.3s ease'
                }}
                onMouseEnter={e => {
                  e.target.style.borderColor = '#666666'
                  e.target.style.backgroundColor = '#111111'
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = '#444444'
                  e.target.style.backgroundColor = '#000000'
                }}>
                  <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>📁</div>
                  <div style={{fontWeight: '500', marginBottom: '0.25rem'}}>
                    {images.length > 0 ? `${images.length} file${images.length > 1 ? 's' : ''} selected` : 'Choose files or drag & drop'}
                  </div>
                  <div style={{fontSize: '0.875rem', color: '#888888'}}>
                    {images.length === 0 ? 'PNG, JPG, GIF up to 10MB' : 'Click to change selection'}
                  </div>
                </div>
              </div>
            </div>
{/* Platform Selection */}
            <div>
              <h3 style={{fontSize: '1rem', fontWeight: '500', marginBottom: '1rem', color: '#ffffff'}}>Select Platforms</h3>
              <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                {/* All Platforms Toggle */}
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <button
                    onClick={() => handlePlatformToggle('all')}
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      backgroundColor: selectedPlatforms.all ? '#4ade80' : '#333333',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      position: 'absolute',
                      top: '4px',
                      left: selectedPlatforms.all ? '26px' : '4px',
                      transition: 'left 0.3s ease'
                    }} />
                  </button>
                  <span style={{color: '#ffffff', fontWeight: '500'}}>All Platforms</span>
                </div>

                {/* LinkedIn Toggle */}
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <button
                    onClick={() => handlePlatformToggle('linkedin')}
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      backgroundColor: selectedPlatforms.linkedin ? '#0077b5' : '#333333',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      position: 'absolute',
                      top: '4px',
                      left: selectedPlatforms.linkedin ? '26px' : '4px',
                      transition: 'left 0.3s ease'
                    }} />
                  </button>
                  <span style={{color: '#ffffff', fontWeight: '500'}}>💼 LinkedIn</span>
                </div>

                {/* Twitter Toggle */}
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <button
                    onClick={() => handlePlatformToggle('twitter')}
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      backgroundColor: selectedPlatforms.twitter ? '#1da1f2' : '#333333',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      position: 'absolute',
                      top: '4px',
                      left: selectedPlatforms.twitter ? '26px' : '4px',
                      transition: 'left 0.3s ease'
                    }} />
                  </button>
                  <span style={{color: '#ffffff', fontWeight: '500'}}>🐦 Twitter / X</span>
                </div>
              </div>
            </div>
            <div style={{display: 'flex', gap: '1rem', paddingTop: '1rem', flexWrap: 'wrap'}}>
              {/* All Platforms Button */}
              {selectedPlatforms.all && (
                <button
                  className="hover-bg"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '1rem'
                  }}
                  onClick={handlePost}
                >
                  🚀 Post to All Platforms {threads.length === 1 ? '' : '(LinkedIn only)'}
                </button>
              )}

              {/* LinkedIn Only Button */}
              {selectedPlatforms.linkedin && !selectedPlatforms.all && (
                <button
                  className="hover-bg"
                  style={{
                    backgroundColor: '#0077b5',
                    color: '#ffffff',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '1rem'
                  }}
                  onClick={handleLinkedInOnly}
                >
                  💼 Post to LinkedIn
                </button>
              )}

              {/* Twitter Only Button */}
              {selectedPlatforms.twitter && !selectedPlatforms.all && (
                <button
                  className="hover-bg"
                  style={{
                    backgroundColor: '#1da1f2',
                    color: '#ffffff',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '1rem'
                  }}
                  onClick={handleTwitterOnly}
                >
                  🐦 Post to Twitter {threads.length > 1 ? `(${threads.length} tweets)` : ''}
                </button>
              )}

              {/* Twitter Thread Button (when All Platforms is selected but content is too long) */}
              {selectedPlatforms.all && threads.length > 1 && (
                <button
                  className="hover-border"
                  style={{
                    border: '2px solid #1da1f2',
                    backgroundColor: 'transparent',
                    color: '#1da1f2',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '1rem'
                  }}
                  onClick={postTwitterThread}
                >
                  🧵 Post Twitter Thread ({threads.length} tweets)
                </button>
              )}

              {/* Twitter with Images Button */}
              {images.length > 0 && selectedPlatforms.twitter && (
                <button
                  className="hover-border"
                  style={{
                    border: '2px solid #444444',
                    backgroundColor: 'transparent',
                    color: '#ffffff',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '1rem'
                  }}
                  onClick={async()=>{
                    if(!tw?.cookies) return alert('Configure Twitter session in Config first')
                    if(!content.trim() && images.length===0) return alert('Add text or an image')
                    const fd = new FormData()
                    fd.set('content', content)
                    fd.set('cookies', tw.cookies)
                    images.forEach((f,i)=>fd.append(`image${i+1}`, f))
                    const r = await fetch('/api/post/twitter', { method:'POST', body: fd })
                    if(!r.ok){ console.error(await r.text()); alert('Twitter image post failed') } else { alert('Tweeted with images!') }
                  }}
                >
                  📸 Tweet with Images
                </button>
              )}
            </div>

            <div style={{fontSize: '0.875rem', color: '#888888', paddingTop: '1rem', borderTop: '1px solid #333333', marginTop: '1rem'}}>
              <p><strong>Note:</strong> Long posts are automatically split into Twitter threads.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
