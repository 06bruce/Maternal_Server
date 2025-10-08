const https = require('https');

/**
 * Keep-alive utility to prevent Render free tier from sleeping
 * Pings the health endpoint every 14 minutes
 */
function startKeepAlive(url) {
  const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds
  
  const ping = () => {
    const healthUrl = `${url}/health`;
    
    https.get(healthUrl, (res) => {
      console.log(`✅ Keep-alive ping successful: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('❌ Keep-alive ping failed:', err.message);
    });
  };

  // Initial ping after 1 minute
  setTimeout(ping, 60000);
  
  // Then ping every 14 minutes
  setInterval(ping, PING_INTERVAL);
  
  console.log('🔄 Keep-alive service started (pinging every 14 minutes)');
}

module.exports = { startKeepAlive };
