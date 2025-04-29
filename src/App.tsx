import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { ScreenshotResponse } from 'electron/preload';
import ScreenshotOverlay from './pages/ScreenshotOverlay';
import { VisibilityContext } from './contexts/visibility';
import Header from './pages/Header';
import { nativeApi } from './util/native';
import Settings from './pages/Settings';
import { OpenAIProvider } from './contexts/openai';
import usePages from './contexts/pages';

export default function App() {
  const [isVisible, setIsVisible] = useState(false);
  const { isOpen } = usePages();

  useEffect(() => {
    const handleVisibilityChange = (visible: boolean) => {
      setIsVisible(visible);
    };

    nativeApi.onWindowVisibilityChange(handleVisibilityChange);
  }, []);

  //absolute bottom-20 left-1/2 transform -translate-x-1/2
  return (
    <VisibilityContext.Provider value={isVisible}>
      <OpenAIProvider>
        <div
          className='h-full w-full m-0 p-0'
          style={{
            opacity: isVisible ? 1 : 0,
            transition: isVisible ? 'opacity 200ms ease-in, transform 200ms ease-out' : 'none',
            transform: `translateY(${isVisible ? '0' : '100px'})`,
          }}
        >
          {isOpen('settings') && <Settings />}
          <Header />
          <ScreenshotOverlay />
        </div>
      </OpenAIProvider>
    </VisibilityContext.Provider>
  );
}