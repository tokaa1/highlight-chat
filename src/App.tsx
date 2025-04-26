import { useEffect, useRef, useState, createContext, useContext } from 'react';
import OpenAI from 'openai';
import { PreloadAPI } from 'electron/preload';
import ScreenshotOverlay from './components/ScreenshotUI';
import { VisibilityContext } from './contexts/visibility';
import Header from './components/Header';
import { nativeApi } from './util/native';
import { futuristicGradientStyle } from './util/styling';

interface Marker {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

interface ScreenshotState {
  imageDataUrl: string;
  markers?: Marker[];
  response?: string;
}

const openai = new OpenAI({
  // ok we're gonna have to delete this git repo, key is legit right here
  apiKey: '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',
  dangerouslyAllowBrowser: true// building
});

export default function App() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState<ScreenshotState | null>(null);

  useEffect(() => {
    const handleVisibilityChange = (visible: boolean) => {
      setIsVisible(visible);
    };

    nativeApi.onWindowVisibilityChange(handleVisibilityChange);
  }, []);

  useEffect(() => {
    nativeApi.on('screenshot', (_ev, screenshot: string) => {
      const newScreenshot = {
        imageDataUrl: screenshot,
      };
      setCurrentScreenshot(newScreenshot);
      doAiMagic(newScreenshot);
    });
    nativeApi.on('reset-screenshot', () => {
      setCurrentScreenshot(null);
    });
  }, []);

  const doAiMagic = async (currentScreenshot: ScreenshotState) => {
    if (!currentScreenshot)
      return;

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: "system",
          content: "You are a helpful assistant that can answer questions about the image and analyze accurately while providing short yet consise responses."
        },
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: currentScreenshot.imageDataUrl,
              detail: "auto"
            }
          ]
        }
      ]
    });
    setCurrentScreenshot({
      ...currentScreenshot,
      response: response.output_text
    });
  };

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
        {currentScreenshot && <div className='absolute m-0 p-4 w-[500px] min-h-[130px] bottom-[156px] box-border left-1/2 transform -translate-x-1/2 rounded-3xl flex flex-col gap-2 justify-center items-center bg-black/20 backdrop-blur-sm'>
          <img src={currentScreenshot.imageDataUrl} alt="Screenshot" className="max-w-full max-h-[200px] h-auto object-contain rounded-3xl border-white/10 border-[2px] border-solid" />
          <span className='text-white text-sm'>
            {/*"hello this is crazy hello this is crazy hello this is crazy hello this is crazy hello this is crazy hello this is crazy hello this is crazy hello this is crazy hello this is crazy hello this is crazy hello this is crazy "*/}
            {currentScreenshot.response}
          </span>
        </div>}
      </div>
    </VisibilityContext.Provider>
  );
}