import { useEffect } from 'react';
import { Controls } from '@/App';
import { useGame } from '@/lib/stores/useGame';
import { useKeyboardControls } from '@react-three/drei';
import { useWeapons } from '@/lib/stores/useWeapons';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useBuilding } from '@/lib/stores/useBuilding';
import * as THREE from 'three';

type KeyboardSubscriber = (
  selector: (state: any) => any,
  callback: (value: any) => void
) => () => void;

// This component handles keyboard input without rendering anything
const KeyboardController = ({ camera }: { camera: THREE.Camera }) => {
  const { phase } = useGame();
  const weaponsState = useWeapons();
  const playerState = usePlayer();
  const buildingState = useBuilding();
  
  // Subscribe to button presses without causing rerenders
  useEffect(() => {
    // Get the keyboard controls API
    const controls = useKeyboardControls<Controls>();
    // The subscribe function is the third element in older versions, 
    // or might be accessed through the first element in newer versions
    const subscribe = 
      (controls as any)[2] || // For older versions of drei
      (controls as any)[0]?.subscribe; // For newer versions
      
    if (!subscribe) {
      console.error("Could not access keyboard controls subscribe function");
      return;
    }
    
    // Switch weapon handler
    const unsubWeaponSwitch = subscribe(
      (state: any) => state.weaponSwitch,
      (pressed: boolean) => {
        if (pressed && phase === "playing") {
          weaponsState.switchWeapon();
          console.log(`Switched to ${weaponsState.currentWeapon}`);
        }
      }
    );

    // Reload handler
    const unsubReload = subscribe(
      (state: any) => state.reload,
      (pressed: boolean) => {
        if (pressed && phase === "playing") {
          weaponsState.reload();
          console.log("Reloading weapon");
        }
      }
    );

    // Shoot handler
    const unsubShoot = subscribe(
      (state: any) => state.shoot,
      (pressed: boolean) => {
        if (pressed && phase === "playing") {
          const canShoot = weaponsState.shoot();
          if (canShoot) {
            console.log("Player shooting");
            playerState.createProjectile();
          }
        }
      }
    );

    // Build handler
    const unsubBuild = subscribe(
      (state: any) => state.build,
      (pressed: boolean) => {
        if (pressed && phase === "playing") {
          // Create a building element in front of the player
          const position = new THREE.Vector3();
          // Set position 3 units in front of player
          position.set(0, 0, -3).applyMatrix4(camera.matrixWorld);
          position.y = 0; // Place on ground
          
          buildingState.placeStructure({
            position: [position.x, position.y, position.z],
            type: "wall"
          });
          console.log("Building structure");
        }
      }
    );

    // Start game handler
    const unsubStartGame = subscribe(
      (state: any) => state.startGame,
      (pressed: boolean) => {
        if (pressed && phase === "ready") {
          useGame.getState().start();
        }
      }
    );

    return () => {
      // Clean up all subscriptions
      if (unsubWeaponSwitch) unsubWeaponSwitch();
      if (unsubReload) unsubReload();
      if (unsubShoot) unsubShoot();
      if (unsubBuild) unsubBuild();
      if (unsubStartGame) unsubStartGame();
    };
  }, [camera, phase, playerState, weaponsState, buildingState]);

  // This component doesn't render anything
  return null;
};

export default KeyboardController;