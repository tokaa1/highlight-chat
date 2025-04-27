import { nativeApi } from "@/util/native";
import { useState } from "react";

export default function InputContainer({ onEnter }: { onEnter: (prompt: string) => void }) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow shift+enter to create a new line
        setInputValue(prev => prev + '\n');
      } else {
        // Just enter calls onEnter
        onEnter(inputValue);
        setInputValue('');
        nativeApi.disableMouse();
      }
    }
  };

  const handleMouseEnter = () => {
    nativeApi.enableMouse();
  };
  const handleMouseLeave = () => {
    nativeApi.disableMouse();
  };

  return <textarea
    value={inputValue}
    onChange={(e) => {
      setInputValue(e.target.value);
    }}
    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => handleKeyDown(e as unknown as React.KeyboardEvent<HTMLInputElement>)}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
    className="box-border font-semibold font-sans w-full h-[36px] min-h-[36px] bg-transparent outline-none focus:border-white/40 border-white/20 border-[1px] border-solid hover:bg-white/10 text-m text-white rounded-lg p-2 transition-all duration-200 resize-none overflow-hidden cursor-text"
    placeholder="Ask anything"
  />
}