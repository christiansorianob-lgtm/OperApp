// Configuration
const HOST = 'localhost';
const PORT = 3000;
const PATH = '/api/v1/mobile/login';

function makeRequest(method, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path: PATH,
            method: method,
            headers: {
                'Origin': 'http://localhost:8081', // Simulate mobile app origin (or null)
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type',
            }
        };

        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        console.log(`\n--- Testing ${method} ---`);
        const req = require('http').request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS:`, JSON.stringify(res.headers, null, 2));

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data) console.log(`BODY: ${data.substring(0, 200)}...`);
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
    try {
        // 1. Test OPTIONS (Preflight)
        const optionsRes = await makeRequest('OPTIONS');

        if (optionsRes.headers['access-control-allow-origin'] || optionsRes.statusCode === 200) {
            console.log("✅ OPTIONS test passed (CORS headers present/200 OK)");
        } else {
            console.log("❌ OPTIONS test failed (Missing CORS headers or non-200 status)");
        }

        // 2. Test POST (Actual Login - invalid creds to just check connectivity)
        const postBody = JSON.stringify({ phone: '1234567890', password: 'test' });
        const postRes = await makeRequest('POST', postBody);

        if (postRes.statusCode !== 405) {
            console.log(`✅ POST test passed (Status ${postRes.statusCode} != 405)`);
        } else {
            console.log("❌ POST test failed (Still returning 405)");
        }

    } catch (e) {
        console.error("Test execution failed:", e);
    }
}

runTests();
