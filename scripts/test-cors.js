const https = require('https');

const HOST = 'oper-app.vercel.app';
const PORT = 443;

function makeRequest(path, method, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Origin': 'http://localhost:8081',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type',
            }
        };

        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        console.log(`\n--- Testing ${method} ${path} ---`);
        const req = https.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            // console.log(`HEADERS:`, JSON.stringify(res.headers, null, 2));
            if (res.headers['access-control-allow-origin']) {
                console.log("✅ CORS Headers Present");
            } else {
                console.log("❌ CORS Headers MISSING");
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data && data.length < 500) console.log(`BODY: ${data}`);
                resolve(res);
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            reject(e);
        });

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

async function runTests() {
    console.log("Starting connectivity tests...");

    // 1. Test Direct Public Route
    await makeRequest('/api/public/login', 'OPTIONS');
    await makeRequest('/api/public/login', 'POST', JSON.stringify({ phone: '123', password: 'test' }));

    // 2. Test Rewrite Route
    await makeRequest('/api/v1/mobile/login', 'OPTIONS');
    await makeRequest('/api/v1/mobile/login', 'POST', JSON.stringify({ phone: '123', password: 'test' }));
}

runTests();
