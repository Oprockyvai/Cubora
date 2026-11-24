import React, { useEffect, useState } from 'react';
import { BrandMarkSvg } from './Icons';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [fading, setFading] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setFading(true), 950);
    const t2 = window.setTimeout(() => {
      setRemoved(true);
      onComplete?.();
    }, 1450);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onComplete]);

  if (removed) return null;

  return (
    <div
      id="splash"
      className={fading ? 'out' : undefined}
      onClick={() => {
        setFading(true);
        window.setTimeout(() => {
          setRemoved(true);
          onComplete?.();
        }, 250);
      }}
    >
      <div className="sp-ring" />
      <BrandMarkSvg />
      <div className="wm">
        BLOCK CLASH<small>TACTILE PUZZLE</small>
      </div>
    </div>
  );
};
