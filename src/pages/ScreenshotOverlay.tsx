import { nativeApi } from "@/util/native";
import { ScreenshotResponse } from "electron/preload";
import OpenAI from "openai";
import { ResponseCreateParamsNonStreaming, ResponseInputMessageContentList } from "openai/resources/responses/responses";
import { createContext, useContext, useEffect, useState } from "react";
import Markdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { xonokai } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import SimpleButton from "../components/SimpleButton";
import GeneratingDotsAnimation from "@/components/GeneratingDotsAnimation";
import InputContainer from "@/components/InputContainer";

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
    bgColor: `rgba(255, 174, 0, 0.7)`,
    borderColor: `rgb(255, 174, 0)`,
  },
  {
    bgColor: `rgba(100, 220, 100, 0.7)`,
    borderColor: `rgba(100, 220, 100, 1)`,
  },
  {
    bgColor: `rgba(0, 184, 212, 0.7)`,
    borderColor: `rgb(0, 184, 212)`,
  },
  {
    bgColor: `rgba(255, 0, 238, 0.7)`,
    borderColor: `rgb(255, 0, 238)`,
  },
  {
    bgColor: `rgba(255, 87, 34, 0.7)`,
    borderColor: `rgb(255, 87, 34)`,
  },
  {
    bgColor: `rgba(0, 150, 136, 0.7)`,
    borderColor: `rgb(0, 150, 136)`,
  },
  {
    bgColor: `rgba(233, 30, 99, 0.7)`,
    borderColor: `rgb(233, 30, 99)`,
  }
];

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

// NOT for system prompt or images, strictly what user types and what assistant responds
type ContextMessage = {
  role: 'assistant' | 'user';
  content?: string;
  image_url?: string;
}

interface PromptState {
  imageDataUrl: string;
  width: number;
  height: number;
  markers?: Marker[];
  context?: ContextMessage[];
}

function cycleMarkerStyle(): MarkerStyle {
  colorIndex = (colorIndex + 1) % markerColors.length;
  textPosition = 'top' == textPosition ? 'bottom' : 'top'; // Default position, will be determined by algorithm

  return {
    color: markerColors[colorIndex],
    textPosition
  };
}

interface HoveredMarkerState {
  hoveredMarker: Marker | null;
  setHoveredMarker: (marker: Marker | null) => void;
}

const HoveredMarkerContext = createContext<HoveredMarkerState | null>(null);

function useHoveredMarker() {
  const context = useContext(HoveredMarkerContext);
  if (!context) {
    throw new Error('useHoveredMarker must be used within a HoveredMarkerProvider');
  }
  return context;
}

function HoveredMarkerProvider({ children }: { children: React.ReactNode }) {
  const [hoveredMarker, setHoveredMarker] = useState<Marker | null>(null);

  return (
    <HoveredMarkerContext.Provider value={{ hoveredMarker, setHoveredMarker }}>
      {children}
    </HoveredMarkerContext.Provider>
  );
}

const openai = new OpenAI({
  // ok we're gonna have to delete this git repo, key is legit right here
  apiKey: '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',
  dangerouslyAllowBrowser: true// building
});

async function doAiMagic(currentPrompt: PromptState, setCurrentPrompt: (screenshot: PromptState) => void) {
  if (!currentPrompt)
    return;

  const context: ResponseCreateParamsNonStreaming['input'] = []
  for (const message of currentPrompt.context || []) {
    if (message.role == 'user') {
      const content: ResponseInputMessageContentList = [];
      if (message.content) {
        content.push({
          type: 'input_text',
          text: message.content
        })
      }
      if (message.image_url) {
        content.push({
          type: 'input_image',
          image_url: message.image_url,
          detail: 'auto'
        })
      }
      context.push({
        role: 'user',
        content
      })
    } else {
      context.push({
        role: 'assistant',
        content: message.content || ""
      })
    }
  }
  const input: ResponseCreateParamsNonStreaming['input'] = [
    {
      role: "system",
      content: `Today's date is ${new Date().toLocaleDateString()}. `
        + "You are a helpful assistant."
        + " You might be provided with an image. When communicating with the user, you may highlight things on the image to help them understand the image better."
        + ` The image size is ${currentPrompt.width}x${currentPrompt.height} (width x height).`
        + " To use the highlight tool, use the following HTML-like format: `<highlight x=100 y=100 width=200 height=200>Your label here</highlight>`"
        + " where x and y are the coordinates of the top-left corner, width and height are the size of the highlight area, and the text label is the text you want to display alongside."
        + " Make your highlight areas small and accurate as possible."
        + " You can use this tool multiple times in a single response if needed, but do not overuse it (so we can avoid image clutter). The text label should be short and consise."
    },
    ...context
  ]
  const stream = await openai.responses.create({
    model: 'gpt-4.1',
    input: input,
    stream: true
  });

  let fullResponse = '';
  const markerStyleMap = new Map<string, MarkerStyle>();
  let markers: Marker[] = [];
  const newContext = [...currentPrompt.context!];
  newContext.push({ role: 'assistant', content: "" });
  let lastDisplayedResponse = '';
  for await (const event of stream) {
    if (event.type !== 'response.output_text.delta')
      continue;
    fullResponse += (event as any).delta;

    const highlightRegex = /<highlight x=(\d+) y=(\d+) width=(\d+) height=(\d+)>(.*?)<\/highlight>/g;
    markers = [...(currentPrompt.markers || [])];
    let match;
    while ((match = highlightRegex.exec(fullResponse)) !== null) {
      const x = Math.max(0, parseInt(match[1]));
      const y = Math.max(0, parseInt(match[2]));
      const width = Math.min(parseInt(match[3]), currentPrompt.width - x);
      const height = Math.min(parseInt(match[4]), currentPrompt.height - y);
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
    if (displayResponse == lastDisplayedResponse)
      continue;
    lastDisplayedResponse = displayResponse;
    newContext[newContext.length - 1].content = displayResponse;

    setCurrentPrompt({
      ...currentPrompt,
      markers: markers,
      context: newContext
    });
  }
  newContext[newContext.length - 1].content = fullResponse;
  setCurrentPrompt({
    ...currentPrompt,
    markers: markers,
    context: newContext
  });
};

function createMarkerKey(x: number, y: number, width: number, height: number, text: string): string {
  return `${x}-${y}-${width}-${height}-${text}`;
}

export default function ScreenshotOverlay() {
  const [currentPrompt, setCurrentPrompt] = useState<PromptState | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFollowingUp, setIsFollowingUp] = useState(false);
  useEffect(() => {
    nativeApi.on('screenshot', (_ev, screenshot: ScreenshotResponse) => {
      const newCurrentPrompt = screenshot as PromptState;
      newCurrentPrompt.context = [{
        role: 'user',
        content: '',
        image_url: newCurrentPrompt.imageDataUrl
      }];
      setCurrentPrompt(newCurrentPrompt);
      setIsGenerating(true);
      doAiMagic(newCurrentPrompt, setCurrentPrompt).finally(() => setIsGenerating(false));
      setIsFollowingUp(false);
    });
    nativeApi.on('reset-screenshot', () => {
      setCurrentPrompt(null);
    });

    return () => {
      nativeApi.removeAllListeners('screenshot');
      nativeApi.removeAllListeners('reset-screenshot');
    }
  }, []);

  const onPromptEnter = (prompt: string) => {
    setIsGenerating(true);
    const newCurrentPrompt = currentPrompt ? { ...currentPrompt } : { imageDataUrl: '', width: 0, height: 0 };
    if (!newCurrentPrompt.context || newCurrentPrompt.context.length == 0) {
      newCurrentPrompt.context = [{ role: 'user', content: prompt, image_url: currentPrompt?.imageDataUrl }];
    } else {
      newCurrentPrompt.context.push({ role: 'user', content: prompt });
    }
    setCurrentPrompt(newCurrentPrompt);
    setIsFollowingUp(false);
    doAiMagic(newCurrentPrompt, setCurrentPrompt).finally(() => setIsGenerating(false));
  }

  return (
    <HoveredMarkerProvider>
      {currentPrompt && <div className='absolute m-0 p-4 w-[500px] min-h-[40px] max-h-[100%] overflow-y-auto overflow-x-hidden bottom-[166px] box-border left-1/2 transform -translate-x-1/2 rounded-3xl flex flex-col gap-2 justify-center items-center bg-black/70 backdrop-blur-sm'>
        {currentPrompt && currentPrompt.imageDataUrl && <ImageWithMarkers currentPrompt={currentPrompt} />}
        {currentPrompt && <ChatRenderer currentPrompt={currentPrompt} />}
        {isGenerating && <GeneratingDotsAnimation />}
        {!isGenerating && !isFollowingUp && currentPrompt?.context && currentPrompt.context.length > 0 && 
          <SimpleButton className="self-start" onClick={() => setIsFollowingUp(true)}>Ask a follow up</SimpleButton>
        }
        {isFollowingUp && <InputContainer onEnter={onPromptEnter} />}
      </div>}
    </HoveredMarkerProvider>
  );
}

function ImageWithMarkers({ currentPrompt }: { currentPrompt: PromptState }) {
  const { hoveredMarker, setHoveredMarker } = useHoveredMarker();

  return <div className="max-w-full max-h-[200px] relative">
    <img src={currentPrompt.imageDataUrl} alt="Screenshot" className="max-w-full max-h-[200px] h-auto object-contain rounded-3xl border-white/10 border-[2px] border-solid fade-in-200" />
    {currentPrompt.markers?.map((marker, index) => {
      const isHovered = hoveredMarker == marker;
      const onMouseOver = () => {
        if (isHovered)
          return;
        setHoveredMarker(marker);
      }
      const onMouseLeave = () => {
        if (!isHovered)
          return;
        setHoveredMarker(null);
      }
      return <div key={index} className={`absolute hover:opacity-[1] transition-all duration-200 marker-fade-in`} style={{
        left: `${(marker.x / currentPrompt.width) * 100}%`,
        top: `${(marker.y / currentPrompt.height) * 100}%`,
        width: `${(marker.width / currentPrompt.width) * 100}%`,
        height: `${(marker.height / currentPrompt.height) * 100}%`,
        backgroundColor: marker.style.color.bgColor,
        border: `1px solid ${marker.style.color.borderColor}`,
        color: 'white',
        padding: '2px 4px',
        borderRadius: '0px',
        fontSize: '12px',
        zIndex: isHovered ? 1001 : 1000,
        transform: `scale(${isHovered ? 1.1 : 1})`,
        opacity: isHovered ? 1 : 0.8,
      }} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave}>
        <div className={`p-1 ${isHovered ? 'bg-black/70' : ''} rounded-md text-white text-[10px] font-bold absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center transition-all duration-200 ${isHovered ? 'scale-[1.15]' : 'scale-[1]'} ${marker.style.textPosition === 'top' ? 'top-[-22px]' : 'bottom-[-22px]'}`}>
          {marker.text}
        </div>
      </div>
    })}
  </div>
}

function ChatRenderer({ currentPrompt }: { currentPrompt: PromptState }) {
  const { hoveredMarker, setHoveredMarker } = useHoveredMarker();

  return (
    <>
      {currentPrompt.context?.map((msg, idx) => (
        <div className={msg.role == 'user' ? "m-0 px-2 box-border w-full rounded-lg flex justify-end" : "m-0 p-0 w-full"}>
          <Markdown
            key={idx}
            rehypePlugins={[rehypeRaw]}
            disallowedElements={['script']}
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
              p: ({ children }) => <p className="my-[2px]">{children}</p>,
              h1: ({ children }) => <h1 className="my-[2px]">{children}</h1>,
              h2: ({ children }) => <h2 className="my-[2px]">{children}</h2>,
              h3: ({ children }) => <h3 className="my-[2px]">{children}</h3>,
              h4: ({ children }) => <h4 className="my-[2px]">{children}</h4>,
              h5: ({ children }) => <h5 className="my-[2px]">{children}</h5>,
              h6: ({ children }) => <h6 className="my-[2px]">{children}</h6>,
              ul: ({ children }) => <ul className="my-[2px]">{children}</ul>,
              ol: ({ children }) => <ol className="my-[2px]">{children}</ol>,
              li: ({ children }) => <li className="my-[2px]">{children}</li>,
              //@ts-ignore
              highlight: ({ children, ...props }) => {
                const { x, y, width, height } = props as any;
                if (x || y || width || height) {
                  const marker = currentPrompt.markers?.find(m => m.x == x && m.y == y && m.width == width && m.height == height);
                  if (!marker) {
                    return <></>;
                  }
                  const isHovered = hoveredMarker == marker;
                  const onMouseOver = () => {
                    if (isHovered)
                      return;
                    setHoveredMarker(marker);
                  }
                  const onMouseLeave = () => {
                    if (!isHovered)
                      return;
                    setHoveredMarker(null);
                  }
                  return <div className="flex flex-col my-[2px] gap-2 pl-2 border-l-[3px] self-start transition-transform duration-200 hover:scale-110 origin-left" style={{ borderLeftColor: marker.style.color.borderColor, borderLeftStyle: 'solid' }} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave}>
                    <span className={`text-white text-xs font-light`}>
                      {'Highlighted: '}
                      <span className={`text-white text-xs font-bold`} style={{ color: marker.style.color.borderColor }}>{marker.text}</span>
                    </span>
                  </div>
                }
                return <></>;
              },
              table: ({ children }) => <table className="my-[4px]">{children}</table>,
              tr: ({ children }) => <tr className="my-[4px]">{children}</tr>,
              th: ({ children }) => <th className="my-[4px]">{children}</th>,
              td: ({ children }) => <td className="my-[4px]">{children}</td>,
            }}
          >
            {msg.content}
          </Markdown>
        </div>
      ))}
    </>
  );
}