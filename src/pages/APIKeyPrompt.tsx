import SimpleButton from "@/components/SimpleButton";
import { nativeApi } from "@/util/native";
import { useEffect, useRef, useState } from "react";
import { useApiKey } from "@/contexts/openai";

export default function APIKeyPrompt() {
  const { setApiKey, setOpenKeyPrompt, apiKey } = useApiKey();

  useEffect(() => {
    return () => nativeApi.disableMouse();
  }, []);

  return (
    <div className='w-[30%] h-auto p-[14px] bg-black/50 flex flex-col items-center justify-center absolute top-[20px] left-[50%] transform -translate-x-1/2 rounded-3xl border-white/20 border-solid'>
      <span className='text-white text-md font-semibold italic text-center'>Hey there! To continue, please enter your OpenAI API key.</span>
      <span className='text-white text-xs font-light italic text-center'>All data is only stored locally on your machine.</span>
      <KeyInput onEnter={(key) => {
        setApiKey(key);
        setOpenKeyPrompt(false);
      }} apiKey={apiKey || ''} />
    </div>
  );
}

function KeyInput({onEnter, apiKey}: {onEnter: (key: string) => void, apiKey: string}) {
  const [isEmpty, setIsEmpty] = useState(!apiKey);
  const inputRef = useRef<HTMLInputElement>(null);

  return <>
    <input 
      ref={inputRef}
      onMouseEnter={() => nativeApi.enableMouse()} 
      onMouseLeave={() => nativeApi.disableMouse()} 
      type='password'
      className='cursor-text w-[88%] h-[30px] mt-2 px-[8px] animate-pulse focus:animate-none bg-black/50 rounded-lg text-white text-xs font-sans outline-none border-green-400 border-solid border-[1px] rounded-2xl focus:outline-none' 
      placeholder='sk-... (OpenAI API Key)'
      defaultValue={apiKey}
      onChange={(e) => {
        const val = (e.target as HTMLInputElement).value;
        if (val.length > 0) {
          setIsEmpty(false);
        } else {
          setIsEmpty(true);
        }
      }}
      onKeyDown={(e) => {
        const val = (e.target as HTMLInputElement).value;
        if (e.key === 'Enter' && val.length > 0) {
          onEnter(val);
          return;
        }
      }}
    />
    {!isEmpty && (
      <SimpleButton className='mt-2' onClick={() => {
        onEnter(inputRef.current?.value || '');
      }}>
        <span className='text-white text-xs font-light italic text-center'>Done!</span>
      </SimpleButton>
    )}
  </>;
}