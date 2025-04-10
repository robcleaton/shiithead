
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface RainingLogoProps {
  isWinner: boolean;
  count?: number;
}

interface Logo {
  id: number;
  x: number;
  delay: number;
  duration: number;
  rotation: number;
  scale: number;
}

const RainingLogos = ({ isWinner, count = 20 }: RainingLogoProps) => {
  const [logos, setLogos] = useState<Logo[]>([]);
  
  useEffect(() => {
    // Generate random logos
    const newLogos = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // random horizontal position (%)
      delay: Math.random() * 2, // random delay (s)
      duration: 3 + Math.random() * 4, // random fall duration between 3-7s
      rotation: Math.random() * 360, // random rotation
      scale: 0.2 + Math.random() * 0.3, // random size between 0.2-0.5
    }));
    
    setLogos(newLogos);
  }, [count]);

  // Use red logo for winner, black for loser
  const logoSrc = isWinner ? '/assets/logo-mark-red.svg' : '/assets/logo-mark-black.svg';

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-10">
      {logos.map((logo) => (
        <motion.img
          key={logo.id}
          src={logoSrc}
          alt="Logo"
          className="absolute"
          style={{
            left: `${logo.x}%`,
            top: '-50px', // Start above the screen
            width: '50px',
            height: 'auto',
          }}
          initial={{
            y: -100,
            x: 0,
            rotate: 0,
            opacity: 0.7,
            scale: logo.scale,
          }}
          animate={{
            y: '120vh', // Animate to below the screen
            x: Math.sin(logo.id) * 100, // Add some horizontal movement
            rotate: logo.rotation,
            opacity: 0.5,
          }}
          transition={{
            duration: logo.duration,
            delay: logo.delay,
            ease: 'linear',
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
};

export default RainingLogos;
