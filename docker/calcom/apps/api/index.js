const http = require("http");
const connect = require("connect");
const { createProxyMiddleware } = require("http-proxy-middleware");
const fetch = require("node-fetch");

const targetPort = process.env.API_PORT || 3000;
const clientId = process.env.OAUTH_CLIENT_ID;
const clientSecret = process.env.OAUTH_CLIENT_SECRET;
const redirectUri = process.env.OAUTH_REDIRECT_URI;
const authorizationUrl = process.env.OAUTH_AUTHORIZATION_URL;
const tokenUrl = process.env.OAUTH_TOKEN_URL;

const app = connect();

// Step 1: Redirect user to Cal.com OAuth
app.use("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile", // Adjust scopes as needed
  });
  res.writeHead(302, { Location: `${authorizationUrl}?${params.toString()}` });
  res.end();
});

// Step 2: Handle OAuth callback and exchange code for token
app.use("/oauth/callback", async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = url.searchParams.get("code");
  if (!code) {
    res.statusCode = 400;
    res.end("Missing OAuth code");
    return;
  }

  try {
    const tokenRes = await fetch(tokenUrl, {
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

    // For demonstration, just respond with the tokens
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ tokens: tokenData }));
  } catch (err) {
    res.statusCode = 500;
    res.end("OAuth error: " + err.message);
  }
});

// Step 3: Proxy /v2 requests as before
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