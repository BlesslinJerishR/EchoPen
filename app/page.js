'use client';
import Link from 'next/link'
import useViewport from './hooks/useViewport'

export default function Landing() {
  const isDesktop = useViewport();
  console.log(isDesktop);
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000000" }}>
      {/* Hero Section */}
      <section
        style={{
          padding: isDesktop ? "1rem 0 7rem 0" : "6rem 0 4rem 0",
          marginTop: -50,
          background: "linear-gradient(135deg, #000000 0%, #111111 100%)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 1.5rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              marginBottom: isDesktop ? "2rem" : "1.5rem",
              marginTop: isDesktop ? 100 : 0,
            }}
          >
            <div
              style={{
                fontSize: isDesktop ? "4.5rem" : "3rem",
                marginBottom: isDesktop ? "1rem" : "0.75rem",
              }}
            >
              ✍️
            </div>
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 5.625vw, 4.5rem)", // 5.625vw = 4.5rem at 800px
              fontWeight: "700",
              marginTop: isDesktop ? -15 : -10,
              marginBottom: isDesktop ? "1.5rem" : "1.25rem",
              color: "#ffffff",
              lineHeight: "1.1",
              letterSpacing: "-0.02em",
              width: "110%",
              marginLeft: -16,
            }}
            className="He"
          >
            write once, <br />
            publish everywhere.
            <br />
          </h1>
          <p
            style={{
              fontSize: isDesktop ? "1.5rem" : "1.25rem",
              color: "#cccccc",
              maxWidth: isDesktop ? "48rem" : "42rem",
              margin: `0 auto ${isDesktop ? "3rem" : "2.5rem"} auto`,
              lineHeight: "1.6",
              fontWeight: "300",
            }}
          >
            Offline-first social posting. Your keys stay in your browser.
            <br />
            <span style={{ color: "#888888" }}>
              No databases. No tracking. Just pure, simple posting.
            </span>
          </p>
          <div
            style={{
              display: "flex",
              gap: "1.25rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/composer"
              className="hover-bg"
              style={{
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: "1rem 2.5rem",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "1.1rem",
                textDecoration: "none",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 20px rgba(255, 255, 255, 0.1)",
              }}
            >
              Start Writing →
            </Link>
            <Link
              href="/config"
              className="hover-border"
              style={{
                border: "2px solid #333333",
                color: "#ffffff",
                padding: "1rem 2.5rem",
                borderRadius: "12px",
                fontWeight: "500",
                fontSize: "1.1rem",
                textDecoration: "none",
                transition: "all 0.3s ease",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
              }}
            >
              Configure APIs
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "6rem 0", backgroundColor: "#0a0a0a" }}>
        <div
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: "600",
              textAlign: "center",
              marginBottom: "4rem",
              color: "#ffffff",
            }}
          >
            Why Echo Pen?
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "2.5rem",
            }}
          >
            <div
              style={{
                backgroundColor: "#111111",
                border: "1px solid #222222",
                borderRadius: "16px",
                padding: "2.5rem",
                transition: "transform 0.3s ease, border-color 0.3s ease",
                cursor: "pointer",
              }}
              className="feature-card"
            >
              <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>🔒</div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  color: "#ffffff",
                }}
              >
                Privacy First
              </h3>
              <p
                style={{
                  color: "#cccccc",
                  lineHeight: "1.6",
                  fontSize: "1.1rem",
                }}
              >
                All credentials stored locally in your browser. Zero server-side
                storage. Your data never leaves your device.
              </p>
            </div>
            <div
              style={{
                backgroundColor: "#111111",
                border: "1px solid #222222",
                borderRadius: "16px",
                padding: "2.5rem",
                transition: "transform 0.3s ease, border-color 0.3s ease",
                cursor: "pointer",
              }}
              className="feature-card"
            >
              <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>⚡</div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  color: "#ffffff",
                }}
              >
                Smart Threading
              </h3>
              <p
                style={{
                  color: "#cccccc",
                  lineHeight: "1.6",
                  fontSize: "1.1rem",
                }}
              >
                Automatically splits long posts into Twitter threads. Write
                freely, we handle the character limits.
              </p>
            </div>
            <div
              style={{
                backgroundColor: "#111111",
                border: "1px solid #222222",
                borderRadius: "16px",
                padding: "2.5rem",
                transition: "transform 0.3s ease, border-color 0.3s ease",
                cursor: "pointer",
              }}
              className="feature-card"
            >
              <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>🛠</div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  color: "#ffffff",
                }}
              >
                Simple Setup
              </h3>
              <p
                style={{
                  color: "#cccccc",
                  lineHeight: "1.6",
                  fontSize: "1.1rem",
                }}
              >
                Just paste your API tokens. No complex OAuth flows. Works
                offline after initial setup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section
        style={{
          padding: "6rem 0",
          background:
            "linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)",
          position: "relative",
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundImage:
              "radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.02) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.02) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            marginTop: -50,
            padding: "0 1.5rem",
            position: "relative",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "5rem" }}>
            <h2
              style={{
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: "700",
                marginBottom: "1rem",
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              How it works
            </h2>
            <p
              style={{
                fontSize: "clamp(1rem, 3vw, 1.3rem)",
                color: "#888888",
                maxWidth: "600px",
                margin: "0 auto",
                lineHeight: "1.6",
              }}
            >
              Get started in minutes with our simple 3-step process
            </p>
          </div>

          <div
            className="how-it-works-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "clamp(2rem, 5vw, 4rem)",
            }}
          >
            {/* Step 1 */}
            <div
              style={{
                textAlign: "center",
                padding: "2rem",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                borderRadius: "20px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
              }}
              className="step-card"
            >
              {/* Card glow effect */}
              <div
                style={{
                  position: "absolute",
                  top: "-50%",
                  left: "-50%",
                  width: "200%",
                  height: "200%",
                  background:
                    "radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)",
                  opacity: "0",
                  transition: "opacity 0.3s ease",
                  pointerEvents: "none",
                }}
                className="card-glow"
              />

              <div
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
                  color: "#000000",
                  borderRadius: "10%",
                  width: "clamp(4rem, 8vw, 5rem)",
                  height: "clamp(4rem, 8vw, 5rem)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  margin: "0 auto 2rem auto",
                  boxShadow: "0 10px 30px rgba(255, 255, 255, 0.1)",
                  position: "relative",
                  zIndex: "1",
                }}
              >
                1
              </div>

              <div
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  marginBottom: "1rem",
                }}
              >
                ⚙️
              </div>

              <h3
                style={{
                  fontWeight: "700",
                  marginBottom: "1.5rem",
                  color: "#ffffff",
                  fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
                  letterSpacing: "-0.01em",
                }}
              >
                Configure APIs
              </h3>

              <p
                style={{
                  color: "#cccccc",
                  lineHeight: "1.7",
                  fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
                  maxWidth: "280px",
                  margin: "0 auto",
                }}
              >
                Paste your LinkedIn and Twitter API tokens. We provide
                step-by-step instructions to get you started.
              </p>
            </div>

            {/* Step 2 */}
            <div
              style={{
                textAlign: "center",
                padding: "2rem",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                borderRadius: "20px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
              }}
              className="step-card"
            >
              {/* Card glow effect */}
              <div
                style={{
                  position: "absolute",
                  top: "-50%",
                  left: "-50%",
                  width: "200%",
                  height: "200%",
                  background:
                    "radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)",
                  opacity: "0",
                  transition: "opacity 0.3s ease",
                  pointerEvents: "none",
                }}
                className="card-glow"
              />

              <div
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
                  color: "#000000",
                  borderRadius: "10%",
                  width: "clamp(4rem, 8vw, 5rem)",
                  height: "clamp(4rem, 8vw, 5rem)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  margin: "0 auto 2rem auto",
                  boxShadow: "0 10px 30px rgba(255, 255, 255, 0.1)",
                  position: "relative",
                  zIndex: "1",
                }}
              >
                2
              </div>

              <div
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  marginBottom: "1rem",
                }}
              >
                ✍️
              </div>

              <h3
                style={{
                  fontWeight: "700",
                  marginBottom: "1.5rem",
                  color: "#ffffff",
                  fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
                  letterSpacing: "-0.01em",
                }}
              >
                Write your content
              </h3>

              <p
                style={{
                  color: "#cccccc",
                  lineHeight: "1.7",
                  fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
                  maxWidth: "280px",
                  margin: "0 auto",
                }}
              >
                Compose your post with text and images. Long posts are
                automatically split into Twitter threads.
              </p>
            </div>

            {/* Step 3 */}
            <div
              style={{
                textAlign: "center",
                padding: "2rem",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                borderRadius: "20px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
              }}
              className="step-card"
            >
              {/* Card glow effect */}
              <div
                style={{
                  position: "absolute",
                  top: "-50%",
                  left: "-50%",
                  width: "200%",
                  height: "200%",
                  background:
                    "radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)",
                  opacity: "0",
                  transition: "opacity 0.3s ease",
                  pointerEvents: "none",
                }}
                className="card-glow"
              />

              <div
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
                  color: "#000000",
                  borderRadius: "10%",
                  width: "clamp(4rem, 8vw, 5rem)",
                  height: "clamp(4rem, 8vw, 5rem)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  margin: "0 auto 2rem auto",
                  boxShadow: "0 10px 30px rgba(255, 255, 255, 0.1)",
                  position: "relative",
                  zIndex: "1",
                }}
              >
                3
              </div>

              <div
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  marginBottom: "1rem",
                }}
              >
                🚀
              </div>

              <h3
                style={{
                  fontWeight: "700",
                  marginBottom: "1.5rem",
                  color: "#ffffff",
                  fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
                  letterSpacing: "-0.01em",
                }}
              >
                Publish everywhere
              </h3>

              <p
                style={{
                  color: "#cccccc",
                  lineHeight: "1.7",
                  fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
                  maxWidth: "280px",
                  margin: "0 auto",
                }}
              >
                One click publishes to both LinkedIn and Twitter with
                intelligent thread handling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "6rem 0",
          background: "linear-gradient(135deg, #111111 0%, #000000 100%)",
          borderTop: "1px solid #222222",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "0 1.5rem",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "3rem",
              fontWeight: "700",
              marginBottom: "1.5rem",
              color: "#ffffff",
              lineHeight: "1.2",
            }}
          >
            Ready to amplify your voice?
          </h2>
          <p
            style={{
              color: "#cccccc",
              marginBottom: "3rem",
              fontSize: "1.3rem",
              lineHeight: "1.6",
              fontWeight: "300",
            }}
          >
            Join thousands who trust Echo Pen for their social media presence.
          </p>
          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/composer"
              className="hover-bg"
              style={{
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: "1rem 2.5rem",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "1.1rem",
                textDecoration: "none",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 20px rgba(255, 255, 255, 0.1)",
              }}
            >
              Start Writing Now →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

