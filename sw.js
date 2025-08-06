// VIN NESIA Service Worker - Sesuai dengan index.html
const CACHE_NAME = 'vinnesia-cache-v1.0.0';
const STATIC_CACHE = 'vinnesia-static-v1.0.0';
const DYNAMIC_CACHE = 'vinnesia-dynamic-v1.0.0';

// Assets yang ada di index.html untuk di-cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/images/logo-vinnesia.png',
  // Pages yang ada di navigasi
  '/donate',
  '/tools', 
  '/blog',
  '/about',
  '/user-guide',
  '/privacy-policy',
  '/terms-of-service',
  '/sitemap',
  '/how-to-use',
  '/faq',
  '/contact',
  // External resources dari HTML
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap',
  'https://cdn.tailwindcss.com'
];

// Tool domains yang terhubung (dari allToolsData di HTML)
const TOOL_DOMAINS = [
  'https://password.vinnesia.my.id/',
  'https://scan.vinnesia.my.id/',
  'https://image.vinnesia.my.id/',
  'https://currency.vinnesia.my.id/',
  'https://qr.vinnesia.my.id/',
  'https://json.vinnesia.my.id/'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('VIN NESIA SW: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('VIN NESIA SW: Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('VIN NESIA SW: Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('VIN NESIA SW: Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('VIN NESIA SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('VIN NESIA SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('VIN NESIA SW: Activated successfully');
        return self.clients.claim();
      })
      .catch(error => {
        console.error('VIN NESIA SW: Activation failed:', error);
      })
  );
});

// Fetch event - handle requests berdasarkan struktur HTML
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle berbagai jenis request sesuai dengan HTML
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('VIN NESIA SW: Serving from cache:', request.url);
          return cachedResponse;
        }

        // Handle external tool domains (dari allToolsData)
        if (TOOL_DOMAINS.some(domain => request.url.startsWith(domain))) {
          return fetch(request)
            .catch(() => {
              // Return tool offline page
              return new Response(
                createToolOfflinePage(),
                { headers: { 'Content-Type': 'text/html' } }
              );
            });
        }

        // Fetch from network dan cache responsenya
        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response for caching
            const responseToCache = response.clone();
            
            // Cache dynamic content
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                // Add timestamp header
                const headers = new Headers(responseToCache.headers);
                headers.set('sw-cached-time', Date.now().toString());
                
                const modifiedResponse = new Response(responseToCache.body, {
                  status: responseToCache.status,
                  statusText: responseToCache.statusText,
                  headers: headers
                });
                
                console.log('VIN NESIA SW: Caching dynamic content:', request.url);
                cache.put(request, modifiedResponse);
              })
              .catch(error => {
                console.error('VIN NESIA SW: Failed to cache dynamic content:', error);
              });

            return response;
          })
          .catch(error => {
            console.error('VIN NESIA SW: Network request failed:', error);
            
            // Return offline page untuk navigation requests
            if (request.destination === 'document') {
              return new Response(
                createMainOfflinePage(),
                { headers: { 'Content-Type': 'text/html' } }
              );
            }
            
            throw error;
          });
      })
  );
});

// Function untuk membuat halaman offline utama (sesuai style HTML)
function createMainOfflinePage() {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VIN NESIA - Offline</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
    <style>
      :root {
        --bg-dark: #120a16;
        --card-dark: #1e1123;
        --text-main: #f1f1f5;
        --text-muted: #b5bacb;
        --primary-red: #e34242;
        --primary-gold: #ffd700;
      }
      
      body {
        margin: 0;
        padding: 0;
        font-family: 'Poppins', sans-serif;
        background: var(--bg-dark);
        color: var(--text-main);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .offline-container {
        max-width: 500px;
        margin: 0 auto;
        padding: 3rem 2rem;
        background: var(--card-dark);
        border-radius: 1.5rem;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        text-align: center;
      }
      
      .logo-section {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 2rem;
      }
      
      .logo {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, var(--primary-red) 60%, var(--primary-gold) 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
      }
      
      .brand-name {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary-red);
      }
      
      h1 {
        color: var(--primary-red);
        margin-bottom: 1rem;
        font-size: 2rem;
        font-weight: 600;
      }
      
      p {
        color: var(--text-muted);
        margin-bottom: 2rem;
        line-height: 1.6;
        font-size: 1.1rem;
      }
      
      .retry-btn {
        background: linear-gradient(135deg, var(--primary-red) 60%, var(--primary-gold) 100%);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 2rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 1rem;
        transition: transform 0.2s ease;
        font-family: inherit;
      }
      
      .retry-btn:hover {
        transform: translateY(-2px);
      }
      
      .features {
        margin-top: 2rem;
        text-align: left;
      }
      
      .feature {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
        color: var(--text-muted);
      }
      
      .feature-icon {
        font-size: 1.2rem;
      }
    </style>
  </head>
  <body>
    <div class="offline-container">
      <div class="logo-section">
        <div class="logo">🛠️</div>
        <span class="brand-name">VIN NESIA</span>
      </div>
      
      <h1>You're Offline</h1>
      <p>VIN NESIA tools are currently unavailable. Please check your internet connection to access our free productivity tools.</p>
      
      <button class="retry-btn" onclick="window.location.reload()">🔄 Try Again</button>
      
      <div class="features">
        <div class="feature">
          <span class="feature-icon">🔲</span>
          <span>QR Code Generator</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🔑</span>
          <span>Password Generator</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🗜️</span>
          <span>Image Compressor</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🧩</span>
          <span>JSON Formatter</span>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

// Function untuk membuat halaman offline tools
function createToolOfflinePage() {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tool Offline - VIN NESIA</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
    <style>
      body {
        font-family: 'Poppins', sans-serif;
        background: #120a16;
        color: #f1f1f5;
        text-align: center;
        padding: 2rem;
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .container {
        max-width: 400px;
        padding: 2rem;
        background: #1e1123;
        border-radius: 1.5rem;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      }
      h1 { color: #e34242; margin-bottom: 1rem; }
      p { color: #b5bacb; margin-bottom: 1.5rem; }
      .btn {
        background: linear-gradient(135deg, #e34242 60%, #ffd700 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 2rem;
        cursor: pointer;
        font-weight: 600;
        text-decoration: none;
        display: inline-block;
        margin: 0.5rem;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🔧 Tool Offline</h1>
      <p>This tool is currently unavailable. Please check your connection or return to the main page.</p>
      <a href="/" class="btn">🏠 Back to Home</a>
      <button class="btn" onclick="window.location.reload()">🔄 Retry</button>
    </div>
  </body>
  </html>
  `;
}

// Background sync untuk newsletter (sesuai form di HTML)
self.addEventListener('sync', event => {
  if (event.tag === 'newsletter-subscription') {
    console.log('VIN NESIA SW: Processing newsletter subscription');
    event.waitUntil(processNewsletterSubscription());
  }
});

function processNewsletterSubscription() {
  return new Promise((resolve) => {
    // Handle newsletter subscription yang tersimpan saat offline
    console.log('VIN NESIA SW: Newsletter subscription processed');
    resolve();
  });
}

// Push notifications untuk update tools baru
self.addEventListener('push', event => {
  console.log('VIN NESIA SW: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New tools and updates available on VIN NESIA!',
    icon: '/images/logo-vinnesia.png',
    badge: '/images/logo-vinnesia.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open Tools',
        icon: '/images/logo-vinnesia.png'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    tag: 'vinnesia-update'
  };

  event.waitUntil(
    self.registration.showNotification('VIN NESIA Tools Update', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('VIN NESIA SW: Notification clicked');
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/tools')
    );
  }
});

// Message handling untuk komunikasi dengan main thread
self.addEventListener('message', event => {
  console.log('VIN NESIA SW: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Cache additional URLs (misalnya saat user menggunakan search)
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then(cache => cache.addAll(event.data.urls))
    );
  }

  // Handle language change caching
  if (event.data && event.data.type === 'LANGUAGE_CHANGED') {
    console.log('VIN NESIA SW: Language changed to:', event.data.lang);
    // Could cache language-specific resources here
  }
});

// Cache cleanup untuk menghapus cache lama
function cleanupOldCaches() {
  return caches.open(DYNAMIC_CACHE)
    .then(cache => {
      return cache.keys().then(requests => {
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 hari
        
        return Promise.all(
          requests.map(request => {
            return cache.match(request).then(response => {
              const cachedTime = response.headers.get('sw-cached-time');
              if (cachedTime && (now - parseInt(cachedTime)) > maxAge) {
                console.log('VIN NESIA SW: Removing old cache entry:', request.url);
                return cache.delete(request);
              }
            });
          })
        );
      });
    });
}

// Periodic background sync (jika didukung browser)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cache-cleanup') {
    console.log('VIN NESIA SW: Periodic cache cleanup');
    event.waitUntil(cleanupOldCaches());
  }
});
