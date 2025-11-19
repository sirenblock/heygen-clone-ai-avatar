# Cache Headers Configuration Guide

## AI Avatar Studio - HTTP Caching Strategy

This document provides the recommended cache headers configuration for optimal performance and user experience.

---

## 🎯 Caching Strategy Overview

Our caching strategy uses a combination of:
1. **Service Worker** - Client-side caching
2. **HTTP Cache Headers** - Browser caching
3. **CDN Caching** - Edge caching (optional)

---

## 📋 Recommended Cache Headers

### 1. **HTML Files** (index.html, index-optimized.html)

```
Cache-Control: no-cache, must-revalidate
ETag: "unique-version-hash"
Content-Type: text/html; charset=utf-8
```

**Rationale:**
- Always check server for updates
- Use ETag for conditional requests
- Prevents stale HTML from being served

---

### 2. **CSS Files** (styles.css, styles.min.css)

```
Cache-Control: public, max-age=31536000, immutable
Content-Type: text/css
Content-Encoding: br
ETag: "css-version-hash"
```

**Rationale:**
- Long cache duration (1 year)
- `immutable` prevents revalidation
- Use versioning/hashing in filenames for cache busting
- Brotli compression for smaller file size

**Example with versioning:**
```html
<link rel="stylesheet" href="styles.min.css?v=1.2.3">
<!-- or -->
<link rel="stylesheet" href="styles.min.abc123.css">
```

---

### 3. **JavaScript Files** (app.js, app.min.js)

```
Cache-Control: public, max-age=31536000, immutable
Content-Type: application/javascript; charset=utf-8
Content-Encoding: br
ETag: "js-version-hash"
```

**Rationale:**
- Long cache duration with immutable flag
- Compress with Brotli or Gzip
- Version URLs for cache invalidation

---

### 4. **Service Worker** (service-worker.js)

```
Cache-Control: no-cache, must-revalidate, max-age=0
Content-Type: application/javascript; charset=utf-8
```

**Rationale:**
- Never cache service worker
- Always fetch latest version
- Ensures users get updates immediately

**Important:** Service workers have their own cache API and shouldn't be cached by the browser.

---

### 5. **Images & Media**

```
Cache-Control: public, max-age=31536000, immutable
Content-Type: image/png (or appropriate type)
Content-Encoding: br
```

**For dynamically generated images/videos:**
```
Cache-Control: public, max-age=86400
Content-Type: video/mp4 (or appropriate type)
```

**Rationale:**
- Static assets: Long cache (1 year)
- Dynamic content: Shorter cache (1 day)

---

### 6. **Fonts** (if using web fonts)

```
Cache-Control: public, max-age=31536000, immutable
Content-Type: font/woff2
Access-Control-Allow-Origin: *
```

**Rationale:**
- Fonts rarely change
- CORS header for cross-origin requests
- woff2 format for best compression

---

### 7. **API Responses**

```
# For dynamic data:
Cache-Control: no-store, no-cache, must-revalidate
Content-Type: application/json

# For rarely changing data:
Cache-Control: public, max-age=300
Content-Type: application/json
ETag: "api-response-hash"
```

**Rationale:**
- Dynamic data: No caching
- Static data: Short cache (5 minutes)
- Use ETags for conditional requests

---

## 🔧 Server Configuration Examples

### **Nginx Configuration**

```nginx
# /etc/nginx/nginx.conf or site config

server {
    listen 80;
    server_name yourdomain.com;

    # Enable Brotli compression
    brotli on;
    brotli_comp_level 6;
    brotli_types text/plain text/css application/javascript application/json image/svg+xml;

    # Enable Gzip fallback
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_comp_level 6;

    # HTML files - no cache
    location ~* \.html$ {
        add_header Cache-Control "no-cache, must-revalidate";
        add_header X-Content-Type-Options "nosniff";
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block";
    }

    # CSS & JS - long cache with immutable
    location ~* \.(css|js)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options "nosniff";
    }

    # Service Worker - never cache
    location /service-worker.js {
        add_header Cache-Control "no-cache, must-revalidate, max-age=0";
        add_header Service-Worker-Allowed "/";
    }

    # Images, fonts, media - long cache
    location ~* \.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|ico|mp4|webm)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin "*";
    }

    # API routes - no cache
    location /api/ {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        add_header Pragma "no-cache";
        proxy_pass http://localhost:8000;
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

---

### **Apache Configuration**

```apache
# .htaccess or httpd.conf

# Enable mod_headers and mod_expires
<IfModule mod_headers.c>
    <IfModule mod_expires.c>

        # HTML - no cache
        <FilesMatch "\.(html)$">
            Header set Cache-Control "no-cache, must-revalidate"
            Header set X-Content-Type-Options "nosniff"
        </FilesMatch>

        # CSS & JavaScript - long cache
        <FilesMatch "\.(css|js)$">
            Header set Cache-Control "public, max-age=31536000, immutable"
            ExpiresActive On
            ExpiresDefault "access plus 1 year"
        </FilesMatch>

        # Service Worker - never cache
        <Files "service-worker.js">
            Header set Cache-Control "no-cache, must-revalidate, max-age=0"
            Header set Service-Worker-Allowed "/"
        </Files>

        # Images & Fonts - long cache
        <FilesMatch "\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|ico)$">
            Header set Cache-Control "public, max-age=31536000, immutable"
            Header set Access-Control-Allow-Origin "*"
            ExpiresActive On
            ExpiresDefault "access plus 1 year"
        </FilesMatch>

        # Videos - shorter cache
        <FilesMatch "\.(mp4|webm)$">
            Header set Cache-Control "public, max-age=86400"
            ExpiresActive On
            ExpiresDefault "access plus 1 day"
        </FilesMatch>

    </IfModule>
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json image/svg+xml
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>
```

---

### **Node.js/Express Configuration**

```javascript
const express = require('express');
const compression = require('compression');
const app = express();

// Enable compression
app.use(compression());

// HTML - no cache
app.use('*.html', (req, res, next) => {
    res.set('Cache-Control', 'no-cache, must-revalidate');
    res.set('X-Content-Type-Options', 'nosniff');
    next();
});

// CSS & JS - long cache
app.use(/\.(css|js)$/, (req, res, next) => {
    if (!req.path.includes('service-worker')) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    next();
});

// Service Worker - never cache
app.use('/service-worker.js', (req, res, next) => {
    res.set('Cache-Control', 'no-cache, must-revalidate, max-age=0');
    res.set('Service-Worker-Allowed', '/');
    next();
});

// Static files with long cache
app.use(express.static('public', {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.set('Cache-Control', 'no-cache');
        }
    }
}));

// Security headers
app.use((req, res, next) => {
    res.set('X-Frame-Options', 'SAMEORIGIN');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
```

---

## 📊 Cache Strategy Matrix

| Resource Type | Cache Duration | Revalidation | Versioning Required |
|--------------|----------------|--------------|---------------------|
| HTML | No cache | Always | No |
| CSS (versioned) | 1 year | Never (immutable) | Yes |
| JS (versioned) | 1 year | Never (immutable) | Yes |
| Service Worker | No cache | Always | No |
| Images (static) | 1 year | Never | Optional |
| Videos (generated) | 1 day | On expiry | No |
| Fonts | 1 year | Never | Optional |
| API responses | No cache / 5 min | Always / On expiry | No |

---

## 🔍 Testing Cache Headers

### Using cURL:
```bash
# Test HTML caching
curl -I https://yourdomain.com/index.html

# Test CSS caching
curl -I https://yourdomain.com/styles.min.css

# Test Service Worker caching
curl -I https://yourdomain.com/service-worker.js
```

### Using Chrome DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Check headers for each resource
5. Verify "Cache-Control" header values

### Online Tools:
- **WebPageTest:** https://www.webpagetest.org
- **GTmetrix:** https://gtmetrix.com
- **KeyCDN Cache Checker:** https://tools.keycdn.com/curl

---

## 🚨 Common Pitfalls to Avoid

### ❌ DON'T:
1. Cache service-worker.js - Users won't get updates
2. Use long cache without versioning - Can't invalidate
3. Set "max-age=0" for static assets - Wastes bandwidth
4. Forget ETags for conditionally cached resources
5. Skip compression - Larger files = slower loads

### ✅ DO:
1. Version or hash CSS/JS filenames
2. Use `immutable` for versioned assets
3. Enable compression (Brotli > Gzip)
4. Test cache behavior after deployment
5. Monitor cache hit rates

---

## 📈 Expected Performance Gains

With proper cache headers:
- **Returning visitors:** 70-90% faster load times
- **Bandwidth savings:** 60-80% reduction
- **Server load:** 50-70% reduction
- **Lighthouse score:** +10-15 points

---

## 🔄 Cache Invalidation Strategy

### For CSS/JS Updates:
1. **Versioning in URL:**
   ```html
   <link href="styles.min.css?v=1.2.4">
   <script src="app.min.js?v=1.2.4">
   ```

2. **Hash-based filenames:**
   ```bash
   styles.abc123def.min.css
   app.xyz789uvw.min.js
   ```

### For Service Worker Updates:
- Service worker updates automatically on navigation
- Update version in service-worker.js to force cache clear
- Test update process before deployment

---

## 📝 Deployment Checklist

Before going live with cache headers:

- [ ] Configure server with appropriate cache headers
- [ ] Enable compression (Brotli/Gzip)
- [ ] Version CSS and JS files
- [ ] Test cache behavior with DevTools
- [ ] Verify service worker isn't cached
- [ ] Test cache invalidation process
- [ ] Monitor cache hit rates
- [ ] Set up alerts for cache misses
- [ ] Document versioning process for team

---

## 📞 Support & Troubleshooting

### Common Issues:

**Issue:** Users seeing old content
- **Solution:** Check HTML cache headers, ensure no-cache is set

**Issue:** Service worker not updating
- **Solution:** Verify service-worker.js has no-cache header

**Issue:** CSS/JS not updating
- **Solution:** Update version number or hash in filename

---

## 📚 Additional Resources

- [MDN: HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Google: HTTP Caching Best Practices](https://web.dev/http-cache/)
- [Cloudflare: Cache Control](https://developers.cloudflare.com/cache/about/cache-control/)

---

**Last Updated:** 2025-01-XX
**Version:** 1.0
**Maintained by:** AI Avatar Studio Team
