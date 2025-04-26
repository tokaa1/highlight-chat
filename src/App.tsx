import { useEffect, useRef, useState, createContext, useContext } from 'react';
import OpenAI from 'openai';
import { PreloadAPI, ScreenshotResponse } from 'electron/preload';
import ScreenshotOverlay from './components/ScreenshotUI';
import { VisibilityContext } from './contexts/visibility';
import Header from './components/Header';
import { nativeApi } from './util/native';
import { futuristicGradientStyle } from './util/styling';
import { ResponseCreateParamsNonStreaming, Tool } from 'openai/resources/responses/responses';

// Marker style configuration with simple cycling mechanism
interface MarkerStyle {
  color: MarkerColor;
  textPosition: 'top' | 'bottom';
}

type MarkerColor = {
  bgColor: string;
  borderColor: string;
}

const markerColors: MarkerColor[] = [
  {
    bgColor: `rgba(182, 64, 246, 0.7)`,
    borderColor: `rgba(182, 64, 246, 1)`,
  },
  {
    bgColor: `rgba(255, 70, 70, 0.7)`,
    borderColor: `rgba(255, 50, 50, 1)`,
  },
  {
    bgColor: `rgba(75, 75, 255, 0.7)`,
    borderColor: `rgba(75, 75, 255, 1)`,
  },
  {
    bgColor: `rgba(100, 220, 100, 0.7)`,
    borderColor: `rgba(100, 220, 100, 1)`,
  },
];

// Global state for cycling
let colorIndex = 0;
let textPosition: 'top' | 'bottom' = 'bottom';

interface Marker {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  style: MarkerStyle;
}

interface ScreenshotState {
  imageDataUrl: string;
  width: number;
  height: number;
  markers?: Marker[];
  response?: string;
}

function cycleMarkerStyle(): MarkerStyle {
  colorIndex = (colorIndex + 1) % markerColors.length;
  if (textPosition === 'bottom') {
    textPosition = 'top';
  } else {
    textPosition = 'bottom';
  }
  
  return {
    color: markerColors[colorIndex],
    textPosition
  };
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
    nativeApi.on('screenshot', (_ev, screenshot: ScreenshotResponse) => {
      const newScreenshot = {
        imageDataUrl: screenshot.imageDataUrl,
        width: screenshot.width,
        height: screenshot.height
      };
      setCurrentScreenshot(newScreenshot);
      doAiMagic(newScreenshot);
    });
    nativeApi.on('reset-screenshot', () => {
      setCurrentScreenshot(null);
    });

    return () => {
      nativeApi.removeAllListeners('screenshot');
      nativeApi.removeAllListeners('reset-screenshot');
    }
  }, []);

  const doAiMagic = async (currentScreenshot: ScreenshotState) => {
    if (!currentScreenshot)
      return;

    console.log('one call')

    const input: ResponseCreateParamsNonStreaming['input'] = [
      {
        role: "system",
        content: "You are a helpful assistant that can answer questions about the image and analyze accurately while providing short yet consise responses. "
          + "When communicating with the user, you may highlight things on the image to help them understand the image better. "
          + "\nTo use the highlight tool, use the following format: `<highlight x=100 y=100 width=200 height=200>Your label here</highlight>`"
          + " where you substitute the x, y, width, height, and text ('Your label here') with the actual values and text you want to display. "
          + " You can use this tool multiple times in a single response if needed, but do not overuse it (so we can avoid image clutter). The text label show be short and consise."
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
    const response = await openai.responses.create({
      model: 'gpt-4.1',
      input: input
    });

    const markers: Marker[] = [];
    
    // Extract markers from highlight tags
    const highlightRegex = /<highlight x=(\d+) y=(\d+) width=(\d+) height=(\d+)>(.*?)<\/highlight>/g;
    let match;
    
    while ((match = highlightRegex.exec(response.output_text)) !== null) {
      const x = Math.max(0, parseInt(match[1]));
      const y = Math.max(0, parseInt(match[2]));
      const width = parseInt(match[3]);
      const height = parseInt(match[4]);
      
      // Ensure x + width and y + height don't exceed the image dimensions
      const adjustedWidth = Math.min(width, currentScreenshot.width - x);
      const adjustedHeight = Math.min(height, currentScreenshot.height - y);
      
      markers.push({
        x: x,
        y: y,
        width: adjustedWidth,
        height: adjustedHeight,
        text: match[5],
        style: cycleMarkerStyle()
      });
    }

    setCurrentScreenshot({
      ...currentScreenshot,
      response: response.output_text,
      markers: markers
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
        {currentScreenshot && <div className='absolute m-0 p-4 w-[500px] min-h-[130px] bottom-[156px] box-border left-1/2 transform -translate-x-1/2 rounded-3xl flex flex-col gap-2 justify-center items-center bg-black/50 backdrop-blur-sm'>
          <div className="max-w-full max-h-[200px] relative">            
            <img src={currentScreenshot.imageDataUrl} alt="Screenshot" className="max-w-full max-h-[200px] h-auto object-contain rounded-3xl border-white/10 border-[2px] border-solid" />
            {currentScreenshot.markers?.map((marker, index) => (
              <div key={index} className="absolute" style={{
                left: `${(marker.x / currentScreenshot.width) * 100}%`,
                top: `${(marker.y / currentScreenshot.height) * 100}%`,
                width: `${(marker.width / currentScreenshot.width) * 100}%`,
                height: `${(marker.height / currentScreenshot.height) * 100}%`,
                backgroundColor: marker.style.color.bgColor,
                border: `1px solid ${marker.style.color.borderColor}`,
                color: 'white',
                padding: '2px 4px',
                borderRadius: '0px',
                fontSize: '12px',
                zIndex: 1000
              }}>
                <span className={`text-white text-[10px] font-bold absolute left-1/2 transform -translate-x-1/2 w-[150px] text-center ${marker.style.textPosition === 'top' ? 'top-[-22px]' : 'bottom-[-22px]'}`}>{marker.text}</span>
              </div>
            ))}
          </div>
          <span className='text-white text-sm'>
            {currentScreenshot.response}
          </span>
        </div>}
      </div>
    </VisibilityContext.Provider>
  );
}