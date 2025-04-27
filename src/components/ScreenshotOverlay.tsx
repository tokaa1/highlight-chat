import { useVisibility } from "@/contexts/visibility";
import { nativeApi } from "@/util/native";
import { ScreenshotRect, ScreenshotResponse } from "electron/preload";
import OpenAI from "openai";
import { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { xonokai } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";

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
  textPosition = 'top' == textPosition ? 'bottom' : 'top'; // Default position, will be determined by algorithm

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

async function doAiMagic(currentScreenshot: ScreenshotState, setCurrentScreenshot: (screenshot: ScreenshotState) => void) {
  if (!currentScreenshot)
    return;
  console.log('one call')

  const input: ResponseCreateParamsNonStreaming['input'] = [
    {
      role: "system",
      content: `Today's date is ${new Date().toLocaleDateString()}. `
        + "You are a helpful assistant. "
        + "When communicating with the user, you may highlight things on the image to help them understand the image better. "
        + "To use the highlight tool, use the following format: `<highlight x=100 y=100 width=200 height=200>Your label here</highlight>`"
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
  const stream = await openai.responses.create({
    model: 'gpt-4.1',
    input: input,
    stream: true
  });

  let fullResponse = '';
  const markerStyleMap = new Map<string, MarkerStyle>();
  let markers: Marker[] = [];

  for await (const event of stream) {
    if (event.type !== 'response.output_text.delta')
      continue;
    fullResponse += (event as any).delta;

    const highlightRegex = /<highlight x=(\d+) y=(\d+) width=(\d+) height=(\d+)>(.*?)<\/highlight>/g;
    markers = [];
    let match;
    while ((match = highlightRegex.exec(fullResponse)) !== null) {
      const x = Math.max(0, parseInt(match[1]));
      const y = Math.max(0, parseInt(match[2]));
      const width = Math.min(parseInt(match[3]), currentScreenshot.width - x);
      const height = Math.min(parseInt(match[4]), currentScreenshot.height - y);
      const text = match[5];

      const markerKey = createMarkerKey(x, y, width, height, text);

      if (!markerStyleMap.has(markerKey)) {
        const style = cycleMarkerStyle();
        markerStyleMap.set(markerKey, style);
      }

      markers.push({
        x,
        y,
        width,
        height,
        text,
        style: markerStyleMap.get(markerKey)!
      });
    }

    // strips incomplete <highlight> tags
    const displayResponse = fullResponse.replace(/<highlight.*?($|(?=<highlight))/g, '');

    setCurrentScreenshot({
      ...currentScreenshot,
      markers: [...markers],
      response: displayResponse
    });
  }
  setCurrentScreenshot({
    ...currentScreenshot,
    markers: markers,
    response: fullResponse
  });
};

function createMarkerKey(x: number, y: number, width: number, height: number, text: string): string {
  return `${x}-${y}-${width}-${height}-${text}`;
}

export default function ScreenshotOverlay() {
  const [currentScreenshot, setCurrentScreenshot] = useState<ScreenshotState | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  useEffect(() => {
    nativeApi.on('screenshot', (_ev, screenshot: ScreenshotResponse) => {
      setCurrentScreenshot(screenshot as ScreenshotState);
      setIsGenerating(true);
      doAiMagic(screenshot as ScreenshotState, setCurrentScreenshot).finally(() => setIsGenerating(false));
    });
    nativeApi.on('reset-screenshot', () => {
      setCurrentScreenshot(null);
    });

    return () => {
      nativeApi.removeAllListeners('screenshot');
      nativeApi.removeAllListeners('reset-screenshot');
    }
  }, []);
  const [hoveredMarkers, setHoveredMarkers] = useState<Set<Marker>>(new Set());// keys of markers that are hovered
  if (!currentScreenshot)
    return null;

  console.log(currentScreenshot.response);

  return <div className='absolute m-0 p-4 w-[500px] min-h-[130px] bottom-[166px] box-border left-1/2 transform -translate-x-1/2 rounded-3xl flex flex-col gap-2 justify-center items-center bg-black/70 backdrop-blur-sm'>
    <div className="max-w-full max-h-[200px] relative">
      <img src={currentScreenshot.imageDataUrl} alt="Screenshot" className="max-w-full max-h-[200px] h-auto object-contain rounded-3xl border-white/10 border-[2px] border-solid fade-in-200" />
      {currentScreenshot.markers?.map((marker, index) => {
        const isHovered = hoveredMarkers.has(marker);
        const onMouseOver = () => {
          if (isHovered)
            return;
          setHoveredMarkers(prev => {
            const s = new Set(prev);
            s.add(marker);
            return s;
          });
        }
        const onMouseOut = () => {
          if (!isHovered)
            return;
          setHoveredMarkers(prev => {
            const s = new Set(prev);
            s.delete(marker);
            return s;
          });
        }
        return <div key={index} className={`absolute hover:opacity-[1] transition-all duration-200 ${isGenerating && index == currentScreenshot.markers!.length - 1 ? 'animate-pulse' : ''}`} style={{
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
          zIndex: isHovered ? 1001 : 1000,
          transform: `scale(${isHovered ? 1.1 : 1})`,
          opacity: isHovered ? 1 : 0.8,
        }} onMouseEnter={onMouseOver} onMouseLeave={onMouseOut}>
          <div className={`p-1 ${isHovered ? 'bg-black/70' : ''} rounded-md text-white text-[10px] font-bold absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center transition-all duration-200 ${isHovered ? 'scale-[1.15]' : 'scale-[1]'} ${marker.style.textPosition === 'top' ? 'top-[-22px]' : 'bottom-[-22px]'}`}>
            {marker.text}
          </div>
        </div>
      })}
    </div>
    <Markdown
      rehypePlugins={[rehypeRaw]}
      disallowedElements={['script']}// not bullet proof
      components={{
        code(props) {
          const { children, className, node, ...rest } = props
          const match = /language-(\w+)/.exec(className || '')
          const content = match ? String(children).replace(/\n$/, '') : String(children);
          return match ? (
            <>
              <div className='w-full h-[12px] py-[6px] text-xs text-white font-sans font-bold'>
                {match[1]}
              </div>
              <SyntaxHighlighter
                PreTag="div"
                children={content}
                language={match[1]}
                style={xonokai}
                useInlineStyles={true}
                customStyle={{
                  border: 'none',
                  borderRadius: '10px',
                  margin: 0,
                  padding: '8px',
                  boxSizing: 'border-box',
                }}
              />
            </>
          ) : (
            <code {...rest} className={className}>
              {content}
            </code>
          )
        },
        p: ({ children }) => <p className="my-[4px] w-full">{children}</p>,
        h1: ({ children }) => <h1 className="my-[4px] w-full">{children}</h1>,
        h2: ({ children }) => <h2 className="my-[4px] w-full">{children}</h2>,
        h3: ({ children }) => <h3 className="my-[4px] w-full">{children}</h3>,
        h4: ({ children }) => <h4 className="my-[4px] w-full">{children}</h4>,
        h5: ({ children }) => <h5 className="my-[4px] w-full">{children}</h5>,
        h6: ({ children }) => <h6 className="my-[4px] w-full">{children}</h6>,
        ul: ({ children }) => <ul className="my-[4px] w-full">{children}</ul>,
        ol: ({ children }) => <ol className="my-[4px] w-full">{children}</ol>,
        li: ({ children }) => <li className="my-[4px] w-full">{children}</li>,
        //@ts-ignore
        highlight: ({ children, ...props }) => {
          const { x, y, width, height } = props as any;
          if (x && y && width && height) {
            const marker = currentScreenshot.markers?.find(m => m.x == x && m.y == y && m.width == width && m.height == height);
            if (!marker) {
              return <></>;
            }
            const isHovered = hoveredMarkers.has(marker);
            const onMouseOver = () => {
              if (isHovered)
                return;
              setHoveredMarkers(prev => {
                const s = new Set(prev);
                s.add(marker);
                return s;
              });
            }
            const onMouseOut = () => {
              if (!isHovered)
                return;
              setHoveredMarkers(prev => {
                const s = new Set(prev);
                s.delete(marker);
                return s;
              });
            }
            return <div className="flex flex-col my-[2px] gap-2 pl-2 border-l-[3px] self-start" style={{borderLeftColor: marker.style.color.borderColor, borderLeftStyle: 'solid'}} onMouseEnter={onMouseOver} onMouseLeave={onMouseOut}>
              <span className={`text-white text-xs font-light`}>
                {'Highlighted: '}
                <span className={`text-white text-xs font-bold`} style={{color: marker.style.color.borderColor}}>{marker.text}</span>
              </span>
            </div>
          }
          return <></>
        },
        table: ({ children }) => <table className="my-[4px]">{children}</table>,
        tr: ({ children }) => <tr className="my-[4px]">{children}</tr>,
        th: ({ children }) => <th className="my-[4px]">{children}</th>,
        td: ({ children }) => <td className="my-[4px]">{children}</td>,
      }}
    >
      {currentScreenshot.response}
    </Markdown>
    <input type="text" className="w-full h-[30px] bg-black/50 text-white rounded-md p-2 hover:bg-white"/>
  </div>
}