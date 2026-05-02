import { useCallback } from 'react';

type SoundType = 'click' | 'correct' | 'wrong' | 'start' | 'victory' | 'pop' | 'countdown';

export const usePlacementSound = () => {
  const playSound = useCallback((type: SoundType) => {
    // In a real app, we might check a user preference from a store or localStorage
    const isEnabled = typeof window !== 'undefined' ? localStorage.getItem('sound-enabled') !== 'false' : true;
    
    if (!isEnabled) return;

    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.currentTime = 0;
    audio.play().catch(() => {
        // Ignore errors (e.g. user hasn't interacted with the page yet)
    });
  }, []);

  return { playSound };
};
