import { getMatchTier } from '../scoring/score-tier';
import { Intensity, NormalizedMatchSignals, RawScores } from '../types';
import { normalizeAgeEnergySignals } from './normalising-signals/age-energy-signals';
import { normalizeSizeSignals } from './normalising-signals/size-signals';

/**
 * Combines independent scoring dimensions into one explainable match result.
 *
 * The scoring modules stay focused on calculation.
 * The orchestrator is responsible for:
 * - total score calculation
 * - signal normalization
 * - duplicate signal handling
 * - match tier assignment
 * - debug breakdown generation
 */
export function orchestrateMatchResult(rawScores: RawScores) {
  const totalScore = calculateTotalScore(rawScores);
  const normalization  = normalizeScore(totalScore);

  const normalizedSignals = mergeNormalizedSignals([
    normalizeSizeSignals(rawScores.size),
    normalizeAgeEnergySignals(rawScores.ageEnergy),
  ]);

  const tiering = getMatchTier({
    normalizedScore: normalization.normalized,
    cautions: normalizedSignals.cautions,
    hardWarnings: normalizedSignals.hardWarnings,
  });

  return {
    totalScore,
    tier: tiering.tier,
    strengths: normalizedSignals.strengths,
    cautions: normalizedSignals.cautions,
    hardWarnings: normalizedSignals.hardWarnings,
    breakdown: {
      ...rawScores,
      normalization,
      tiering,
    },
  };
}

function getIntensityRank(intensity?: Intensity): number {
  if (intensity === 'HIGH') return 3;
  if (intensity === 'MEDIUM') return 2;
  if (intensity === 'LOW') return 1;
  return 0;
}

function dedupeByStrongestSignal<T extends { type: string; intensity?: Intensity }>(
    signals: T[],
): T[] {
  const byType = new Map<string, T>();

  for (const signal of signals) {
    const existing = byType.get(signal.type);

    if (!existing || getIntensityRank(signal.intensity) > getIntensityRank(existing.intensity)) {
      byType.set(signal.type, signal);
    }
  }

  return Array.from(byType.values());
}

function mergeNormalizedSignals(signalGroups: NormalizedMatchSignals[]): NormalizedMatchSignals {
  return {
    strengths: dedupeByStrongestSignal(signalGroups.flatMap((group) => group.strengths)),
    cautions: dedupeByStrongestSignal(signalGroups.flatMap((group) => group.cautions)),
    hardWarnings: dedupeByStrongestSignal(signalGroups.flatMap((group) => group.hardWarnings)),
  };
}

function calculateTotalScore(rawScores: RawScores): number {
  return (
      rawScores.size.total +
      rawScores.age.total +
      rawScores.energy.total +
      rawScores.ageEnergy.total
  );
}

function normalizeScore(rawScore: number) {
  const min = -135;
  const max = 58;

  const normalized = ((rawScore - min) / (max - min)) * 100;

  return {
    raw: rawScore,
    normalized: Math.max(0, Math.min(100, Math.round(normalized))),
    min,
    max,
  };
}