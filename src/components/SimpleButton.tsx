import { nativeApi } from "@/util/native";

export default function SimpleButton({ children, className, disabled, onClick }: { children: React.ReactNode, className?: string, disabled?: boolean, onClick: () => void }) {
  const onMouseEnter = () => {
    nativeApi.enableMouse();
  }
  const onMouseLeave = () => {
    nativeApi.disableMouse();
  }
  return (
    <div 
      onClick={onClick} 
      onMouseEnter={onMouseEnter} 
      onMouseLeave={onMouseLeave} 
      className={`cursor-pointer h-[16px] text-xs text-center bg-neutral-800/50 hover:bg-neutral-800/80 border-white/10 border-[1px] border-solid font-sans font-bold text-white px-3 py-2 rounded-md ${className} ${disabled ? 'opacity-50' : ''}`}
    >
      {children}
    </div>
  );
}