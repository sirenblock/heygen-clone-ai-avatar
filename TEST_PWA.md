# PWA Testing Guide

## Quick Test Checklist

### ✅ Files Created
Run this command to verify all files exist:
```bash
ls -la public/ | grep -E "(manifest|service-worker|offline|icon|pwa|apple)"
```

Expected files:
- ✓ apple-touch-icon.png
- ✓ icon-192.png
- ✓ icon-512.png
- ✓ manifest.json
- ✓ offline.html
- ✓ pwa-mobile.css
- ✓ pwa-snippets.html
- ✓ pwa.js
- ✓ service-worker.js

### ✅ Validate Manifest
```bash
python3 -m json.tool public/manifest.json
```

### ✅ Test Locally

1. **Start a local server** (required for Service Workers):
   ```bash
   cd public
   python3 -m http.server 8080
   ```

2. **Open in browser**:
   ```
   http://localhost:8080
   ```

3. **Open DevTools** (F12 or Cmd+Option+I)

4. **Check Application Tab**:
   - **Manifest**: Should show "AI Avatar Studio" with icons
   - **Service Workers**: Should show registered worker
   - **Cache Storage**: Should populate after first load
   - **Storage**: Check "offline" mode to test

### ✅ Desktop PWA Tests

#### Chrome/Edge
1. Open DevTools → Application
2. Manifest section should show:
   - Name: "AI Avatar Studio - Create Realistic AI Videos"
   - Short name: "AI Avatar"
   - Theme color: #8B5CF6
   - Icons: 192x192 and 512x512
3. Service Workers should show:
   - Status: Activated and running
   - Source: /service-worker.js
4. Test offline:
   - Go to Network tab
   - Enable "Offline"
   - Refresh page
   - Should show offline.html

#### Install PWA Desktop
1. Look for install icon in address bar (⊕ icon)
2. Click to install
3. App should open in standalone window
4. Check Start Menu/Applications for "AI Avatar Studio"

### ✅ Lighthouse Audit

1. Open DevTools → Lighthouse
2. Select categories:
   - ✓ Performance
   - ✓ Accessibility
   - ✓ Best Practices
   - ✓ SEO
   - ✓ Progressive Web App
3. Click "Generate report"
4. Expected scores:
   - Performance: 90+
   - Accessibility: 95+
   - PWA: 90+

### ✅ Mobile Testing (iOS Safari)

1. **Open in Safari** on iPhone/iPad
2. **Tap Share button** (square with arrow)
3. **Scroll and tap "Add to Home Screen"**
4. **Edit name** if desired, tap "Add"
5. **Test the installed app**:
   - Find icon on home screen
   - Tap to open
   - Should run without Safari UI
   - Check navbar is hidden
   - Verify splash screen shows icon
6. **Test mobile features**:
   - Tap hamburger menu (☰)
   - Menu should slide out
   - Tap link to navigate
   - Scroll to generate section
   - Bottom action bar should be visible
   - Tap generate button should work

### ✅ Mobile Testing (Android Chrome)

1. **Open in Chrome** on Android
2. **Look for install banner** at bottom
3. **Tap "Install"** or use menu → "Install app"
4. **App should install** to home screen
5. **Open installed app**:
   - Launches in standalone mode
   - No browser UI
   - Full screen experience
6. **Test features**:
   - Navigation works
   - Forms are touch-friendly
   - Buttons meet 44px minimum
   - Bottom bar is accessible
   - Can go offline and still access

### ✅ Network Testing

#### Slow 3G Simulation
1. DevTools → Network
2. Select "Slow 3G" throttling
3. Refresh page
4. Should load from cache quickly

#### Offline Mode
1. DevTools → Network → Offline
2. Refresh page
3. Should show offline.html
4. Should display "You're Offline" message

#### Service Worker Caching
1. Load page first time
2. DevTools → Application → Cache Storage
3. Should see caches:
   - ai-avatar-studio-v2 (static assets)
   - ai-avatar-runtime-v2 (runtime cache)
4. Go offline
5. Navigate around - should still work

### ✅ Touch Target Testing (Mobile)

All interactive elements should meet WCAG minimum:
- Buttons: 44x44px minimum
- Links: 44px height minimum
- Form inputs: 44px height minimum
- Avatar cards: 100px height minimum

Test by tapping with finger - no precision required.

### ✅ Responsive Design Tests

#### Breakpoints to test:
- 1920px (Desktop)
- 1024px (Tablet)
- 768px (Tablet/Large phone)
- 480px (Phone)
- 375px (iPhone SE)
- 360px (Small Android)

#### What to check:
- Mobile menu appears < 768px
- Logo text hides < 480px
- Bottom action bar appears < 768px
- Desktop generate button hides on mobile
- Touch targets are adequate
- No horizontal scroll
- Content readable without zoom

### ✅ iOS Specific Tests

1. **Safari viewport**:
   - No zoom on form focus
   - Inputs use 16px font minimum
   - viewport-fit=cover handles notch

2. **Home screen icon**:
   - 180x180px icon shows correctly
   - App title is "AI Avatar"
   - No Safari UI when launched

3. **Status bar**:
   - Status bar style is black-translucent
   - Content doesn't hide behind status bar

4. **Safe areas**:
   - Content respects notch
   - Bottom bar above home indicator

### ✅ Performance Checks

Run in DevTools → Performance:
- First Contentful Paint < 2s
- Time to Interactive < 3.5s
- Speed Index < 3.5s

Check in DevTools → Coverage:
- Unused CSS < 30%
- Unused JS < 30%

### ✅ Accessibility Tests

1. **Keyboard navigation**:
   - Tab through all interactive elements
   - Focus indicators visible
   - No keyboard traps

2. **Screen reader**:
   - VoiceOver (iOS/Mac)
   - TalkBack (Android)
   - All images have alt text
   - All buttons have labels

3. **Color contrast**:
   - Text meets WCAG AA (4.5:1)
   - Interactive elements distinguishable

## Common Issues & Solutions

### Issue: Service Worker Not Registering
**Solution**:
- Must use HTTPS or localhost
- Check console for errors
- Verify service-worker.js is accessible

### Issue: Install Prompt Not Showing
**Solution**:
- Visit site at least twice
- Clear localStorage to reset dismiss state
- Check PWA criteria are met
- Wait 5 minutes between visits

### Issue: Offline Page Not Loading
**Solution**:
- Check offline.html is in cache
- Verify service worker is active
- Check fetch event handler
- Clear all caches and retry

### Issue: Icons Not Showing
**Solution**:
- Verify PNG files generated correctly
- Check manifest.json paths
- Clear browser cache
- Regenerate icons if needed

### Issue: Mobile Menu Not Working
**Solution**:
- Check pwa.js is loaded
- Verify element IDs match
- Check console for JS errors
- Test in private/incognito mode

## Success Criteria

Your PWA is ready when:
- ✓ Lighthouse PWA score is 90+
- ✓ Installs on both iOS and Android
- ✓ Works offline
- ✓ Service worker caches correctly
- ✓ Mobile navigation functions
- ✓ Touch targets meet 44px minimum
- ✓ Loads quickly on slow networks
- ✓ No console errors
- ✓ Icons display correctly
- ✓ Manifest is valid

## Next Steps After Testing

1. **Deploy to HTTPS domain** (PWAs require HTTPS in production)
2. **Test on real devices** (iOS, Android)
3. **Monitor with analytics** (track installs, usage)
4. **Add push notifications** (requires backend)
5. **Implement background sync** (for offline video queue)
6. **Add app shortcuts** (quick actions from home screen)
7. **Create splash screens** (for better install experience)

## Resources

- Test Manifest: https://manifest-validator.appspot.com/
- PWA Builder: https://www.pwabuilder.com/
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- Can I Use: https://caniuse.com/serviceworkers
