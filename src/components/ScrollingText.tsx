
import { useIsMobile } from '@/hooks/use-mobile';
import './ScrollingText.css';

interface ScrollingTextProps {
  text?: string;
  fontSize?: string;
  color?: string;
  speed?: number;
  useLogoInstead?: boolean;
  logoHeight?: string;
}

const ScrollingText = ({
  text = "Shit head",
  fontSize = '30vw',
  color = '#FEFFF1',
  speed = 50,
  useLogoInstead = false,
  logoHeight = '34vw',
}: ScrollingTextProps) => {
  const isMobile = useIsMobile();
  
  // Calculate animation duration based on speed and device type
  // Mobile devices need a different duration to maintain visual consistency
  const duration = isMobile ? speed * 0.5 : speed;
  
  // Generate repeated content to ensure seamless scrolling
  const repeatedContent = Array.from({ length: 20 }, (_, i) => (
    useLogoInstead ? (
      <span key={i} className="mx-8">
        <img 
          src="/assets/logo.svg" 
          alt="Shit Head Logo" 
          style={{ 
            height: logoHeight,
            maxHeight: '500px',
            maxWidth: 'fit-content',
            display: 'inline-block'
          }} 
        />
      </span>
    ) : (
      <span key={i} className="mx-2">{text}</span>
    )
  ));

  return (
    <div 
      className="w-full overflow-hidden relative flex items-center"
      style={{
        height: logoHeight,
        maxHeight: '500px',
      }}
    >
      <div 
        className="absolute whitespace-nowrap scrolling-text-animation"
        style={{
          fontSize: useLogoInstead ? 'inherit' : fontSize,
          color,
          fontFamily: 'TuskerGrotesk',
          lineHeight: logoHeight,
          textTransform: 'uppercase',
          animationDuration: `${duration}s`,
          animationIterationCount: 'infinite', // Ensure animation repeats infinitely
          animationTimingFunction: 'linear',   // Ensure smooth scrolling
          animationName: 'scrollText',         // Name of the animation
          animationDelay: '0s',                // Start immediately
          animationDirection: 'normal',        // Always move in the same direction
          animationFillMode: 'none',           // Don't retain styles before/after
          willChange: 'transform',             // Optimize for animation performance
        }}
      >
        {repeatedContent}
      </div>
    </div>
  );
};

export default ScrollingText;
