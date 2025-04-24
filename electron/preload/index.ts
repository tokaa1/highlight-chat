import { ipcRenderer, contextBridge } from 'electron'

export type PreloadAPI = {
  on: (...args: Parameters<typeof ipcRenderer.on>) => void
  off: (...args: Parameters<typeof ipcRenderer.off>) => void
  send: (...args: Parameters<typeof ipcRenderer.send>) => void
  invoke: (...args: Parameters<typeof ipcRenderer.invoke>) => void
  takeScreenshot: (x: number, y: number, width: number, height: number) => Promise<string>
  enableMouse: () => void
  disableMouse: () => void
  onWindowVisibilityChange: (callback: (isVisible: boolean) => void) => void
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
  takeScreenshot: (x: number, y: number, width: number, height: number) => {
    return ipcRenderer.invoke('take-screenshot', { x, y, width, height })
  },
  enableMouse: () => ipcRenderer.invoke('enable-mouse'),
  disableMouse: () => ipcRenderer.invoke('disable-mouse'),
  onWindowVisibilityChange: (callback: (isVisible: boolean) => void) => {
    ipcRenderer.on('window-visibility-changed', (_, isVisible) => callback(isVisible));
  },
} as PreloadAPI)