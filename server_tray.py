"""
Time Tracker Server - System Tray Controller
Lightweight tray app to start/stop the localhost server for the Time Tracker PWA
"""

import sys
import threading
import http.server
import socketserver
import webbrowser
from pathlib import Path
from pystray import Icon, Menu, MenuItem
from PIL import Image, ImageDraw

# Configuration
PORT = 8000
SERVER_DIR = Path(__file__).parent

# Global server instance
server = None
server_thread = None
is_running = False


def create_icon_image(color="gray"):
    """Create a simple colored circle icon"""
    size = 64
    image = Image.new('RGB', (size, size), 'white')
    draw = ImageDraw.Draw(image)

    # Draw circle with different colors based on state
    colors = {
        "green": "#4CAF50",  # Running
        "gray": "#9E9E9E",   # Stopped
        "red": "#F44336"     # Error
    }

    draw.ellipse([8, 8, size-8, size-8], fill=colors.get(color, colors["gray"]), outline='black')
    return image


def start_server():
    """Start the HTTP server in a background thread"""
    global server, server_thread, is_running

    if is_running:
        return

    try:
        # Change to the script's directory
        import os
        os.chdir(SERVER_DIR)

        # Create server
        Handler = http.server.SimpleHTTPRequestHandler
        socketserver.TCPServer.allow_reuse_address = True
        server = socketserver.TCPServer(("", PORT), Handler)

        # Start server in background thread
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()

        is_running = True
        print(f"Server started on http://localhost:{PORT}")

    except Exception as e:
        print(f"Error starting server: {e}")
        is_running = False


def stop_server():
    """Stop the HTTP server"""
    global server, is_running

    if not is_running or server is None:
        return

    try:
        server.shutdown()
        server.server_close()
        is_running = False
        print("Server stopped")
    except Exception as e:
        print(f"Error stopping server: {e}")


def on_start(icon, item):
    """Menu action: Start server"""
    start_server()
    icon.icon = create_icon_image("green")
    icon.title = f"Time Tracker Server (Running on :{PORT})"


def on_stop(icon, item):
    """Menu action: Stop server"""
    stop_server()
    icon.icon = create_icon_image("gray")
    icon.title = "Time Tracker Server (Stopped)"


def on_open_app(icon, item):
    """Menu action: Open PWA in browser"""
    webbrowser.open(f"http://localhost:{PORT}")


def on_quit(icon, item):
    """Menu action: Quit application"""
    stop_server()
    icon.stop()


def get_status(item):
    """Get current server status for menu"""
    return "Running" if is_running else "Stopped"


def main():
    """Main entry point"""
    # Create system tray icon
    icon = Icon(
        "TimeTrackerServer",
        create_icon_image("gray"),
        "Time Tracker Server (Stopped)",
        menu=Menu(
            MenuItem("Start Server", on_start, enabled=lambda item: not is_running),
            MenuItem("Stop Server", on_stop, enabled=lambda item: is_running),
            Menu.SEPARATOR,
            MenuItem("Open Time Tracker", on_open_app, enabled=lambda item: is_running),
            Menu.SEPARATOR,
            MenuItem(get_status, None, enabled=False),
            Menu.SEPARATOR,
            MenuItem("Quit", on_quit)
        )
    )

    # Run the icon
    icon.run()


if __name__ == "__main__":
    main()
