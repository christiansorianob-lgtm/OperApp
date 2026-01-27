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

    // 1. Test Hijacked Hello Route (Critical)
    await makeRequest('/api/hello', 'OPTIONS');
    await makeRequest('/api/hello', 'POST', JSON.stringify({ phone: '123', password: 'test' })); // Should get 401 (Credenciales incorrectas) or 200
    await makeRequest('/api/hello', 'GET'); // Should get 200

    // 2. Test Rewrite Path (App uses this)
    await makeRequest('/api/v1/mobile/login', 'POST', JSON.stringify({ phone: '123', password: 'test' }));
}

runTests();
