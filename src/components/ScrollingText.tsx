
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
  // Calculate animation duration based on speed (higher number = slower)
  const duration = speed;
  
  // Generate repeated text to ensure seamless scrolling
  const repeatedContent = Array.from({ length: 20 }, (_, i) => (
    useLogoInstead ? (
      <span key={i} className="mx-8">
        <img src="/assets/logo-full-red.svg" alt="Shit Head Logo" style={{ height: logoHeight, display: 'inline-block' }} />
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
        }}
      >
        {repeatedContent}
      </div>
    </div>
  );
};

export default ScrollingText;
