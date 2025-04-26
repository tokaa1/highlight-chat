import { useEffect, useRef, useState, createContext, useContext } from 'react';
import OpenAI from 'openai';
import { PreloadAPI } from 'electron/preload';
import ScreenshotOverlay from './components/ScreenshotUI';
import { VisibilityContext } from './contexts/visibility';
import Header from './components/Header';
import { nativeApi } from './util/native';

export default function App() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);

  useEffect(() => {
    const handleVisibilityChange = (visible: boolean) => {
      setIsVisible(visible);
    };

    nativeApi.onWindowVisibilityChange(handleVisibilityChange);
  }, []);

  useEffect(() => {
    nativeApi.on('screenshot', (_ev, screenshot: string) => {
      setCurrentScreenshot(screenshot);
    });
    nativeApi.on('reset-screenshot', () => {

    });
  }, []);
  //absolute bottom-20 left-1/2 transform -translate-x-1/2
  return (
    <VisibilityContext.Provider value={isVisible}>
      <div
        className='h-full w-full m-0 p-0'
        style={{
          opacity: isVisible ? 1 : 0,
          transition: isVisible ? 'opacity 200ms ease-in' : 'none'
        }}
      >
        <Header />
        <div className='absolute m-0 p-0 w-[500px] min-h-[180px] bottom-[180px] left-1/2 transform -translate-x-1/2 bg-red-700'>
          {currentScreenshot && <img src={currentScreenshot} alt="Screenshot" />}
        </div>
      </div>
    </VisibilityContext.Provider>
  );
}