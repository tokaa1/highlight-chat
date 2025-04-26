import { useVisibility } from "@/contexts/visibility";
import { futuristicGradientStyle } from "@/util/styling";

export default function Header() {
  const isVisible = useVisibility();

  return <div className='font-sans pointer-events-auto px-8 box-border w-[430px] h-[80px] flex flex-col bg-neutral-950/10 backdrop-blur-md rounded-[35px] absolute bottom-[80px] left-1/2 transform -translate-x-1/2 shadow-lg items-center justify-center' style={{
    ...futuristicGradientStyle,
    transform: `translate(-50%, ${isVisible ? '0' : '100px'})`,
    opacity: isVisible ? 1 : 0,
    transition: isVisible ? 'transform 200ms ease-out' : 'none'
  }}>
    <div className='w-full h-[26px] text-xs items-center justify-center flex gap-4'>
      <span className='flex items-center'>
        <span className='mr-1.5 text-white'>New Screenshot</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>⌘</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>H</span>
      </span>
      <span className='flex items-center'>
        <span className='mr-1.5 text-white'>Reset Screenshot</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>⌘</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>D</span>
      </span>
    </div>
    <div className='w-full h-[20px] text-[10px] items-center justify-center flex gap-4'>
      <span className='flex items-center'>
        <span className='mr-1.5 text-neutral-100'>Show/Hide</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>⌘</span>
        <span className='bg-white px-1 rounded mr-1 text-black'>B</span>
      </span>
    </div>
  </div>
}