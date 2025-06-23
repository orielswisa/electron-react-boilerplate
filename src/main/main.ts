/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';

import Store from 'electron-store';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

// Initialize electron-store for settings and data persistence
const store = new Store({
  defaults: {
    settings: {
      openaiApiKey: '',
    },
    history: [],
  },
});

let mainWindow: BrowserWindow | null = null;

// IPC handlers for settings management
ipcMain.handle('settings:get', (event, key: string) => {
  return store.get(`settings.${key}`);
});

ipcMain.handle('settings:set', (event, key: string, value: any) => {
  store.set(`settings.${key}`, value);
  return true;
});

ipcMain.handle('settings:getAll', () => {
  return store.get('settings');
});

// IPC handlers for history/data management
ipcMain.handle('history:get', () => {
  return store.get('history', []);
});

ipcMain.handle('history:add', (event, item: any) => {
  const history = store.get('history', []) as any[];
  const newItem = {
    ...item,
    id: Date.now(), // Simple ID generation
    timestamp: new Date().toISOString(),
  };
  history.unshift(newItem); // Add to beginning

  // Keep only last 100 items to prevent unlimited growth
  if (history.length > 100) {
    history.splice(100);
  }

  store.set('history', history);
  return newItem;
});

ipcMain.handle('history:clear', () => {
  store.set('history', []);
  return true;
});

ipcMain.handle('history:delete', (event, id: number) => {
  const history = store.get('history', []) as any[];
  const filteredHistory = history.filter((item) => item.id !== id);
  store.set('history', filteredHistory);
  return true;
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    center: true,
    resizable: true,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }

    // Open DevTools in development
    if (isDebug) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
