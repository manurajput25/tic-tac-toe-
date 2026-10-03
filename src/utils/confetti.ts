import { Player } from '../types/game';

/**
 * Triggers a victory confetti and particle explosion effect
 * through the existing ParticleBackground system.
 */
export function triggerConfetti(originX?: number, originY?: number, winner?: Player | null) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('apex_win_explosion', {
      detail: { originX, originY, winner },
    })
  );
}
