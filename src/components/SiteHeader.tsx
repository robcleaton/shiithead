
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import Rules from "@/components/Rules";

interface SiteHeaderProps {
  showRulesButton?: boolean;
}

const SiteHeader = ({ showRulesButton = true }: SiteHeaderProps) => {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="flex justify-between items-center">
      <motion.div
        className="shithead-logo text-2xl font-bold text-karma-primary"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/">Shithead</Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {showRulesButton && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setShowRules(true)}
          >
            <BookOpen size={16} />
            Rules
          </Button>
        )}
      </motion.div>

      <Rules open={showRules} onOpenChange={setShowRules} />
    </div>
  );
};

export default SiteHeader;
