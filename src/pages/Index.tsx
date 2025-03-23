
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import Rules from '@/components/Rules';
import { BookOpen } from 'lucide-react';

const Index = () => {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <motion.div 
          className="text-2xl font-bold text-karma-primary"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          Shithead
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setShowRules(true)}
          >
            <BookOpen size={16} />
            Rules
          </Button>
        </motion.div>
      </header>

      <main className="container mx-auto px-6 flex-1 flex flex-col items-center justify-center">
        <div className="max-w-4xl w-full text-center">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-karma-primary to-karma-accent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Shithead Card Game
          </motion.h1>
          
          <motion.p 
            className="text-xl text-karma-foreground/80 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            Play the classic Shithead card game online with friends. Create a game, share the code, and enjoy this timeless card game with beautiful animations and intuitive design.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/game">
              <Button size="lg" className="bg-karma-primary hover:bg-karma-primary/90 text-white px-8 py-6 text-lg">
                Start Playing
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>

      <footer className="container mx-auto px-6 py-8">
        <motion.div 
          className="text-center text-sm text-karma-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1 }}
        >
          <p>A beautiful implementation of the Shithead card game.</p>
        </motion.div>
      </footer>

      <Rules open={showRules} onOpenChange={setShowRules} />
    </div>
  );
};

export default Index;
