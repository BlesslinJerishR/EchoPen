'use client'
import { useEffect, useState } from 'react'
import useViewport from '../hooks/useViewport'

function getLS(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function setLS(key, value) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export default function Config() {
  const { isMobile } = useViewport();
  const [li, setLi] = useState(() => getLS('linkedin_creds', { personId: '', accessToken: '' }))
  const [tw, setTw] = useState(() => getLS('twitter_creds', { cookies: '' }))

  useEffect(() => { setLS('linkedin_creds', li) }, [li])
  useEffect(() => { setLS('twitter_creds', tw) }, [tw])

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000000",
        padding: "1rem 0",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div style={{ 
        maxWidth: "64rem", 
        margin: "0 auto", 
        padding: "0 1rem",
        width: "100%",
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: isMobile ? "1.8rem" : "2.5rem",
              fontWeight: "700",
              marginBottom: "1rem",
              color: "#ffffff",
              padding: "0 0.5rem",
            }}
          >
            API Configuration
          </h1>
          <p
            style={{ 
              fontSize: isMobile ? "1rem" : "1.2rem", 
              color: "#cccccc", 
              fontWeight: "300",
              padding: "0 0.5rem",
            }}
          >
            Connect your LinkedIn and Twitter accounts to start posting
          </p>
        </div>

        <div style={{ display: "grid", gap: "2.5rem" }}>
          {/* LinkedIn */}
          <section
            style={{
              backgroundColor: "#111111",
              border: "1px solid #333333",
              borderRadius: "20px",
              padding: isMobile ? "1.5rem" : "2.5rem",
              background: "linear-gradient(135deg, #111111 0%, #0a0a0a 100%)",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ fontSize: isMobile ? "2rem" : "2.5rem", marginRight: "1rem" }}>💼</div>
              <div>
                <h3
                  style={{
                    fontSize: isMobile ? "1.4rem" : "1.75rem",
                    fontWeight: "700",
                    color: "#ffffff",
                    marginBottom: "0.5rem",
                  }}
                >
                  LinkedIn API
                </h3>
                <p style={{ color: "#cccccc", fontSize: "1.1rem" }}>
                  Connect your LinkedIn account for professional posting
                </p>
              </div>
            </div>

            <div
              style={{ display: "grid", gap: "1.5rem", marginBottom: "2rem" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: "#ffffff",
                  }}
                >
                  Person ID
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "1rem",
                    backgroundColor: "#000000",
                    border: "2px solid #333333",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "1rem",
                    fontFamily: "Poppins, sans-serif",
                    transition: "border-color 0.3s ease",
                  }}
                  placeholder="urn:li:person:XXXX -> enter just XXXX"
                  value={li.personId}
                  onChange={(e) =>
                    setLi((v) => ({ ...v, personId: e.target.value }))
                  }
                  onFocus={(e) => (e.target.style.borderColor = "#555555")}
                  onBlur={(e) => (e.target.style.borderColor = "#333333")}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: "#ffffff",
                  }}
                >
                  Access Token
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "1rem",
                    backgroundColor: "#000000",
                    border: "2px solid #333333",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "1rem",
                    fontFamily: "Poppins, sans-serif",
                    transition: "border-color 0.3s ease",
                  }}
                  placeholder="Paste LinkedIn access token"
                  value={li.accessToken}
                  onChange={(e) =>
                    setLi((v) => ({ ...v, accessToken: e.target.value }))
                  }
                  onFocus={(e) => (e.target.style.borderColor = "#555555")}
                  onBlur={(e) => (e.target.style.borderColor = "#333333")}
                />
              </div>
            </div>

            <div
              style={{
                padding: isMobile ? "1rem" : "1.5rem",
                backgroundColor: "#0a0a0a",
                borderRadius: "12px",
                border: "1px solid #222222",
              }}
            >
              <p
                style={{
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "1rem",
                  fontSize: isMobile ? "1rem" : "1.1rem",
                }}
              >
                📋 How to get LinkedIn tokens:
              </p>
              <ol
                style={{
                  listStyle: "decimal",
                  listStylePosition: "inside",
                  color: "#cccccc",
                  lineHeight: "1.6",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
              >
                <li style={{ marginBottom: "0.5rem" }}>
                  Go to https://www.linkedin.com/developers/apps
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Create a LinkedIn app and grant profile permissions
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  GO to Auth tab and click Using OAuth 2.0 tools you can create
                  new access tokens, Create token, select scopes and click
                  Request Access Tokens
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Find your Person ID i.e "sub":"YOUR_PERSON ID" by requesting the
                  endpoint from this endpoint
                </li>
                curl.exe -X GET "https://api.linkedin.com/v2/userinfo" -H
                "Authorization: Bearer YOUR_TOKEN"
                <li>Paste the Person ID and Access Token here</li>
              </ol>
            </div>
          </section>

          {/* Twitter */}
          <section
            style={{
              backgroundColor: "#111111",
              border: "1px solid #333333",
              borderRadius: "20px",
              padding: isMobile ? "1.5rem" : "2.5rem",
              background: "linear-gradient(135deg, #111111 0%, #0a0a0a 100%)",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ fontSize: isMobile ? "2rem" : "2.5rem", marginRight: "1rem" }}>🐦</div>
              <div>
                <h3
                  style={{
                    fontSize: isMobile ? "1.4rem" : "1.75rem",
                    fontWeight: "700",
                    color: "#ffffff",
                    marginBottom: "0.5rem",
                  }}
                >
                  Twitter/X Session
                </h3>
                <p style={{ color: "#cccccc", fontSize: "1.1rem" }}>
                  Add your Twitter session from Chrome to enable posting
                </p>
              </div>
            </div>

            <div
              style={{ display: "grid", gap: "1.5rem", marginBottom: "2rem" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: "#ffffff",
                  }}
                >
                  Session Cookies
                </label>
                <textarea
                  style={{
                    width: "100%",
                    padding: "1rem",
                    backgroundColor: "#000000",
                    border: "2px solid #333333",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "1rem",
                    fontFamily: "monospace",
                    minHeight: "100px",
                    transition: "border-color 0.3s ease",
                  }}
                  placeholder="Paste your Twitter cookies here"
                  value={tw.cookies || ""}
                  onChange={(e) =>
                    setTw((v) => ({ ...v, cookies: e.target.value }))
                  }
                  onFocus={(e) => (e.target.style.borderColor = "#555555")}
                  onBlur={(e) => (e.target.style.borderColor = "#333333")}
                />
              </div>
            </div>

            <div
              style={{
                padding: isMobile ? "1rem" : "1.5rem",
                backgroundColor: "#0a0a0a",
                borderRadius: "12px",
                border: "1px solid #222222",
              }}
            >
              <p
                style={{
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "1rem",
                  fontSize: isMobile ? "1rem" : "1.1rem",
                }}
              >
                📋 How to add your Twitter session:
              </p>
              <ol
                style={{
                  listStyle: "decimal",
                  listStylePosition: "inside",
                  color: "#cccccc",
                  lineHeight: "1.6",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
              >
                <li style={{ marginBottom: "0.5rem" }}>
                  Login to Twitter in Chrome
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Press F12 to open Developer Tools
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Go to Application → Cookies → twitter.com
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Select and copy these cookies: auth_token, ct0
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Format them as: auth_token=value; ct0=value
                </li>
                <li>Paste the formatted cookies above</li>
              </ol>
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  backgroundColor: "#111111",
                  borderRadius: "8px",
                  border: "1px solid #333333",
                }}
              >
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#cccccc",
                    lineHeight: "1.5",
                  }}
                >
                  <strong style={{ color: "#ffffff" }}>Note:</strong> Your
                  session cookies are stored locally in your browser. This
                  method is safer as it doesn't require storing your password.
                  The session will work as long as you stay logged in to Twitter
                  in Chrome.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
