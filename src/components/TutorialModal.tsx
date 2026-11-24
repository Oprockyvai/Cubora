import React, { useEffect, useState } from 'react';
import { BrandMarkSvg, GemIcon, GiftIcon, ThemeIcon } from './Icons';

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  onInteract: () => void;
}

const STEPS = [
  {
    id: 'place',
    badge: 'STEP 1 OF 4',
    title: 'Drag, Aim & Fit',
    body: 'Pick any block piece from the three-slot tray and drag it onto the 8x8 board. A glowing outline confirms valid spots — invalid drops pulse red and snap back safely.',
  },
  {
    id: 'clear',
    badge: 'STEP 2 OF 4',
    title: 'Clear Lines & Chain Combos',
    body: 'Fill any complete row or column to shatter the blocks. Clear lines on consecutive turns to charge the Combo meter for multiplied points!',
  },
  {
    id: 'modes',
    badge: 'STEP 3 OF 4',
    title: 'Three Ways to Play',
    body: 'Journey through 4 Worlds in Levels with stars and goals, race the clock in Timer Rush (+2s per cleared line), or test pure endurance in Classic.',
  },
  {
    id: 'rewards',
    badge: 'STEP 4 OF 4',
    title: 'Themes, Daily Gems & Awards',
    body: 'Collect gems from daily login streaks, achievements, and 3-star clears to unlock tactile board themes or continue a great run — 100% offline.',
  },
] as const;

export const TutorialModal: React.FC<TutorialModalProps> = ({
  open,
  onClose,
  onInteract,
}) => {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (open) {
      setStepIdx(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setStepIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  return (
    <div
      className="over on"
      id="tutModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutTitle"
    >
      <div className="card tut-card">
        <div className="tut-head">
          <span className="tut-badge">{step.badge}</span>
          <button
            type="button"
            className="tut-skip"
            id="tutSkip"
            onClick={() => {
              onInteract();
              onClose();
            }}
          >
            Skip
          </button>
        </div>

        {/* Visual diagram per step */}
        <div className="tut-stage" aria-hidden="true">
          {step.id === 'place' && (
            <div className="tut-grid-demo">
              {[
                1, 1, 0, 0,
                1, 0, 2, 2,
                0, 0, 2, 0,
                0, 3, 3, 3,
              ].map((cell, idx) => (
                <span
                  key={idx}
                  className={
                    cell === 1
                      ? 'tg-cell f c1'
                      : cell === 2
                      ? 'tg-cell ghost'
                      : cell === 3
                      ? 'tg-cell f c2'
                      : 'tg-cell'
                  }
                />
              ))}
            </div>
          )}

          {step.id === 'clear' && (
            <div className="tut-grid-demo">
              {[
                0, 1, 0, 0,
                4, 4, 4, 4,
                0, 1, 0, 2,
                3, 0, 0, 2,
              ].map((cell, idx) => (
                <span
                  key={idx}
                  className={
                    cell === 4
                      ? 'tg-cell f clear'
                      : cell === 1
                      ? 'tg-cell f c0'
                      : cell === 2
                      ? 'tg-cell f c3'
                      : cell === 3
                      ? 'tg-cell f c4'
                      : 'tg-cell'
                  }
                />
              ))}
              <div className="tut-combo-tag">COMBO x3</div>
            </div>
          )}

          {step.id === 'modes' && (
            <div className="tut-modes-demo">
              <div className="tm-pill gold">
                <strong>Levels</strong>
                <small>4 Worlds · Goals</small>
              </div>
              <div className="tm-pill cyan">
                <strong>Timer</strong>
                <small>90s / 3m / 5m · +2s/line</small>
              </div>
              <div className="tm-pill violet">
                <strong>Classic</strong>
                <small>Endless · 5 Lives</small>
              </div>
            </div>
          )}

          {step.id === 'rewards' && (
            <div className="tut-rewards-demo">
              <div className="tr-chip">
                <BrandMarkSvg />
                <span>Offline Ready</span>
              </div>
              <div className="tr-chip">
                <GiftIcon />
                <span>Daily Gems</span>
              </div>
              <div className="tr-chip">
                <ThemeIcon />
                <span>4 Themes</span>
              </div>
              <div className="tr-chip">
                <GemIcon />
                <span>Revive Runs</span>
              </div>
            </div>
          )}
        </div>

        <h2 id="tutTitle">{step.title}</h2>
        <p className="tut-copy">{step.body}</p>

        <div className="tut-dots" role="tablist" aria-label="Tutorial steps">
          {STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              className={`tut-dot${idx === stepIdx ? ' on' : ''}`}
              aria-label={`Step ${idx + 1}: ${s.title}`}
              onClick={() => {
                onInteract();
                setStepIdx(idx);
              }}
            />
          ))}
        </div>

        <div className="tut-actions">
          {stepIdx > 0 ? (
            <button
              type="button"
              className="btn2 show"
              id="tutPrev"
              onClick={() => {
                onInteract();
                setStepIdx((i) => Math.max(0, i - 1));
              }}
            >
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="btn"
            id="tutNext"
            onClick={() => {
              onInteract();
              if (isLast) onClose();
              else setStepIdx((i) => i + 1);
            }}
          >
            {isLast ? 'Start Playing' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
