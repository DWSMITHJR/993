const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Parse URL
    const parsedUrl = url.parse(req.url);
    // Extract URL path
    let pathname = path.join(BASE_DIR, parsedUrl.pathname);
    
    // If the path ends with /, look for index.html
    if (pathname.endsWith('/')) {
        pathname = path.join(pathname, 'index.html');
    }
    
    // Get the file extension
    const ext = path.parse(pathname).ext;
    
    // Check if file exists
    fs.exists(pathname, (exist) => {
        if (!exist) {
            // File not found
            res.statusCode = 404;
            res.end(`File ${pathname} not found!`);
            return;
        }

        // If it's a directory, look for index.html
        if (fs.statSync(pathname).isDirectory()) {
            pathname = path.join(pathname, 'index.html');
        }

        // Read file from file system
        fs.readFile(pathname, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end(`Error getting the file: ${err}.`);
            } else {
                // Set the content type based on the file extension
                const contentType = MIME_TYPES[ext] || 'application/octet-stream';
                res.setHeader('Content-type', contentType);
                
                // Set CORS headers
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET');
                
                // Send the file content
                res.end(data);
            }
        });
    });
});

server.listen(PORT, 'localhost', () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Serving files from: ${BASE_DIR}`);
    console.log('Press Ctrl+C to stop the server');
});
