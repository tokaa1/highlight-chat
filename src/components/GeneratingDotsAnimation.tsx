import { useEffect, useState } from "react";

export default function GeneratingDotsAnimation() {
  const dotsArray = ['.', '..', '...'];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % dotsArray.length);
    }, 250); // change every 500ms

    return () => clearInterval(interval); // cleanup
  }, []);

  return (
    <div className="text-left w-full text-white text-lg font-bold font-sans">
      {dotsArray[index]}
    </div>
  );
}