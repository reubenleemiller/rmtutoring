const http = require("http");
const connect = require("connect");
const { createProxyMiddleware } = require("http-proxy-middleware");
const fetch = require("node-fetch");

const targetPort = process.env.API_PORT || 3000;
const clientId = process.env.OAUTH_CLIENT_ID;
const clientSecret = process.env.OAUTH_CLIENT_SECRET;
const redirectUri = process.env.OAUTH_REDIRECT_URI;

const app = connect();

// OAuth login endpoint: redirect to Google's OAuth consent screen
app.use("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent"
  });
  res.writeHead(302, { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  res.end();
});

// OAuth callback: handle Google's redirect, exchange code for tokens, fetch user info
app.use("/oauth/callback", async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = url.searchParams.get("code");
  if (!code) {
    res.statusCode = 400;
    res.end("Missing OAuth code");
    return;
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      res.statusCode = 500;
      res.end("Error exchanging code for token: " + tokenData.error_description);
      return;
    }

    // Fetch user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userInfo = await userRes.json();

    // For demonstration, return user info and tokens as JSON
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ user: userInfo, tokens: tokenData }));
  } catch (err) {
    res.statusCode = 500;
    res.end("OAuth error: " + err.message);
  }
});

// Proxy /v2 requests to the v2 API at localhost:API_PORT, NO path rewrites
const apiProxyV2 = createProxyMiddleware({
  target: `http://localhost:${targetPort}`,
  changeOrigin: true
});
app.use("/v2", apiProxyV2);

// 404 handler for all other routes
app.use((req, res) => {
  res.statusCode = 404;
  res.end("Not found");
});

const port = process.env.PORT || 8080;
http.createServer(app).listen(port, () => {
  console.log(`Proxy for /v2 listening on port ${port}, forwarding to v2 API on port ${targetPort}`);
});