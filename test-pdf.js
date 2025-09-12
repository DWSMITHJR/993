const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PDF_PATH = path.join(__dirname, 'images', 'inside', 'window.pdf');

const server = http.createServer((req, res) => {
    if (req.url === '/test-pdf') {
        fs.readFile(PDF_PATH, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Error reading PDF: ${err.message}`);
                return;
            }
            
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Length': data.length,
                'Content-Disposition': 'inline; filename=window.pdf',
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(data);
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>PDF Test Server</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                    .container { max-width: 800px; margin: 0 auto; }
                    iframe { width: 100%; height: 600px; border: 1px solid #ddd; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>PDF Test Server</h1>
                    <p>Testing PDF accessibility...</p>
                    <h2>Direct Link</h2>
                    <p><a href="/test-pdf" target="_blank">Open PDF in new tab</a></p>
                    <h2>Iframe</h2>
                    <iframe src="/test-pdf"></iframe>
                </div>
            </body>
            </html>
        `);
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Testing PDF at: ${PDF_PATH}`);
});
