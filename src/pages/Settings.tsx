import SimpleButton from "@/components/SimpleButton";
import { nativeApi } from "@/util/native";
import { useEffect, useRef, useState } from "react";
import { useOpenAI } from "@/contexts/openai";
import useApiKey from "@/contexts/settings";
import usePages from "@/contexts/pages";

export default function APIKeyPrompt() {
  const { apiKey, setApiKey } = useApiKey();
  const { isOpen } = usePages();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Set visible after component mounts to trigger animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const isSettingsOpen = isOpen('settings');

  return (
    <div 
      className={`w-[500px] h-[280px] z-[9999] flex flex-col px-6 p-2 box-border rounded-[35px] bottom-[166px] bg-neutral-900/80 absolute left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-out ${
        isVisible && isSettingsOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="w-full h-auto py-0.5 box-borderflex-col items-center justify-center font-sans text-2xl">
        {"Settings"}
      </div>
      <div className="w-full h-auto box-borderflex-col items-center justify-center font-sans text-xs italic text-neutral-400">
        {"Customize your experience!"}
      </div>
      <div className="w-full h-[1px] bg-neutral-400 mb-2 mt-3 box-border px-3" />

      <label className="w-full h-auto py-2 box-borderflex-col items-center justify-center font-sans text-xs text-neutral-400">
        {"OpenAI API Key"}
      </label>
      <ElectronInput label="Enter your OpenAI API Key" placeholder={apiKey || ''} password={true} onChange={(value) => setApiKey(value)} />
    </div>
  );
}

function ElectronInput({ label, placeholder, password, onChange }: { label: string, placeholder: string, password: boolean, onChange: (value: string) => void }) {
  const [value, setValue] = useState(placeholder);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange(e.target.value);
  };
  
  return (
    <div 
      className="w-full h-auto px-4 py-2 box-borderflex-col items-center bg-white/20 box-border justify-center font-sans text-xs text-neutral-400 rounded-xl"
      onMouseEnter={() => {
        nativeApi.enableMouse();
      }}
      onMouseLeave={() => {
        nativeApi.disableMouse();
      }}
    >
      <input
        type={password ? 'password' : 'text'}
        value={value}
        onChange={handleChange}
        placeholder={label}
        className="w-full bg-transparent border-none outline-none text-white font-sans text-xs"
      />
    </div>
  );
}