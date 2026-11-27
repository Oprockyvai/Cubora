import React from 'react';
import { POWER_UP_DEFS, POWER_UP_ORDER } from '../data/constants';
import { PowerUpId, PowerUpInventory } from '../types/game';
import { isPowerUpUnlocked } from '../utils/powerUpManager';
import { LockIcon, PowerUpIcon } from './Icons';

interface PowerUpBarProps {
  inventory: PowerUpInventory;
  playerLevel: number;
  activeTargetTool: PowerUpId | null;
  canUndo: boolean;
  hasOccupiedCells: boolean;
  busy: boolean;
  paused: boolean;
  onActivatePowerUp: (id: PowerUpId) => void;
  onCancelTargetMode: () => void;
  onOpenWorkshop: () => void;
}

export const PowerUpBar: React.FC<PowerUpBarProps> = ({
  inventory,
  playerLevel,
  activeTargetTool,
  canUndo,
  hasOccupiedCells,
  busy,
  paused,
  onActivatePowerUp,
  onCancelTargetMode,
  onOpenWorkshop,
}) => {
  return (
    <div className="powerbar-wrap" aria-label="Power-ups bar">
      <div className="powerbar">
        {POWER_UP_ORDER.map((id) => {
          const def = POWER_UP_DEFS[id];
          const count = Math.max(0, inventory[id] || 0);
          const unlocked = isPowerUpUnlocked(id, playerLevel);
          const isActive = activeTargetTool === id;

          const missingCondition =
            (id === 'undo' && !canUndo) ||
            ((id === 'hammer' || id === 'colorBlast' || id === 'boom') &&
              !hasOccupiedCells);

          // Note: when count === 0 and unlocked, button stays clickable to open Refill workshop!
          const isLocked = !unlocked;
          const isDisabled = busy || paused || isLocked || (count > 0 && missingCondition);

          return (
            <button
              key={id}
              type="button"
              id={`pu-${id}`}
              className={`pu-btn${isActive ? ' active' : ''}${
                count === 0 && unlocked ? ' empty' : ''
              }${isLocked ? ' locked' : ''}`}
              style={{ ['--pu-acc' as string]: def.accent }}
              disabled={isDisabled}
              aria-label={`${def.name}${
                isLocked
                  ? ` unlocks at level ${def.unlockLevel}`
                  : ` (${count} remaining)`
              }`}
              title={
                isLocked
                  ? `Unlocks at Lv.${def.unlockLevel}`
                  : count === 0
                  ? `Refill ${def.name} in Workshop`
                  : def.desc
              }
              onClick={() => {
                if (isActive) {
                  onCancelTargetMode();
                } else if (count === 0 && unlocked) {
                  onOpenWorkshop();
                } else {
                  onActivatePowerUp(id);
                }
              }}
            >
              <span className="pu-ic">
                <PowerUpIcon id={id} />
              </span>
              <span className="pu-lbl">{def.shortName}</span>
              <span className={`pu-cnt${count === 0 ? ' zero' : ''}`}>
                {isLocked ? (
                  <LockIcon className="pu-lk" />
                ) : count === 0 ? (
                  '+'
                ) : (
                  count
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
