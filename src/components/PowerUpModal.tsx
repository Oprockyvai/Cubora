import React from 'react';
import { POWER_UP_DEFS, POWER_UP_ORDER } from '../data/constants';
import { PowerUpId, PowerUpInventory } from '../types/game';
import { isPowerUpUnlocked } from '../utils/powerUpManager';
import { GemIcon, LockIcon, PowerUpIcon } from './Icons';

interface PowerUpModalProps {
  open: boolean;
  inventory: PowerUpInventory;
  gems: number;
  playerLevel: number;
  onRefill: (id: PowerUpId) => void;
  onClose: () => void;
  onInteract: () => void;
}

export const PowerUpModal: React.FC<PowerUpModalProps> = ({
  open,
  inventory,
  gems,
  playerLevel,
  onRefill,
  onClose,
  onInteract,
}) => {
  if (!open) return null;

  return (
    <div
      className="over on"
      id="powerUpModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="puModalTitle"
    >
      <div className="card pu-modal-card">
        <div className="pu-modal-head">
          <div>
            <h2 id="puModalTitle">Power-Up Inventory</h2>
            <p className="pu-modal-sub">
              Optional tactical tools · Stored &amp; earned 100% offline
            </p>
          </div>
          <div className="gem">
            <GemIcon />
            <b>{gems.toLocaleString('en-US')}</b>
          </div>
        </div>

        <div className="pu-inv-list">
          {POWER_UP_ORDER.map((id) => {
            const def = POWER_UP_DEFS[id];
            const count = Math.max(0, inventory[id] || 0);
            const unlocked = isPowerUpUnlocked(id, playerLevel);
            const isFull = count >= def.maxQty;
            const canAfford = gems >= def.refillCost;

            return (
              <div
                key={id}
                className={`pu-inv-row${!unlocked ? ' locked' : ''}`}
                style={{ ['--pu-acc' as string]: def.accent }}
              >
                <span className="pu-inv-ic">
                  <PowerUpIcon id={id} />
                </span>
                <div className="pu-inv-info">
                  <div className="pu-inv-title">
                    <strong>{def.name}</strong>
                    <span className="pu-inv-stock">
                      {count}/{def.maxQty}
                    </span>
                  </div>
                  <small>{def.desc}</small>
                </div>

                {!unlocked ? (
                  <span className="pu-inv-lock">
                    <LockIcon />
                    Lv.{def.unlockLevel}
                  </span>
                ) : isFull ? (
                  <span className="pu-inv-full">Full</span>
                ) : (
                  <button
                    type="button"
                    className={`btn btn-sm pu-refill-btn${!canAfford ? ' dim' : ''}`}
                    onClick={() => {
                      onInteract();
                      onRefill(id);
                    }}
                  >
                    +1 · {def.refillCost}
                    <GemIcon />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="btn2 show btn-outline"
          id="puModalClose"
          onClick={() => {
            onInteract();
            onClose();
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};
