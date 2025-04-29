import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { ScreenshotResponse } from 'electron/preload';
import ScreenshotOverlay from './pages/ScreenshotOverlay';
import { VisibilityContext } from './contexts/visibility';
import Header from './pages/Header';
import { nativeApi } from './util/native';
import APIKeyPrompt from './pages/APIKeyPrompt';
import { ApiKeyProvider } from './contexts/openai';

export default function App() {
  const [isVisible, setIsVisible] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = (visible: boolean) => {
      setIsVisible(visible);
    };

    nativeApi.onWindowVisibilityChange(handleVisibilityChange);
  }, []);

  //absolute bottom-20 left-1/2 transform -translate-x-1/2
  return (
    <VisibilityContext.Provider value={isVisible}>
      <ApiKeyProvider setOpenKeyPrompt={setIsApiSettingsOpen} isOpenKeyPromptOpen={isApiSettingsOpen}>
        <div
          className='h-full w-full m-0 p-0'
          style={{
            opacity: isVisible ? 1 : 0,
            transition: isVisible ? 'opacity 200ms ease-in, transform 200ms ease-out' : 'none',
            transform: `translateY(${isVisible ? '0' : '100px'})`,
          }}
        >
          {isApiSettingsOpen && <APIKeyPrompt />}
          <Header />
          <ScreenshotOverlay />
        </div>
      </ApiKeyProvider>
    </VisibilityContext.Provider>
  );
}