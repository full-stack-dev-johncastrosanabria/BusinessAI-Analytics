# Automatic Video Recording Guide

**[🎥 See Example: Latest Demo on YouTube](https://youtu.be/i_TPjHsoOHE)** - 4-minute complete platform demonstration

## Quick Start

### 1. Start All Services
```bash
# Terminal 1: MySQL
./scripts/start-mysql.sh

# Terminal 2: All microservices
./scripts/start-all.sh

# Terminal 3: AI service
cd ai-service
python app.py

# Terminal 4: Frontend
cd frontend
npm run dev
```

### 2. Run Automatic Recording
```bash
npm run demo:video
```

### 3. Get Your Video
Video will be saved to: `./recordings/`

## What Happens

1. **Playwright launches** - Browser opens in fullscreen (1920x1080)
2. **Recording starts automatically** - No manual recording needed
3. **Demo runs** - All features demonstrated (4-5 minutes)
4. **Recording saves** - Video file saved to `./recordings/`
5. **Browser closes** - Demo complete

## Video Details

- **Format:** WebM (Playwright native format)
- **Resolution:** 1920x1080 (Full HD)
- **Duration:** 4-5 minutes
- **Location:** `./recordings/` directory
- **Filename:** Timestamped (e.g., `video-2024-01-15-14-30-45.webm`)

## Converting to MP4 (for YouTube)

### Install ffmpeg (if needed)
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### Convert WebM to MP4
```bash
# High quality (recommended for YouTube)
ffmpeg -i recordings/your-video.webm -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 192k demo-video.mp4

# Fast conversion (lower quality)
ffmpeg -i recordings/your-video.webm -c:v libx264 -preset fast -crf 28 demo-video.mp4

# Maximum quality (larger file)
ffmpeg -i recordings/your-video.webm -c:v libx264 -preset veryslow -crf 18 -c:a aac -b:a 320k demo-video.mp4
```

### Batch Convert All Videos
```bash
# Convert all WebM files in recordings directory
for file in recordings/*.webm; do
  ffmpeg -i "$file" -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 192k "${file%.webm}.mp4"
done
```

## Demo Features Recorded

✅ **Login Screen** (8 seconds)  
✅ **Dark Mode Toggle** - Light/Dark theme switching  
✅ **Language Switch** - English/Spanish  
✅ **Demo Login** - Credentials entry  
✅ **Dashboard** (5 seconds) - Business metrics  
✅ **Dashboard Filter** - Dynamic data updates  
✅ **AI Forecasts** (15+ seconds) - Scrolling predictions  
✅ **Chatbot** - 10 questions (5 EN + 5 ES)  
✅ **Clients** - Customer list  
✅ **Products** - Catalog + create product  
✅ **Register Sale** - Sale form  
✅ **Sales Infinite Scroll** - Transaction history  

## Troubleshooting

### Video Not Saved
- Check that `recordings/` directory exists (created automatically)
- Ensure demo completed successfully (check console output)
- Wait 2-3 seconds after browser closes for video to finalize

### Video Quality Issues
- Ensure viewport is 1920x1080 (set in script)
- Check that browser is actually fullscreen
- Verify no other applications are interfering

### Demo Fails
- Ensure all services are running
- Check frontend is accessible at http://localhost:5173
- Verify Playwright is installed: `npx playwright install chromium`

### Video File Too Large
- WebM files are typically 50-150 MB for 4-5 minutes
- Convert to MP4 with higher CRF value (e.g., 28) for smaller size
- Use `preset fast` for faster conversion with smaller file

### Can't Play WebM File
- WebM is supported by most modern browsers
- VLC Media Player supports WebM
- Convert to MP4 for universal compatibility

## YouTube Upload Settings

### Recommended Settings
- **Title:** BusinessAI Analytics Platform - Full Demo
- **Description:** Include feature list and timestamps
- **Tags:** business analytics, AI, dashboard, forecasting, chatbot
- **Category:** Science & Technology
- **Thumbnail:** Screenshot of dashboard or forecasts
- **Visibility:** Public/Unlisted as needed

### Video Timestamps (for description)
```
0:00 - Login Screen
0:08 - Dark Mode Toggle
0:16 - Language Switch
0:24 - Demo Login
0:31 - Dashboard Overview
0:36 - Dashboard Filter
0:42 - AI Forecasts
1:02 - Chatbot Demo (10 questions)
2:02 - Clients View
2:07 - Products & Create
2:14 - Register Sale
2:19 - Sales Infinite Scroll
```

## Tips for Best Results

1. **Close unnecessary apps** - Reduce CPU usage
2. **Disable notifications** - Avoid interruptions
3. **Check services first** - Ensure all are running
4. **Run once for testing** - Verify everything works
5. **Record final version** - When satisfied with test run

## Advanced: Custom Recording Settings

Edit `demo-video-recording.ts` to customize:

```typescript
recordVideo: {
  dir: './recordings',           // Output directory
  size: { width: 1920, height: 1080 }  // Resolution
}
```

## Support

For issues:
1. Check console output for errors
2. Verify all services are running
3. Review troubleshooting section
4. Check main README.md for service issues

## License

Part of the BusinessAI Analytics Platform project.
