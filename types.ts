export interface Point {
  x: number;
  y: number;
}

export interface CursorState {
  x: number;
  y: number;
  isClicking: boolean;
  isActive: boolean;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

// MediaPipe Hands global types (since we load via CDN for simplicity in this env)
declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}
