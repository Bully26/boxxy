import { BoxColor } from '@/types/codeBox';
import { motion } from 'framer-motion';

interface ColorSelectorProps {
  currentColor: BoxColor;
  onColorChange: (color: BoxColor) => void;
}

const COLORS: BoxColor[] = ['blue', 'green', 'orange', 'purple'];

const colorClasses: Record<BoxColor, string> = {
  blue: 'color-dot-blue',
  green: 'color-dot-green',
  orange: 'color-dot-orange',
  purple: 'color-dot-purple'
};

export function ColorSelector({ currentColor, onColorChange }: ColorSelectorProps) {
  return (
    <div className="flex items-center gap-1.5">
      {COLORS.map(color => (
        <motion.button
          key={color}
          onClick={() => onColorChange(color)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className={`w-4 h-4 rounded-full transition-all ${colorClasses[color]} ${
            currentColor === color 
              ? 'ring-2 ring-offset-1 ring-offset-background ring-foreground/50' 
              : 'opacity-60 hover:opacity-100'
          }`}
          title={`Set color to ${color}`}
        />
      ))}
    </div>
  );
}
