import { motion } from 'framer-motion';

const GameHeader = () => {
  return (
    <motion.div 
      className="flex justify-end items-center mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Reset button has been removed */}
    </motion.div>
  );
};

export default GameHeader;
