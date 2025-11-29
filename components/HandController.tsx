import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { calculateDistance, lerp, mapRange } from '../utils/math';
import { HandLandmark } from '../types';

interface HandControllerProps {
  onCursorUpdate: (x: number, y: number, isClicking: boolean) => void;
  isActive: boolean;
  smoothing?: number;
}

const HandController: React.FC<HandControllerProps> = ({ 
  onCursorUpdate, 
  isActive, 
  smoothing = 5 
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  
  // Previous coordinates for smoothing
  const prevPos = useRef({ x: 0, y: 0 });
  
  // Configuration
  const frameReduction = 100; // equivalent to frameR in python
  
  const onResults = useCallback((results: any) => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Reset canvas
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    
    // Draw landmarks if needed (debugging view)
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 1 });
        window.drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 2 });
      }
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks: HandLandmark[] = results.multiHandLandmarks[0];
      
      // 1. Get Finger Coordinates
      // Note: MediaPipe returns normalized coordinates [0, 1]
      // Index Finger Tip (ID: 8)
      const x1 = landmarks[8].x * width;
      const y1 = landmarks[8].y * height;
      
      // Middle Finger Tip (ID: 12)
      const x2 = landmarks[12].x * width;
      const y2 = landmarks[12].y * height;

      // 2. Check Fingers Up
      // Simple heuristic: Tip y < PIP y (Coordinate system: 0 is top)
      const indexUp = landmarks[8].y < landmarks[6].y;
      const middleUp = landmarks[12].y < landmarks[10].y;

      let currentX = prevPos.current.x;
      let currentY = prevPos.current.y;
      let isClicking = false;

      // Draw bounding box for active region
      ctx.strokeStyle = "rgba(255, 0, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(frameReduction, frameReduction, width - 2 * frameReduction, height - 2 * frameReduction);

      // 3. Moving Mode: Index finger up, Middle finger down
      // Note: We check !middleUp to ensure we don't move while trying to click, 
      // but the python script allows moving while both are up until distance check.
      // Let's stick closer to the Python logic: Moving happens primarily when index is up.
      
      if (indexUp) {
        // Convert Coordinates to Screen Space
        // We use mapRange (np.interp)
        // Note: Webcam is mirrored usually, so x is inverted relative to screen if we want natural movement
        // MediaPipe usually outputs mirrored if selfie mode is on.
        // x1 is 0 on left, width on right.
        
        const x3 = mapRange(x1, frameReduction, width - frameReduction, 0, window.innerWidth);
        const y3 = mapRange(y1, frameReduction, height - frameReduction, 0, window.innerHeight);

        // Smoothing
        currentX = lerp(prevPos.current.x, x3, 1 / smoothing);
        currentY = lerp(prevPos.current.y, y3, 1 / smoothing);
        
        prevPos.current = { x: currentX, y: currentY };
      }

      // 4. Clicking Mode: Both fingers up
      if (indexUp && middleUp) {
        // Find distance
        const distance = calculateDistance(x1, y1, x2, y2);
        
        // Threshold (needs adjustment based on camera resolution)
        // Python used 40px for 640x480.
        // If we are scaling, we should normalize.
        if (distance < 40) {
          isClicking = true;
          
          // Visual feedback on canvas
          const cx = (x1 + x2) / 2;
          const cy = (y1 + y2) / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 15, 0, 2 * Math.PI);
          ctx.fillStyle = '#00FF00';
          ctx.fill();
        }
      }

      onCursorUpdate(currentX, currentY, isClicking);
    }

    ctx.restore();
  }, [onCursorUpdate, smoothing]);

  useEffect(() => {
    if (!isActive) return;

    const hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new window.Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video && handsRef.current) {
            await handsRef.current.send({ image: webcamRef.current.video });
          }
        },
        width: 640,
        height: 480,
      });
      camera.start();
      cameraRef.current = camera;
    }

    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      if (handsRef.current) handsRef.current.close();
    };
  }, [isActive, onResults]);

  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-black">
      <Webcam
        ref={webcamRef}
        audio={false}
        width={640}
        height={480}
        screenshotFormat="image/jpeg"
        className="transform scale-x-[-1]" // Mirror the video for natural interaction
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]"
      />
      <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-green-400 font-mono">
        Active Region: Magenta Box
      </div>
    </div>
  );
};

export default HandController;
