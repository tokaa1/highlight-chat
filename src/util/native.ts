import { PreloadAPI } from "electron/preload";

export const nativeApi = (window as any).nativeApi as PreloadAPI;