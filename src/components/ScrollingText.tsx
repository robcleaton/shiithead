
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
  speed = 25, // Default speed - lower is faster
  useLogoInstead = false,
  logoHeight = '34vw',
}: ScrollingTextProps) => {
  const isMobile = useIsMobile();
  
  // Calculate animation duration based on speed
  // Lower values make the animation faster
  const duration = speed;
  
  // Generate repeated content to ensure seamless scrolling
  // Using more repetitions to ensure no gaps during animation
  const repeatedContent = Array.from({ length: 30 }, (_, i) => (
    useLogoInstead ? (
      <span key={i} className="mx-4">
        <img 
          src="/assets/logo.svg" 
          alt="Shit Head Logo" 
          style={{ 
            height: logoHeight,
            maxHeight: '500px',
            minHeight: '250px',
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
      className="w-full overflow-hidden fixed bottom-0 left-0 right-0 z-10 flex items-center"
      style={{
        height: logoHeight,
        maxHeight: '500px',
        minHeight: '250px',
      }}
    >
      {/* Add the same content twice - one for initial display, one for continuous animation */}
      <div 
        className="absolute whitespace-nowrap scrolling-text-animation"
        style={{
          fontSize: useLogoInstead ? 'inherit' : fontSize,
          color,
          fontFamily: 'TuskerGrotesk',
          lineHeight: logoHeight,
          textTransform: 'uppercase',
          animationDuration: `${duration}s`,
          animationIterationCount: 'infinite', 
          animationTimingFunction: 'linear',
          animationName: 'scrollText',
          animationDelay: '0s',
          animationDirection: 'normal',
          animationFillMode: 'none',
          willChange: 'transform',
        }}
      >
        {repeatedContent}
      </div>
    </div>
  );
};

export default ScrollingText;
