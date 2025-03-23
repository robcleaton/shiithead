
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SiteHeader = () => {
  return (
    <motion.div 
      className="text-2xl font-bold text-karma-primary"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link to="/">Shithead</Link>
    </motion.div>
  );
};

export default SiteHeader;
