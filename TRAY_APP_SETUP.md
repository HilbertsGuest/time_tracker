# System Tray Server Setup

This guide will help you set up the lightweight system tray app that controls the localhost server for your Time Tracker PWA.

## What It Does

- Adds a small icon to your Windows system tray
- Lets you manually start/stop the localhost server with a click
- Shows server status (green = running, gray = stopped)
- Uses minimal resources (~15-25MB RAM when running)
- Only runs when you need it

## Installation Steps

### 1. Install Python Dependencies

Open Command Prompt or PowerShell in this folder and run:

```bash
pip install -r requirements.txt
```

This installs two lightweight libraries:
- `pystray` - Creates the system tray icon
- `Pillow` - Generates the icon image

### 2. Create a Shortcut (Optional but Recommended)

For easy access, create a shortcut to launch the tray app:

1. Right-click `server_tray.py`
2. Click "Create shortcut"
3. Rename to "Time Tracker Server"
4. Move to your Desktop or Startup folder

**To auto-start with Windows** (optional):
- Press `Win + R`, type `shell:startup`, press Enter
- Move the shortcut to this Startup folder

### 3. Launch the Tray App

Double-click `server_tray.py` (or your shortcut)

You'll see a gray circle icon appear in your system tray (bottom-right corner).

## How to Use

### Starting the Server

1. Click the gray tray icon
2. Select **"Start Server"**
3. Icon turns green - server is running on `http://localhost:8000`
4. Now click your Time Tracker PWA from the taskbar - it will work!

### Stopping the Server

1. Click the green tray icon
2. Select **"Stop Server"**
3. Icon turns gray - server stopped (saves energy)

### Opening the PWA

- Click the tray icon → **"Open Time Tracker"** (opens in your default browser)
- Or just click your installed PWA icon in the taskbar

### Quitting the Tray App

- Click the tray icon → **"Quit"**
- Server will automatically stop

## Usage Workflow

**Daily workflow:**
1. Double-click the tray app shortcut (or it auto-starts)
2. Click tray icon → "Start Server"
3. Use your Time Tracker PWA normally from taskbar
4. When done, click tray icon → "Stop Server" (saves energy)
5. Tray app stays running in background (uses <5MB RAM)

## Troubleshooting

### Port Already in Use

If you get an error that port 8000 is already in use:

1. Open Task Manager (Ctrl+Shift+Esc)
2. Find any Python processes and end them
3. Try starting the server again

### Tray Icon Not Appearing

- Check system tray overflow (click the up arrow ^ in taskbar)
- Make sure Python and dependencies are installed correctly

### PWA Not Loading

- Verify the server is running (icon should be green)
- Make sure the server shows: http://localhost:8000
- Try clicking "Open Time Tracker" from the tray menu

## Energy Efficiency

**When server is stopped:** ~3-5MB RAM (tray app only)
**When server is running:** ~15-25MB RAM total
**CPU usage:** <1% (mostly idle)

Much lighter than Electron (~200MB) or keeping a server always running!

## Alternative: Run Without Tray App

If you don't want the tray app, you can still manually run the server:

```bash
python -m http.server 8000
```

Then use your PWA normally. Just remember to close the terminal when done.
