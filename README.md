# Time Tracker PWA

A Progressive Web App for tracking study hours across university modules with weekly goals and insights.

## Features

- **Offline Functionality**: Works completely offline after first load
- **Data Persistence**: All data is stored locally using IndexedDB
- **Installable**: Can be installed as a standalone app on desktop and mobile
- **Time Tracking**: Live timer with module selection
- **Weekly Goals**: Track progress towards weekly study goals for each module
- **Archive System**: Archive completed weeks for historical tracking
- **Visual Analytics**: Doughnut charts showing time distribution across modules

## Project Structure

```
time_tracker/
├── index.html              # Main application file
├── manifest.json           # PWA manifest for installability
├── sw.js                   # Service worker for offline functionality
├── js/
│   ├── react.production.min.js      # React library
│   ├── react-dom.production.min.js  # ReactDOM library
│   ├── babel.min.js                 # Babel transpiler
│   ├── chart.min.js                 # Chart.js for visualizations
│   └── db.js                        # IndexedDB wrapper
└── icons/
    ├── icon-192.png         # App icon 192x192 (need to create)
    └── icon-512.png         # App icon 512x512 (need to create)
```

## Setup Instructions

### 1. Create App Icons

You need to create two icon files:

**Option A: Using an online tool**
1. Go to https://favicon.io/favicon-generator/ or similar
2. Create a simple icon with a clock/timer symbol
3. Download as PNG
4. Resize to 192x192px and 512x512px
5. Save as `icons/icon-192.png` and `icons/icon-512.png`

**Option B: Using a placeholder**
For testing purposes, you can create simple colored squares:
- Any 192x192px image saved as `icons/icon-192.png`
- Any 512x512px image saved as `icons/icon-512.png`

### 2. Serve the Application

PWAs require HTTPS or localhost. Choose one method:

**Method 1: Using Python (Recommended for testing)**
```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

**Method 2: Using Node.js http-server**
```bash
# Install globally
npm install -g http-server

# Run in project directory
http-server -p 8000

# Then open: http://localhost:8000
```

**Method 3: Using VS Code Live Server**
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### 3. Testing the PWA

1. **Open in Browser**: Navigate to `http://localhost:8000/index.html`

2. **Test Offline Functionality**:
   - Load the app
   - Open DevTools (F12) → Application tab → Service Workers
   - Check that service worker is registered
   - Enable "Offline" mode in DevTools → Network tab
   - Refresh the page - it should still work!

3. **Test Data Persistence**:
   - Add a new task
   - Close the browser completely
   - Reopen and navigate to the app
   - Your task should still be there

4. **Test Installation** (Desktop):
   - Chrome/Edge: Look for install button in address bar
   - Or click the "Install App" button in the header
   - After installing, find the app in your applications menu

5. **Test on Mobile**:
   - Deploy to a hosting service (GitHub Pages, Netlify, Vercel)
   - Visit on mobile browser
   - Use "Add to Home Screen" option
   - Open as standalone app

## IndexedDB Storage

The app uses IndexedDB to store:
- **Tasks**: All time tracking entries with start/end times
- **Archived Weeks**: Historical data organized by calendar week

Data persists across:
- Page refreshes
- Browser restarts
- App updates

**Note**: Data is stored locally per browser. It does not sync across devices.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with PWA support

## Modules Tracked

1. **Diskrete Strukturen** (DS) - 8h/week goal
2. **Analysis für Informatik** (Analysis) - 12h/week goal
3. **Programmierung** (Prog) - 12h/week goal
4. **Technische Informatik** (TI) - 8h/week goal
5. **Mentoring Informatik** (Mentoring) - 2h/week goal

**Total Weekly Goal**: 42 hours

## Development Notes

### Adding New Modules

Edit `index.html` around line 449 to modify the modules object:

```javascript
const modules = {
    'Module Name': { goal: 10, color: '#hexcolor' },
    // Add more modules...
};
```

### Clearing Data

Open DevTools → Application → IndexedDB → TimeTrackerDB → Right-click → Delete database

### Updating the Service Worker

If you modify any cached files, update the `CACHE_NAME` in `sw.js`:

```javascript
const CACHE_NAME = 'time-tracker-v2'; // Increment version
```

## Troubleshooting

**Service Worker not registering?**
- Check browser console for errors
- Ensure you're using http://localhost (not file://)
- Clear browser cache and reload

**Data not persisting?**
- Check browser settings - IndexedDB must be enabled
- Verify you're not in incognito/private mode
- Check DevTools → Application → IndexedDB

**Install button not showing?**
- PWAs require HTTPS or localhost
- Check manifest.json is valid (DevTools → Application → Manifest)
- Some browsers don't show install prompts immediately

## License

Free to use for personal and educational purposes.
