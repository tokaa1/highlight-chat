import { useEffect, useRef, useState } from 'react';
import OpenAI from 'openai';
import { PreloadAPI } from 'electron/preload';
import { atom, useAtom, useAtomValue } from 'jotai';

const nativeApi = (window as any).nativeApi as PreloadAPI;

const openai = new OpenAI({
  // ok we're gonna have to delete this git repo, key is legit right here
  apiKey: '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',
  dangerouslyAllowBrowser: true// building
});

const isVisibleAtom = atom(false);

export default function App() {
  const [isVisible, setIsVisible] = useAtom(isVisibleAtom);

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
    className='h-full w-full m-0 p-0 transition-opacity' 
    style={{ 
      opacity: isVisible ? 1 : 0,
      transition: isVisible ? 'opacity 200ms ease-in' : 'none'
    }}
  >
    <Header />
  </div>
}

function Header() {
  const isVisible = useAtomValue(isVisibleAtom);

  return <div className='font-sans pointer-events-auto px-8 box-border w-[430px] h-[80px] flex bg-neutral-950/10 backdrop-blur-md rounded-[35px] absolute bottom-20 left-1/2 transform -translate-x-1/2 shadow-lg items-center justify-center' style={{
    borderRadius: '35px',
    border: '1px solid transparent',
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), linear-gradient(to right, #80808077, #00000055, #ffffff44)',
    backgroundOrigin: 'border-box',
    backgroundClip: 'padding-box, border-box',
    transform: `translate(-50%, ${isVisible ? '0' : '100px'})`,
    opacity: isVisible ? 1 : 0,
    transition: isVisible ? 'transform 200ms ease-out' : 'none'
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