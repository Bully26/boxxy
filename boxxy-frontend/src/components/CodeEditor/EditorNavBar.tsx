import { BoxColor } from '@/types/codeBox';
import { motion } from 'framer-motion';
import { Eye, Filter, Play, Loader2 } from 'lucide-react';

interface EditorNavBarProps {
  filterColor: BoxColor | null;
  submitColor: BoxColor | null;
  isLoading: boolean;
  onShowAll: () => void;
  onFilterByColor: (color: BoxColor) => void;

  // this is the point where you submit color for exectution 
  onSubmitByColor: (color: BoxColor) => void;
}

const COLORS: BoxColor[] = ['blue', 'green', 'orange', 'purple'];

const colorStyles: Record<BoxColor, { bg: string; ring: string }> = {
  blue: { bg: 'bg-box-blue', ring: 'ring-box-blue' },
  green: { bg: 'bg-box-green', ring: 'ring-box-green' },
  orange: { bg: 'bg-box-orange', ring: 'ring-box-orange' },
  purple: { bg: 'bg-box-purple', ring: 'ring-box-purple' }
};

export function EditorNavBar({
  filterColor,
  isLoading,
  onShowAll,
  onFilterByColor,
  onSubmitByColor
}: EditorNavBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-secondary border-b border-border">
      {/* Left: View Controls */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShowAll}
          className={`nav-button flex items-center gap-2 ${
            filterColor === null ? 'nav-button-active' : ''
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Show All</span>
        </motion.button>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
          <div className="flex items-center gap-1">
            {COLORS.map(color => (
              <motion.button
                key={`filter-${color}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onFilterByColor(color)}
                className={`w-6 h-6 rounded-md transition-all flex items-center justify-center ${
                  colorStyles[color].bg
                } ${
                  filterColor === color 
                    ? 'ring-2 ring-offset-2 ring-offset-secondary ring-foreground/50' 
                    : 'opacity-60 hover:opacity-100'
                }`}
                title={`Filter by ${color}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right: Submit Controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Run:</span>
        {COLORS.map(color => (
          <motion.button
            key={`submit-${color}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSubmitByColor(color)}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
              colorStyles[color].bg
            } text-white ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" fill="currentColor" />
            )}
            <span className="capitalize">{color}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
