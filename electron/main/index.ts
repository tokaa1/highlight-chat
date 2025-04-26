import { app, BrowserWindow, shell, ipcMain, screen, globalShortcut, desktopCapturer } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

function toggleWindowVisibility() {
  if (!win) return;

  if (win.isVisible()) {
    win.webContents.send('window-visibility-changed', false);
    win.hide();
  } else {
    win.webContents.send('window-visibility-changed', true);
    // Update window size and position before showing
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const yPosition = primaryDisplay.workArea.y;

    win.setSize(width, height);
    win.setPosition(0, yPosition);
    win.blur();
    win.show();
  }
}

async function takeScreenshot() {
  if (process.platform !== 'darwin') {
    throw new Error('This screenshot method is only supported on macOS');
  }

  try {
    const { execSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');

    // Create a temporary file path
    const tempDir = app.getPath('temp');
    const tempFilePath = path.join(tempDir, `screenshot-${Date.now()}.png`);

    // Use screencapture to take the screenshot with the specified region
    execSync(`screencapture -i "${tempFilePath}"`);

    // Read the file and convert to base64
    const imageBuffer = fs.readFileSync(tempFilePath);
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);

    return dataUrl;
  } catch (error) {
    console.error('Screenshot error:', error);
    throw new Error('Failed to capture screenshot');
  }
}

async function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const yPosition = primaryDisplay.workArea.y;

  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
    },
    show: false,
    autoHideMenuBar: false,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    hiddenInMissionControl: false,
    width: width,
    height: height,
    x: 0,
    y: yPosition,
    type: 'panel',
    movable: true,
    resizable: true,
    backgroundColor: '#00000000',
    //vibrancy: 'fullscreen-ui',    // on MacOS
    //backgroundMaterial: 'acrylic' // on Windows 11
  })
  //win.setIgnoreMouseEvents(true, {forward: true});

  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      event.preventDefault();
      win?.webContents.toggleDevTools();
    }
  });

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    //win.webContents.toggleDevTools();
  } else {
    win.loadFile(indexHtml)
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow();

  // register global shortcut cmd/ctrl + B
  globalShortcut.register(process.platform === 'darwin' ? 'CommandOrControl+B' : 'Ctrl+B', toggleWindowVisibility);
  globalShortcut.register(process.platform === 'darwin' ? 'CommandOrControl+H' : 'Ctrl+H', () => {
    if (!win)
      return;
    if (!win.isVisible())
      win.show();
    takeScreenshot().then(screenshot => {
      win!.webContents.send('screenshot', screenshot);
    });
  });
  globalShortcut.register(process.platform === 'darwin' ? 'CommandOrControl+D' : 'Ctrl+D', () => {
    if (!win)
      return;
    if (!win.isVisible())
      win.show();
    win.webContents.send('reset-screenshot');
  });

  ipcMain.handle('enable-mouse', () => {
    win?.setIgnoreMouseEvents(false, { forward: true });
  })
  ipcMain.handle('disable-mouse', () => {
    win?.setIgnoreMouseEvents(true, { forward: true });
  })
})

// Unregister shortcuts when app quits
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})