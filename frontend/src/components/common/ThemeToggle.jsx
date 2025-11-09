import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';

export const ThemeToggle = ({ showLabel = false }) => {
  const { theme, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="relative">
      <button
        onClick={toggleTheme}
        onMouseEnter={() => setShowMenu(true)}
        onMouseLeave={() => setShowMenu(false)}
        className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 hover:border-zinc-600 transition-all group"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Moon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
        ) : (
          <Sun className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
        )}
        {showLabel && (
          <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        )}
      </button>

      {showMenu && (
        <div
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
          className="absolute right-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 p-2 animate-fade-in z-50"
        >
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                if (value === 'system') {
                  setSystemTheme();
                } else if (value === 'light') {
                  setLightTheme();
                } else {
                  setDarkTheme();
                }
                setShowMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                theme === value
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
