const http = require("http");
const connect = require("connect");
const { createProxyMiddleware } = require("http-proxy-middleware");

const targetPort = process.env.API_PORT || 3000;

const apiProxyV2 = createProxyMiddleware({
  target: `http://localhost:${targetPort}`,
  changeOrigin: true
});

const app = connect();
app.use("/v2", apiProxyV2);

app.use((req, res) => {
  res.statusCode = 404;
  res.end("Not found");
});

const port = process.env.PORT || 8080;
http.createServer(app).listen(port, () => {
  console.log(`Proxy for /v2 listening on port ${port}, forwarding to v2 API on port ${targetPort}`);
});