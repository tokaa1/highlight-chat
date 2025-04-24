import { useEffect, useRef, useState } from 'react';
import OpenAI from 'openai';
import { PreloadAPI } from 'electron/preload';

const nativeApi = (window as any).nativeApi as PreloadAPI;

const openai = new OpenAI({
  // ok we're gonna have to delete this git repo, key is legit right here
  apiKey: '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',
  dangerouslyAllowBrowser: true// building
});

interface Vec2 {
  x: number;
  y: number;
}

interface Rectangle {
  start: Vec2;
  end: Vec2;
}

export default function App() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = (visible: boolean) => {
      setIsVisible(visible);
    };

    nativeApi.onWindowVisibilityChange(handleVisibilityChange);

    return () => {
      nativeApi.off('window-visibility-changed', (_, visible) => handleVisibilityChange(visible));
    };
  }, []);

  return <div 
    className='h-full w-full m-0 p-0 transition-opacity duration-600' 
    style={{ opacity: isVisible ? 1 : 0 }}
  >
    <span className='absolute top-0 text-white'>{isVisible ? 'Visible' : 'Hidden'}</span>
    <Header />
  </div>
}

function TakeScreenshotOverlay({ onScreenshot }: { onScreenshot: (rectangle: Rectangle) => void }) {
  const [start, setStart] = useState<Vec2 | null>(null);
  const [end, setEnd] = useState<Vec2 | null>(null);

  useEffect(() => {
    nativeApi.enableMouse();
  }, []);

  const onMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setStart({ x: event.clientX, y: event.clientY });
  }
  const onMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!start || !end) return;
    onScreenshot({ start, end: { x: event.clientX, y: event.clientY } });
  }
  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    setEnd({ x: event.clientX, y: event.clientY });
  }

  return <div className='flex flex-col h-full w-full cursor-crosshair' onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseMove={onMouseMove}>
    {start && end && <div className='absolute top-0 left-0 w-full h-full bg-black/50' style={{
      top: Math.min(start.y, end.y),
      left: Math.min(start.x, end.x),
      width: Math.abs(start.x - end.x),
      height: Math.abs(start.y - end.y),
    }}></div>}
  </div>
}

function ScreenshotOverlay({ screenshotSize }: { screenshotSize: Rectangle }) {
  return <>
    <div className='absolute top-0 left-0 w-full h-full bg-black/10 border-blue-600 border-solid border-[1px] box-border' style={{
      top: Math.min(screenshotSize.start.y, screenshotSize.end.y),
      left: Math.min(screenshotSize.start.x, screenshotSize.end.x),
      width: Math.abs(screenshotSize.start.x - screenshotSize.end.x),
      height: Math.abs(screenshotSize.start.y - screenshotSize.end.y),
    }}></div>
    <div className='absolute top-0 left-0 w-[300px] h-[80px] bg-black rounded-xl' style={{
      top: Math.min(screenshotSize.start.y, screenshotSize.end.y) - 86,
      left: Math.min(screenshotSize.start.x, screenshotSize.end.x),
    }}></div>
  </>
}

function Header() {
  return <div className='font-sans pointer-events-auto px-8 box-border w-[430px] h-[80px] flex bg-neutral-950/10 backdrop-blur-md rounded-[35px] absolute bottom-20 left-1/2 transform -translate-x-1/2 shadow-lg items-center justify-center' style={{
    borderRadius: '35px',
    border: '1px solid transparent',
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), linear-gradient(to right, #80808077, #00000055, #ffffff44)',
    backgroundOrigin: 'border-box',
    backgroundClip: 'padding-box, border-box'
  }}>
    <div className='w-full h-[26px] text-xs items-center justify-center flex gap-4'>
      <span className='flex items-center'>
        <span className='mr-1.5 text-white'>Toggle visibility</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>⌘</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>B</span>
      </span>
      <span className='flex items-center'>
        <span className='mr-1.5 text-white'>Screenshot</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>⌘</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>H</span>
      </span>
      <span className='flex items-center'>
        <span className='mr-1.5 text-white'>Chat</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>⌘</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>D</span>
      </span>
    </div>
  </div>
}