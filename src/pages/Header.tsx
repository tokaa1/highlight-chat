import { useVisibility } from "@/contexts/visibility";
import { nativeApi } from "@/util/native";
import { futuristicGradientStyle } from "@/util/styling";
import { useState } from "react";
import { useApiKey } from "@/contexts/openai";

export default function Header() {
  const { setOpenKeyPrompt, isOpenKeyPromptOpen } = useApiKey();

  return <div className='font-sans pointer-events-auto px-8 box-border w-[500px] h-[80px] flex flex-col bg-neutral-950/10 backdrop-blur-md rounded-[35px] absolute bottom-[80px] left-1/2 transform -translate-x-1/2 shadow-lg items-center justify-center' style={{
    ...futuristicGradientStyle,
  }}>
    <div className='w-full h-[40px] text-[11px] items-center justify-center flex flex-row gap-2'>
      <HeaderButton text='Screenshot' tooltip='Screenshot your screen and add it to chat' onClick={() => {
        nativeApi.doScreenshot();
      }}>
        <img src="/screenshot.png" alt="Screenshot" className="w-5 h-5 invert" />
      </HeaderButton>
      <HeaderButton text='Reset' tooltip='Resets the current chat (if any)' onClick={() => {
        nativeApi.resetScreenshot();
      }}>
        <img src="/reset.png" alt="Reset" className="w-5 h-5 invert" />
      </HeaderButton>
      <HeaderButton text='Settings' tooltip='Opens settings' onClick={() => {
        setOpenKeyPrompt(!isOpenKeyPromptOpen);
      }}>
        <img src="/settings.png" alt="Settings" className="w-5 h-5 invert" />
      </HeaderButton>
    </div>
    <div className='w-full h-[26px] text-[11px] items-center justify-center flex gap-[50px]'>
      <span className='flex items-center'>
        {/* <span className='mr-1.5 text-white'>Screenshot</span> */}
        <span className='bg-white px-1 rounded mr-1 text-black'>⌘</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>H</span>
      </span>
      <span className='flex items-center'>
        {/* <span className='mr-1.5 text-white'>Reset</span> */}
        <span className='bg-white px-1 rounded mr-1 text-black'>⌘</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>D</span>
      </span>
      <span className='flex items-center'>
        {/* <span className='mr-1.5 text-neutral-100'>Show/Hide</span> */}
        <span className='bg-white px-1 rounded mr-1 text-black'>⌘</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>B</span>
      </span>
    </div>
  </div>
}

function HeaderButton({ children, text, tooltip, onClick }: { children: React.ReactNode, text: string, tooltip: string, onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const onMouseEnter = () => {
    nativeApi.enableMouse();
    setIsHovered(true);
  }
  
  const onMouseLeave = () => {
    nativeApi.disableMouse();
    setIsHovered(false);
  }

  return (
    <div 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className='relative cursor-pointer flex items-center px-3 w-auto h-[36px] rounded-xl bg-black/25 hover:bg-white/10 transition-all duration-300 backdrop-blur-md items-center justify-center' 
      onClick={onClick}
    >
      <span className='text-xs text-white mr-[8px]'>{text}</span>
      {children}
      
      {isHovered && (
        <div className="absolute bottom-[-40px] left-1/2 transform -translate-x-1/2 px-3 py-2 bg-neutral-900/90 backdrop-blur-md rounded-lg text-white text-xs shadow-lg border border-white/10 transition-all duration-200 whitespace-nowrap">
          <div className="z-[1002] absolute top-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-neutral-900/90 rotate-45 border-l border-t border-white/10"></div>
          {tooltip}
        </div>
      )}
    </div>
  );
}