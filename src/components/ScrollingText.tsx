
interface ScrollingTextProps {
  text: string;
  fontSize?: string;
  color?: string;
  speed?: number;
  letterSpacing?: string;
  wordSpacing?: string;
}

const ScrollingText = ({
  text,
  fontSize = '30vw',
  color = '#FEFFF1',
  speed = 50,
  letterSpacing = 'normal',
  wordSpacing = 'normal',
}: ScrollingTextProps) => {
  // Calculate animation duration based on speed (higher number = slower)
  const duration = speed;
  
  // Generate repeated text to ensure seamless scrolling
  const repeatedText = Array.from({ length: 20 }, (_, i) => (
    <span key={i} className="mx-2">{text}</span>
  ));

  return (
    <div 
      className="w-full overflow-hidden relative flex items-center"
      style={{
        height: '34vw',
      }}
    >
      <div 
        className="absolute whitespace-nowrap scrolling-text-animation"
        style={{
          fontSize,
          color,
          fontFamily: 'TuskerGrotesk',
          lineHeight: '34vw',
          textTransform: 'uppercase',
          letterSpacing,
          wordSpacing,
          animationDuration: `${duration}s`,
        }}
      >
        {repeatedText}
      </div>
    </div>
  );
};

export default ScrollingText;
