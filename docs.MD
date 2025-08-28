Echo Pen - Minimal Offline-First Social Poster

Overview
- Host the Next.js app from the "Echo Pen" folder.
- No DB. Username/password and OAuth tokens are saved in the browser (localStorage).
- API routes act as thin proxies to LinkedIn and Twitter. They never store credentials; they forward what your browser sends for the single request.
- Dark theme with black background and white text throughout.

Pages Structure
- / : Landing page with hero section, features, and how-it-works
- /studio : Dashboard with links to Config and Composer
- /config : API configuration page for local login and credentials
- /composer : Post composition and publishing interface

Local Login (browser-only)
- We store { username, password } in window.localStorage under key local_user.
- This is intentionally lightweight: no password reset, one-time throwaway credentials.

Credentials Storage
- LinkedIn creds localStorage key: linkedin_creds = { personId, accessToken }
  - personId is the raw id (not full urn). The server builds urn:li:person:ID only at send time.
- Twitter creds localStorage key: twitter_creds = { accessToken, accessTokenSecret?, userId?, consumerKey?, consumerSecret? }
  - For text-only tweets, accessToken should be an OAuth2 user token with tweet.write.
  - For tweets with images, fill OAuth1 keys: consumerKey, consumerSecret, accessToken, accessTokenSecret.

.ENV style in client
- Instead of env files, set fields in the UI. Example mapping:
  - author -> linkedin_creds.personId (equivalent to NEXT_PUBLIC_LINKEDIN_PERSON_ID)
  - token  -> linkedin_creds.accessToken (equivalent to NEXT_PUBLIC_LINKEDIN_ACCESS_TOKEN)
- We DO NOT store these on the server or in any DB.

Posting Flow
- LinkedIn: /api/post/linkedin expects { content, author, token }
- Twitter (text): /api/post/twitter expects JSON { content, creds:{ accessToken } }
- Twitter (images): /api/post/twitter accepts multipart/form-data with fields content, consumerKey, consumerSecret, accessToken, accessTokenSecret and files image1..imageN. The server signs the request with your provided credentials for that single call; nothing is stored.
- The Studio calls LinkedIn and Twitter in parallel when you click Post, or you can use the dedicated "Tweet with Images (OAuth1)" button.

Images
- LinkedIn route here posts text-only (shareMediaCategory: NONE). Extend as needed with LinkedIn media APIs.
- Twitter supports images via OAuth1 path included here.

User Interface
- Dark theme with black background and white text throughout
- Global navbar with links to Studio, Config, and Composer
- No underlines on links, clean modern design
- Hover effects and transitions for better UX
- Separate pages for different functions:
  - /studio: Dashboard with quick start guide
  - /config: API configuration and credentials management
  - /composer: Post composition and publishing interface

Security Notes
- This app deliberately keeps secrets client-side. Anyone with access to your browser storage can use your tokens. Revoke tokens when done.
- The server never persists any credential; it only forwards.

Run locally
- cd "Echo Pen"
- npm install
- npm run dev
- http://localhost:3030

Deploy
- Build and run as a normal Next.js app. No DB/secret storage required.

Troubleshooting
- Twitter text posts failing: ensure your token is a user token with tweet.write scope (not app-only bearer).
- Twitter image tweets failing: ensure OAuth1 keys are correct and your Twitter app has media upload access; check server logs.
- LinkedIn failing: verify access token is valid and person ID is correct (the raw person id, not full urn).

