# Demo Scripts

Automated demo scripts for the BusinessAI Analytics Platform using Playwright.

## Available Scripts

### 1. Video Recording Demo (4-5 minutes)
**File:** `demo-video-recording.ts`  
**Purpose:** Optimized for video recording with proper timing and comprehensive feature showcase

```bash
npm run demo:video
# or
npm run demo:record
```

**Features Demonstrated:**
1. ✅ Login screen (8 seconds display)
2. ✅ Dark mode toggle test
3. ✅ Language switch test (English/Spanish)
4. ✅ Login with demo credentials
5. ✅ Dashboard overview (~5 seconds)
6. ✅ Dashboard filter application
7. ✅ AI Forecasts with scrolling (15+ seconds)
8. ✅ Chatbot with 10 questions (5 English + 5 Spanish)
9. ✅ Clients quick view
10. ✅ Products quick view + create product
11. ✅ Register sale
12. ✅ Sales infinite scroll

**Total Duration:** 4-5 minutes

### 2. Interactive Demo (Original)
**File:** `demo-interactive.ts`  
**Purpose:** Original 2-3 minute quick demo

```bash
npm run demo
```

## Prerequisites

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install chromium
```

### 3. Start All Services
Before running the demo, ensure all services are running:

```bash
# Terminal 1: Start MySQL
./scripts/start-mysql.sh

# Terminal 2: Start all microservices
./scripts/start-all.sh

# Terminal 3: Start AI service
cd ai-service
python app.py

# Terminal 4: Start frontend
cd frontend
npm run dev
```

Wait for all services to be fully started before running the demo.

## Running the Video Recording Demo

### Step 1: Prepare for Recording
1. Close unnecessary applications
2. Clear browser cache if needed
3. Ensure all services are running and healthy
4. Check that frontend is accessible at http://localhost:5173

### Step 2: Start Screen Recording
Use your preferred screen recording software:

**macOS:**
- QuickTime Player: File → New Screen Recording
- Screenshot app: Cmd + Shift + 5
- OBS Studio (recommended for professional recording)

**Windows:**
- Xbox Game Bar: Win + G
- OBS Studio

**Linux:**
- SimpleScreenRecorder
- OBS Studio
- Kazam

### Step 3: Run the Demo
```bash
npm run demo:video
```

### Step 4: Stop Recording
The demo will automatically close the browser when complete. Stop your screen recording.

## Demo Flow Details

### Timing Breakdown (4-5 minutes total)

| Step | Feature | Duration | Notes |
|------|---------|----------|-------|
| 0 | Browser launch | 2s | Fullscreen setup |
| 1 | Login screen | 8s | Display login interface |
| 2 | Dark mode toggle | 8s | Toggle dark/light mode |
| 3 | Language switch | 8s | Switch EN/ES |
| 4 | Login | 7s | Enter credentials and login |
| 5 | Dashboard | 5s | Overview display |
| 6 | Dashboard filter | 6s | Apply filter and see changes |
| 7 | Forecasts | 20s | Scroll through AI predictions |
| 8 | Chatbot | 60s | 10 questions (5 EN + 5 ES) |
| 9 | Clients | 5s | Quick view |
| 10 | Products | 7s | View + create product |
| 11 | Register sale | 5s | Sale form |
| 12 | Sales infinite | 12s | Infinite scroll demo |
| - | Closing | 3s | Final showcase |

**Total:** ~4-5 minutes

## Customization

### Adjust Timing
Edit the `wait()` function calls in `demo-video-recording.ts`:

```typescript
await wait(8, 'LOGIN SCREEN - 8 seconds');  // Change 8 to desired seconds
```

### Modify Questions
Edit the `queries` array in Step 8:

```typescript
const queries = [
  // Add your English questions here
  'Your custom question?',
  // Add your Spanish questions here
  '¿Tu pregunta personalizada?'
];
```

### Change Demo Credentials
Edit Step 4:

```typescript
await input.fill('your-email@example.com');
await passwordInput.fill('your-password');
```

## Troubleshooting

### Demo Fails to Start
- Ensure all services are running
- Check that frontend is accessible at http://localhost:5173
- Verify Playwright is installed: `npx playwright install chromium`

### Browser Not in Fullscreen
- The script automatically sets viewport to 1920x1080
- If issues persist, manually maximize the browser window when it opens

### Steps Are Skipped
- Some steps are optional and will be skipped if elements aren't found
- Check console output for warnings (⚠️)
- Ensure you're using the latest version of the frontend

### Demo Runs Too Fast/Slow
- Adjust `wait()` durations in the script
- Default timeout is 6 minutes (can be changed in `DEMO_TIMEOUT`)

### Chatbot Questions Fail
- Ensure AI service is running on port 8000
- Check that chatbot input field is visible
- Verify API gateway is routing requests correctly

## Tips for Best Video Quality

1. **Resolution:** Use 1920x1080 (Full HD) for recording
2. **Frame Rate:** 30 FPS minimum, 60 FPS recommended
3. **Audio:** Consider adding voiceover narration after recording
4. **Lighting:** Ensure good screen visibility (avoid glare)
5. **Editing:** Trim the beginning/end if needed
6. **Compression:** Use H.264 codec for YouTube compatibility

## Output

The demo will:
- ✅ Run automatically through all steps
- ✅ Display colored console output showing progress
- ✅ Close the browser when complete
- ✅ Show total duration at the end

Console output includes:
- 🔵 Blue: System messages
- 🟢 Green: Success messages
- 🟡 Yellow: Warnings
- 🔴 Red: Errors
- 🟣 Purple: Section headers

## Support

For issues or questions:
1. Check the console output for error messages
2. Verify all services are running
3. Review the troubleshooting section above
4. Check the main README.md for service-specific issues

## License

Part of the BusinessAI Analytics Platform project.
