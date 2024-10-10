import React from 'react';

interface HotkeyProps {
  keys: string[];
  isDarkBackground?: boolean;
  modifier?: boolean;
}

export const Hotkey: React.FC<HotkeyProps> = ({ keys, isDarkBackground = false, modifier = false}) => {
  const textColor = isDarkBackground ? 'text-white' : 'text-black';
  const borderColor = isDarkBackground ? 'border-gray-600' : 'border-gray-300';
  const isMac = typeof window !== 'undefined' && window.navigator.userAgent.includes('Macintosh');
  const modifierText = isMac ? "⌘" : "⌃"

  const displayKeys = modifier ? [modifierText, ...keys] : keys;

  return (
    <span className="inline-flex gap-1">
      {displayKeys.map((key, index) => (
        <kbd
          key={index}
          className={`inline-flex items-center justify-center rounded border ${borderColor} ${textColor} font-sans text-[10px] font-medium h-4 w-4 ${index === 0 ? 'ml-2' : 'ml-[1px]'}`}
        >
          {key}
        </kbd>
      ))}
    </span>
  );
};
