import { create } from "zustand";

// Weapon types
export type WeaponType = "assaultRifle" | "shotgun";

// Weapon data
interface WeaponData {
  name: string;
  damage: number;
  fireRate: number; // Shots per second
  maxAmmo: number;
  projectilesPerShot: number;
  reloadTime: number; // In seconds
}

const WEAPONS: Record<WeaponType, WeaponData> = {
  assaultRifle: {
    name: "Assault Rifle",
    damage: 10,
    fireRate: 7,
    maxAmmo: 30,
    projectilesPerShot: 1,
    reloadTime: 2,
  },
  shotgun: {
    name: "Shotgun",
    damage: 8,
    fireRate: 1.5,
    maxAmmo: 8,
    projectilesPerShot: 6,
    reloadTime: 2.5,
  },
};

interface WeaponsState {
  currentWeapon: WeaponType;
  weapons: WeaponType[];
  ammo: number;
  maxAmmo: number;
  lastFired: number;
  reloading: boolean;
  reloadStartTime: number;
  
  // Actions
  switchWeapon: () => void;
  reload: () => void;
  shoot: () => boolean;
  getCurrentWeaponData: () => WeaponData;
}

export const useWeapons = create<WeaponsState>((set, get) => ({
  currentWeapon: "assaultRifle",
  weapons: ["assaultRifle", "shotgun"],
  ammo: 30, // Starting ammo
  maxAmmo: 30, // Max ammo for current weapon
  lastFired: 0,
  reloading: false,
  reloadStartTime: 0,
  
  switchWeapon: () => {
    const { currentWeapon, weapons, reloading } = get();
    
    // Can't switch weapons while reloading
    if (reloading) return;
    
    // Find current weapon index
    const currentIndex = weapons.indexOf(currentWeapon);
    // Get next weapon (wrap around if at end)
    const nextIndex = (currentIndex + 1) % weapons.length;
    const nextWeapon = weapons[nextIndex];
    
    // Get weapon data
    const weaponData = WEAPONS[nextWeapon];
    
    set({
      currentWeapon: nextWeapon,
      maxAmmo: weaponData.maxAmmo,
      ammo: weaponData.maxAmmo, // Reset ammo on weapon switch for simplicity
    });
  },
  
  reload: () => {
    const { reloading, ammo, maxAmmo, currentWeapon } = get();
    
    // Don't reload if already reloading or ammo is full
    if (reloading || ammo === maxAmmo) return;
    
    // Get weapon data
    const weaponData = WEAPONS[currentWeapon];
    
    set({
      reloading: true,
      reloadStartTime: Date.now(),
    });
    
    // Start reload timer
    setTimeout(() => {
      set({
        reloading: false,
        ammo: maxAmmo,
      });
    }, weaponData.reloadTime * 1000);
  },
  
  shoot: () => {
    const { currentWeapon, ammo, reloading, lastFired } = get();
    
    // Check if can shoot
    if (reloading || ammo <= 0) return false;
    
    // Get weapon data
    const weaponData = WEAPONS[currentWeapon];
    
    // Check fire rate
    const now = Date.now();
    const fireInterval = 1000 / weaponData.fireRate;
    if (now - lastFired < fireInterval) return false;
    
    // Update ammo and last fired time
    set({
      ammo: ammo - 1,
      lastFired: now,
    });
    
    // Auto-reload when empty
    if (ammo - 1 <= 0) {
      setTimeout(() => get().reload(), 500);
    }
    
    return true;
  },
  
  getCurrentWeaponData: () => {
    const { currentWeapon } = get();
    return WEAPONS[currentWeapon];
  },
}));
