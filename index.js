const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {
  const reqUrl = url.parse(req.url);

  // If the request is for the gateway page, return it
  if (reqUrl.pathname === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gateway</title>
    </head>
        <body>
          <h1>Welcome to the Gateway</h1>
          <p>To access the internet, enter a URL:</p>
          <form method="get" action="/browse">
            <input type="text" name="url">
            <button type="submit">Go</button>
          </form>
        </body>
      </html>
    `);
    res.end();
    return;
  }

  // If the request is for the browse page, proxy the request to the URL
  if (reqUrl.pathname === '/browse') {
    const targetUrl = reqUrl.query.url;
    if (!targetUrl) {
      res.writeHead(400, {'Content-Type': 'text/plain'});
      res.write('Error: Missing URL parameter');
      res.end();
      return;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (error) {
      res.writeHead(400, {'Content-Type': 'text/plain'});
      res.write('Error: Invalid URL format');
      res.end();
      return;
    }

    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    const requestOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: req.method,
      headers: req.headers
    };

    protocol.request(requestOptions, (targetRes) => {
      res.writeHead(targetRes.statusCode, targetRes.headers);
      targetRes.pipe(res);
    }).on('error', (error) => {
      res.writeHead(500, {'Content-Type': 'text/plain'});
      res.write(`Error: ${error.message}`);
      res.end();
    });

    return;
  }

  // If the request is for any other resource, return a 404 error
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.write('Error: Resource not found');
  res.end();
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
