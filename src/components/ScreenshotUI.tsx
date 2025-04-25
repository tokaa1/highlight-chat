import { useVisibility } from "@/contexts/visibility";
import { nativeApi } from "@/util/native";
import { useEffect, useState } from "react";

export default function ScreenshotOverlay() {
  const isVisible = useVisibility();
  const [isMouseEnabled, setIsMouseEnabled] = useState(false);
  const [screenshotRect, setScreenshotRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  useEffect(() => setIsMouseEnabled(true), [])
  useEffect(() => {
    if (isMouseEnabled) {
      nativeApi.enableMouse();
    } else {
      nativeApi.disableMouse();
    }
    
    return () => nativeApi.disableMouse();
  }, [isMouseEnabled]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    setStartPoint({ x: startX, y: startY });
    setScreenshotRect({
      x: startX,
      y: startY,
      width: 0,
      height: 0
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const width = currentX - startPoint.x;
    const height = currentY - startPoint.y;
    
    setScreenshotRect({
      x: width > 0 ? startPoint.x : currentX,
      y: height > 0 ? startPoint.y : currentY,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="absolute w-full h-full bg-black/10 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute bg-blue-500/30" style={{
        top: screenshotRect.y,
        left: screenshotRect.x,
        width: screenshotRect.width,
        height: screenshotRect.height
      }}></div>
    </div>
  );
}