
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import Rules from "@/components/Rules";
import mobilelogo from "/assets/logo-cream.svg"; // Adjust the path if needed
import desktoplogo from "/assets/logo-black.svg"; // Adjust the path if needed

interface SiteHeaderProps {
  showRulesButton?: boolean;
}

const SiteHeader = ({ showRulesButton = true }: SiteHeaderProps) => {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="flex justify-between items-center">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/">
        {/* Mobile Logo */}
          <img
            src={mobileLogo}
            alt="Home"
            className="block md:hidden w-[180px]"
          />

          {/* Desktop Logo */}
          <img
            src={desktopLogo}
            alt="Home"
            className="hidden md:block w-[280px] lg:w-[320px] xl:w-[400px]"
          />
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
