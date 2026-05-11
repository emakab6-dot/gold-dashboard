// netlify/functions/cme.js
// Proxy CME Group avec les vraies URLs découvertes via Network Inspector

const https = require('https');

function httpsGet(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.cmegroup.com/markets/metals/precious/gold.quotes.options.html',
        'Origin': 'https://www.cmegroup.com',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

exports.handler = async (event) => {
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const type = event.queryStringParameters?.type || 'futures';
  const now  = Date.now();

  try {
    let result = {};

    if (type === 'futures') {
      // GC Jun 2026 futures — vraie URL CME v2
      const r = await httpsGet(`https://www.cmegroup.com/CmeWS/mvc/quotes/v2/437/GCM6?isProtected&_t=${now}`);
      const d = JSON.parse(r.body);
      // Cherche le prix et OI dans la réponse
      result = { raw: d, status: r.status };
    }

    else if (type === 'options_atm') {
      // Options ATM Gold — product 192, expiry May 2026
      const r = await httpsGet(`https://www.cmegroup.com/CmeWS/mvc/atm/strike-prices/192/2026/5/ATM?isProtected&_t=${now}`);
      result = { raw: JSON.parse(r.body), status: r.status };
    }

    else if (type === 'options_all') {
      // Toutes les options via quotes-by-symbol
      const r = await httpsGet(`https://www.cmegroup.com/CmeWS/mvc/quotes/v2/quotes-by-symbol?isProtected&_t=${now}`);
      result = { raw: JSON.parse(r.body), status: r.status };
    }

    else if (type === 'contracts') {
      // Contrats par numéro
      const r = await httpsGet(`https://www.cmegroup.com/CmeWS/mvc/quotes/v2/contracts-by-number?isProtected&_t=${now}`);
      result = { raw: JSON.parse(r.body), status: r.status };
    }

    else if (type === 'gc_oi') {
      // OI Futures GC — ancienne API qui marchait
      const r = await httpsGet(`https://www.cmegroup.com/CmeWS/mvc/Quotes/Future/437/G?_t=${now}`);
      result = { raw: JSON.parse(r.body), status: r.status };
    }

    else if (type === 'opts_oi') {
      // OI Options GC — product 444
      const r = await httpsGet(`https://www.cmegroup.com/CmeWS/mvc/Quotes/Option/444/G/ALL?_t=${now}`);
      result = { raw: JSON.parse(r.body), status: r.status };
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(result)
    };

  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: e.message })
    };
  }
};
