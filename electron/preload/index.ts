import { ipcRenderer, contextBridge } from 'electron'

export interface ScreenshotRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PreloadAPI = {
  on: (...args: Parameters<typeof ipcRenderer.on>) => void
  off: (...args: Parameters<typeof ipcRenderer.off>) => void
  send: (...args: Parameters<typeof ipcRenderer.send>) => void
  invoke: (...args: Parameters<typeof ipcRenderer.invoke>) => void
  enableMouse: () => void
  disableMouse: () => void
  onWindowVisibilityChange: (callback: (isVisible: boolean) => void) => void
  // returns image b64 url
  takeScreenshot: () => Promise<string>
  requestScreenshotPermission: () => Promise<void>
  isScreenshotPermissionGranted: () => Promise<boolean>
}

contextBridge.exposeInMainWorld('nativeApi', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
  enableMouse: () => ipcRenderer.invoke('enable-mouse'),
  disableMouse: () => ipcRenderer.invoke('disable-mouse'),
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot') as Promise<string>,
  onWindowVisibilityChange: (callback: (isVisible: boolean) => void) => {
    ipcRenderer.on('window-visibility-changed', (_, isVisible) => callback(isVisible));
  },
  requestScreenshotPermission: () => ipcRenderer.invoke('request-screenshot-permission') as Promise<void>,
  isScreenshotPermissionGranted: () => ipcRenderer.invoke('is-screenshot-permission-granted') as Promise<boolean>
} as PreloadAPI)