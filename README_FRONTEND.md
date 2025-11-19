# AI Avatar Studio - Frontend

This is the web interface for the AI Avatar Platform (HeyGen Clone).

## 🎨 Features

- **Modern UI**: Beautiful, responsive interface with gradient design
- **Video Generation**: Create AI avatar videos from text scripts
- **Avatar Selection**: Choose from multiple avatar options or upload custom
- **Voice Synthesis**: Multiple voice options with ElevenLabs integration
- **Real-time Progress**: Live progress tracking during video generation
- **Download & Share**: Download generated videos or share via link

## 📁 File Structure

```
public/
├── index.html      # Main HTML file
├── styles.css      # All styles and animations
├── app.js          # Core application logic
└── api-config.js   # API configuration
```

## 🚀 Deployment

### Vercel (Recommended for Frontend)

The frontend is deployed to Vercel and serves the static web interface:

```bash
# Deploy to Vercel
vercel --prod
```

**Live URL**: `https://heygen-clone-ai-avatar.vercel.app`

### Backend Deployment

The frontend requires a backend API to function. Deploy the Python backend separately:

**Recommended Options:**
1. **Railway**: https://railway.app (Easy Python deployment)
2. **Render**: https://render.com (Free tier available)
3. **AWS Lambda**: Serverless deployment
4. **Google Cloud Run**: Container-based deployment
5. **Your own server**: VPS with Docker

After deploying the backend, update the API URL in [public/api-config.js](public/api-config.js:10):

```javascript
production: 'https://your-backend-url.com'
```

## 🧪 Demo Mode

You can test the UI without a backend by adding `?demo=true` to the URL:

```
https://heygen-clone-ai-avatar.vercel.app?demo=true
```

In demo mode:
- Uses simulated progress
- Shows sample video on completion
- No actual API calls are made

## 🎯 Key Components

### 1. Avatar Selection
- Grid of pre-built avatars
- Upload custom avatar option
- Active state highlighting

### 2. Voice Selection
- Dropdown with multiple voice options
- Voice preview functionality
- Custom voice cloning

### 3. Script Editor
- Large textarea for script input
- Word count and duration estimation
- Validation for minimum length

### 4. Advanced Options
- Video quality selection (720p, 1080p, 4K)
- Background options
- Speaking speed control

### 5. Progress Tracking
- Percentage indicator
- Progress bar animation
- Step-by-step visualization:
  - 🎤 Synthesizing Voice
  - 👄 Syncing Lips
  - 🎥 Rendering Video
  - ✨ Finalizing

### 6. Video Preview & Download
- HTML5 video player
- Download button
- Share link generation
- Create new video option

## 🔧 Configuration

### API Integration

The app communicates with the backend via REST API:

```javascript
// POST /api/generate
{
  "script": "Your text here",
  "avatar_id": "default",
  "voice_id": "rachel",
  "quality": "1080p",
  "background": "default",
  "speed": 1.0
}

// GET /api/status/{job_id}
// GET /api/download/{job_id}
```

### Environment Detection

The app automatically detects the environment:
- `localhost` → Uses `http://localhost:8000`
- Production → Uses configured production URL

## 🎨 Design System

### Colors
- Primary: `#8B5CF6` (Purple)
- Secondary: `#EC4899` (Pink)
- Dark: `#0F172A`
- Gradient: Purple to Pink diagonal

### Typography
- Font: System fonts (-apple-system, Segoe UI, Roboto)
- Headings: 700-800 weight
- Body: 400-500 weight

### Components
- Border radius: 8-24px
- Transitions: 0.3s ease
- Hover effects: Transform + box-shadow
- Glassmorphism: backdrop-filter blur

## 📱 Responsive Design

The interface adapts to different screen sizes:

- **Desktop** (>768px): Full grid layout
- **Mobile** (<768px): Stacked single column

Key breakpoints:
```css
@media (max-width: 768px) {
  /* Mobile styles */
}
```

## 🔗 API Endpoints

The frontend expects these backend endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | Start video generation |
| `/api/status/{job_id}` | GET | Check generation status |
| `/api/download/{job_id}` | GET | Download video file |
| `/api/avatars/train` | POST | Upload custom avatar |
| `/api/voices/clone` | POST | Clone custom voice |
| `/api/health` | GET | Backend health check |

## 🚨 Error Handling

The app handles various error scenarios:
- Empty script validation
- Network errors with retry
- Backend failures with notifications
- Upload errors

Notifications appear in the top-right corner with appropriate colors:
- 🔵 Info: Purple
- ✅ Success: Green
- ❌ Error: Red

## 🔄 State Management

Simple state management without frameworks:

```javascript
let currentJob = null;       // Current generation job ID
let selectedAvatar = 'default';  // Selected avatar ID
let selectedVoice = 'rachel';    // Selected voice ID
```

## 📊 Progress Polling

The app polls for job status every 2 seconds:

```javascript
setInterval(async () => {
  const status = await fetch(`/api/status/${jobId}`);
  updateProgress(status);
}, 2000);
```

## 🎬 Next Steps

1. **Deploy Backend**: Choose a backend hosting solution
2. **Update API URL**: Configure production API endpoint
3. **Add Analytics**: Track user interactions
4. **Add Authentication**: User accounts and history
5. **Add Billing**: Payment integration for credits
6. **Add Templates**: Pre-built script templates
7. **Add Export Options**: Multiple video formats

## 💡 Tips

- The UI works standalone but requires backend for actual generation
- Use demo mode for testing UI/UX without backend
- Update `api-config.js` before deploying to production
- Consider adding a loading state for avatar uploads
- Implement proper error boundaries for production

## 📝 License

Same as parent project - see main [README.md](README.md)
