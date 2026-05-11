// netlify/functions/price.js
const https = require('https');

exports.handler = async () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'stooq.com',
      path: '/q/l/?s=gc.f&f=sd2t2ohlcv&h&e=csv',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/plain,*/*',
      }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' },
        body: data
      }));
    }).on('error', e => resolve({
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: e.message
    }));
  });
};
