import { useState, useEffect } from "react";
import { useAudio } from "@/lib/stores/useAudio";

interface SoundProps {
  src: string;
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
}

// Component for playing individual sounds
export const Sound = ({ src, volume = 1, loop = false, autoplay = false }: SoundProps) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { isMuted } = useAudio();
  
  useEffect(() => {
    const audioElement = new Audio(src);
    audioElement.volume = volume;
    audioElement.loop = loop;
    
    if (autoplay && !isMuted) {
      audioElement.play().catch(err => console.log("Audio play prevented:", err));
    }
    
    setAudio(audioElement);
    
    // Clean up
    return () => {
      audioElement.pause();
      audioElement.currentTime = 0;
    };
  }, [src, volume, loop, autoplay, isMuted]);
  
  // Update mute state when it changes
  useEffect(() => {
    if (audio) {
      audio.muted = isMuted;
    }
  }, [isMuted, audio]);
  
  return null;
};

interface SoundEffectsProps {
  children?: React.ReactNode;
}

// Component for managing all game sound effects
export const SoundEffects = ({ children }: SoundEffectsProps) => {
  const { isMuted, backgroundMusic } = useAudio();
  
  // Start background music
  useEffect(() => {
    if (backgroundMusic && !isMuted) {
      backgroundMusic.play().catch(err => console.log("Audio play prevented:", err));
    }
    
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
    };
  }, [backgroundMusic, isMuted]);
  
  return <>{children}</>;
};

export default SoundEffects;
