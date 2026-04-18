import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-all border ${
        theme === 'dark' 
          ? 'bg-slate-800 border-slate-700 text-amber-500 hover:bg-slate-700' 
          : 'bg-[#D9EAFD] border-[#9AA6B2] text-[#000000] hover:bg-[#BCCCDC]'
      }`}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <span className="text-lg leading-none">
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
