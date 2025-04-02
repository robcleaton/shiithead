
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import Rules from "@/components/Rules";

interface SiteHeaderProps {
  showRulesButton?: boolean;
  onOpenRules?: () => void;
}

const SiteHeader = ({ showRulesButton = true, onOpenRules }: SiteHeaderProps) => {
  const [showRules, setShowRules] = useState(false);

  const handleOpenRules = () => {
    if (onOpenRules) {
      onOpenRules();
    } else {
      setShowRules(true);
    }
  };

  return (
    <div className="flex justify-between items-center">
      <motion.div
        className="shithead-logo"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/">
          <span className="sr-only">Shithead</span>
        </Link>
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
            onClick={handleOpenRules}
          >
            <BookOpen size={16} />
            Rules
          </Button>
        )}
      </motion.div>

      {/* Only render Rules component if we're not using external handler */}
      {!onOpenRules && <Rules open={showRules} onOpenChange={setShowRules} />}
    </div>
  );
};

export default SiteHeader;
