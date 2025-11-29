import React from 'react';

interface VirtualCursorProps {
  x: number;
  y: number;
  isClicking: boolean;
  isActive: boolean;
}

const VirtualCursor: React.FC<VirtualCursorProps> = ({ x, y, isClicking, isActive }) => {
  if (!isActive) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 flex items-center justify-center transition-transform duration-75"
      style={{
        left: 0,
        top: 0,
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      {/* Outer Ring */}
      <div
        className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${
          isClicking
            ? 'border-green-400 bg-green-400/30 scale-75'
            : 'border-fuchsia-500 bg-transparent scale-100'
        }`}
      />
      
      {/* Center Dot */}
      <div className={`absolute w-2 h-2 rounded-full ${isClicking ? 'bg-white' : 'bg-fuchsia-500'}`} />
    </div>
  );
};

export default VirtualCursor;