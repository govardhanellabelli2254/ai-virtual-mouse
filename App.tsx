import React, { useState, useCallback, useEffect, useRef } from 'react';
import HandController from './components/HandController';
import VirtualCursor from './components/VirtualCursor';
import { MousePointer2, Settings, Power, Zap, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, isClicking: false });
  const [smoothing, setSmoothing] = useState(5);
  const [clickCount, setClickCount] = useState(0);
  
  // Track previous click state to trigger "onClick" events only on the rising edge
  const prevClickingRef = useRef(false);

  // Helper to trigger actual click events on DOM elements
  const triggerClick = useCallback((x: number, y: number) => {
    // Get the element at the coordinates
    const el = document.elementFromPoint(x, y);
    
    if (el) {
      // Use dispatchEvent to simulate a click, which works on all Elements (including SVGs)
      // whereas .click() is only available on HTMLElement types.
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y
      });
      el.dispatchEvent(clickEvent);
      
      // Add ripple effect or visual feedback
      const ripple = document.createElement('div');
      ripple.className = 'fixed rounded-full bg-white/50 pointer-events-none z-[60] animate-ping';
      ripple.style.left = `${x - 10}px`;
      ripple.style.top = `${y - 10}px`;
      ripple.style.width = '20px';
      ripple.style.height = '20px';
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    }
  }, []);

  const handleCursorUpdate = useCallback((x: number, y: number, isClicking: boolean) => {
    setCursor({ x, y, isClicking });
    
    // Trigger click on rising edge (when it goes from false to true)
    if (isClicking && !prevClickingRef.current) {
        triggerClick(x, y);
    }
    prevClickingRef.current = isClicking;
  }, [triggerClick]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-fuchsia-500 selection:text-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-gray-900/90 backdrop-blur-md border-b border-gray-800 z-40 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MousePointer2 className="text-fuchsia-500" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-fuchsia-500 to-purple-600 bg-clip-text text-transparent">
              AI Virtual Mouse
            </h1>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all ${
              isActive 
                ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20' 
                : 'bg-green-500/10 text-green-400 border border-green-500/50 hover:bg-green-500/20'
            }`}
          >
            <Power size={18} />
            {isActive ? 'Stop Camera' : 'Start Camera'}
          </button>
        </div>
      </header>

      <main className="pt-24 pb-10 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Camera View */}
        <div className="flex flex-col gap-4">
          <div className="bg-gray-800/50 p-1 rounded-2xl border border-gray-700">
             {isActive ? (
               <HandController 
                 onCursorUpdate={handleCursorUpdate} 
                 isActive={isActive}
                 smoothing={smoothing}
               />
             ) : (
               <div className="aspect-[4/3] rounded-xl bg-black flex flex-col items-center justify-center text-gray-500 gap-4 border border-gray-700">
                 <Power size={48} className="opacity-50" />
                 <p>Camera is turned off</p>
               </div>
             )}
          </div>

          {/* Controls */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
             <div className="flex items-center gap-2 mb-4 text-gray-300">
               <Settings size={20} />
               <h2 className="font-semibold">Settings</h2>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="flex justify-between text-sm text-gray-400 mb-2">
                   <span>Smoothing Factor</span>
                   <span>{smoothing}</span>
                 </label>
                 <input 
                   type="range" 
                   min="1" 
                   max="20" 
                   value={smoothing}
                   onChange={(e) => setSmoothing(Number(e.target.value))}
                   className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                 />
                 <p className="text-xs text-gray-500 mt-1">Higher values = smoother movement but more delay.</p>
               </div>
             </div>
          </div>
        </div>

        {/* Right Column: Interaction Playground */}
        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-xl">
             <div className="flex items-center gap-2 mb-6">
               <Zap size={24} className="text-yellow-400" />
               <h2 className="text-2xl font-bold">Playground</h2>
             </div>
             <p className="text-gray-400 mb-8 leading-relaxed">
                Use your index finger to move the cursor. Raise both your index and middle fingers to enter "Click Mode", 
                then pinch them together (distance &lt; 40px) to click buttons below.
             </p>

             <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={() => setClickCount(c => c + 1)}
                  className="p-8 bg-gray-700/50 hover:bg-fuchsia-600/20 hover:border-fuchsia-500 border-2 border-dashed border-gray-600 rounded-xl transition-all group"
               >
                 <span className="block text-3xl font-bold text-white group-hover:scale-110 transition-transform mb-2">
                   {clickCount}
                 </span>
                 <span className="text-gray-400 group-hover:text-fuchsia-300">Click Counter</span>
               </button>

               <button 
                  className="p-8 bg-gray-700/50 hover:bg-blue-600/20 hover:border-blue-500 border-2 border-dashed border-gray-600 rounded-xl transition-all group"
                  onClick={() => alert("Hello from the Virtual Mouse!")}
               >
                 <span className="block text-3xl mb-2 group-hover:animate-bounce">👋</span>
                 <span className="text-gray-400 group-hover:text-blue-300">Say Hello</span>
               </button>
             </div>

             <div className="mt-6 flex flex-wrap gap-2">
               {[1, 2, 3, 4, 5].map((i) => (
                 <button 
                   key={i}
                   className="flex-1 py-4 bg-gray-700 hover:bg-green-600 text-gray-300 hover:text-white rounded-lg transition-colors font-medium"
                   onClick={(e) => {
                     const btn = e.currentTarget;
                     btn.textContent = "Clicked!";
                     setTimeout(() => btn.textContent = `Btn ${i}`, 1000);
                   }}
                 >
                   Btn {i}
                 </button>
               ))}
             </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-4 text-gray-300">
               <Activity size={20} />
               <h2 className="font-semibold">Debug Info</h2>
             </div>
             <div className="grid grid-cols-2 gap-4 text-sm font-mono">
               <div className="bg-black/40 p-3 rounded border border-gray-700">
                 <span className="text-gray-500 block">X Coordinate</span>
                 <span className="text-fuchsia-400 text-lg">{cursor.x.toFixed(0)}px</span>
               </div>
               <div className="bg-black/40 p-3 rounded border border-gray-700">
                 <span className="text-gray-500 block">Y Coordinate</span>
                 <span className="text-fuchsia-400 text-lg">{cursor.y.toFixed(0)}px</span>
               </div>
               <div className="col-span-2 bg-black/40 p-3 rounded border border-gray-700 flex justify-between items-center">
                 <span className="text-gray-500">Click State</span>
                 <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${cursor.isClicking ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                   {cursor.isClicking ? 'CLICKING' : 'HOVERING'}
                 </span>
               </div>
             </div>
          </div>
        </div>
      </main>

      {/* The Virtual Cursor Overlay */}
      <VirtualCursor 
        x={cursor.x} 
        y={cursor.y} 
        isClicking={cursor.isClicking} 
        isActive={isActive} 
      />
    </div>
  );
};

export default App;