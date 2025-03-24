
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

interface GameHeaderProps {
  onOpenRules: () => void;
}

const GameHeader = ({ onOpenRules }: GameHeaderProps) => {
  return (
    <motion.div 
      className="flex justify-between items-center mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="font-bold text-xl text-karma-primary">Shithead</div>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2"
        onClick={onOpenRules}
      >
        <BookOpen size={16} />
        Rules
      </Button>
    </motion.div>
  );
};

export default GameHeader;
