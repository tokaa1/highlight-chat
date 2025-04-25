import { useEffect, useRef, useState, createContext, useContext } from 'react';
import OpenAI from 'openai';
import { PreloadAPI } from 'electron/preload';
import ScreenshotOverlay from './components/ScreenshotUI';
import { VisibilityContext } from './contexts/visibility';
import Header from './components/Header';
import { nativeApi } from './util/native';

export default function App() {
  const [isVisible, setIsVisible] = useState(false);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = (visible: boolean) => {
      setIsVisible(visible);
    };

    nativeApi.onWindowVisibilityChange(handleVisibilityChange);
  }, []);
  useEffect(() => {
    nativeApi.on('screenshot-keybind', () => {
      setIsScreenshotMode(true);
      console.log('screenshot-keybind');
    });
    nativeApi.on('reset-screenshot', () => {
      setIsScreenshotMode(false);
      console.log('reset-screenshot');
    });
  }, []);

  return (
    <VisibilityContext.Provider value={isVisible}>
      <div 
        className='h-full w-full m-0 p-0' 
        style={{ 
          opacity: isVisible ? 1 : 0,
          transition: isVisible ? 'opacity 200ms ease-in' : 'none'
        }}
      >
        {isScreenshotMode && <ScreenshotOverlay />}
        <Header />
      </div>
    </VisibilityContext.Provider>
  );
}