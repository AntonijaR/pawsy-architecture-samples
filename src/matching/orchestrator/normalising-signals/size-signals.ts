import {
  Intensity,
  MatchRisk,
  MatchStrength,
  NormalizedMatchSignals, SizeRisk, SizeScoreResult,
} from '../../types';

/**
 * Converts raw size-scoring risks into UI-ready match signals.
 *
 * The scoring layer can emit several detailed risk flags.
 * This normalizer decides which of those should become:
 * - strengths
 * - softer cautions
 * - hard warnings
 */
export function normalizeSizeSignals(sizeScore: SizeScoreResult): NormalizedMatchSignals {
  const strengths: MatchStrength[] = [];
  const cautions: MatchRisk[] = [];
  const hardWarnings: MatchRisk[] = [];

  const sizeGapRisk = findRisk(sizeScore.risks, 'SIZE_GAP');
  const chaseRisk = findRisk(sizeScore.risks, 'CHASE');
  const wrestleRisk = findRisk(sizeScore.risks, 'WRESTLE');

  const hasSourceLargeDogReactivity = hasRisk(sizeScore.risks, 'SOURCE_REACTIVE_TO_LARGE_DOG');
  const hasCandidateLargeDogReactivity = hasRisk(
      sizeScore.risks,
      'CANDIDATE_REACTIVE_TO_LARGE_DOG',
  );

  const hasLargeDogReactivity = hasSourceLargeDogReactivity || hasCandidateLargeDogReactivity;

  const hasSevereSizeRisk = shouldEmitSevereSizeRisk({
    sizeGapRisk,
    chaseRisk,
    wrestleRisk,
    hasLargeDogReactivity,
  });

  if (sizeScore.sizeGap <= 1 && !hasLargeDogReactivity) {
    strengths.push({
      type: 'COMPATIBLE_SIZE',
      source: 'size',
    });
  }

  if (hasLargeDogReactivity) {
    hardWarnings.push({
      type: 'LARGE_DOG_REACTIVITY',
      source: 'size',
      intensity: 'HIGH',
      whichDog: hasSourceLargeDogReactivity ? 'source' : 'match',
    });
  }

  if (hasSevereSizeRisk) {
    hardWarnings.push({
      type: 'SEVERE_SIZE_RISK',
      source: 'size',
      intensity: getSevereSizeRiskIntensity({
        sizeGapRisk,
        chaseRisk,
        wrestleRisk,
        hasLargeDogReactivity,
      }),
    });
  } else {
    if (sizeGapRisk) {
      cautions.push({
        type: 'SIZE_MISMATCH',
        source: 'size',
        intensity: sizeGapRisk.intensity,
      });
    }

    if (wrestleRisk) {
      cautions.push({
        type: 'ROUGH_PLAY_CAUTION',
        source: 'size',
        intensity: wrestleRisk.intensity,
      });
    } else if (chaseRisk) {
      cautions.push({
        type: 'ROUGH_PLAY_CAUTION',
        source: 'size',
        intensity: chaseRisk.intensity,
      });
    }
  }

  return {
    strengths,
    cautions,
    hardWarnings,
  };
}

function hasRisk(risks: SizeRisk[], type: SizeRisk['type']): boolean {
  return risks.some((risk) => risk.type === type);
}

function findRisk(risks: SizeRisk[], type: SizeRisk['type']): SizeRisk | undefined {
  return risks.find((risk) => risk.type === type);
}

function isHighSizeGap(sizeGapRisk?: SizeRisk): boolean {
  return sizeGapRisk?.type === 'SIZE_GAP' && sizeGapRisk.intensity === 'HIGH';
}

function getSevereSizeRiskIntensity(params: {
  sizeGapRisk?: SizeRisk;
  chaseRisk?: SizeRisk;
  wrestleRisk?: SizeRisk;
  hasLargeDogReactivity: boolean;
}): Intensity {
  const { sizeGapRisk, chaseRisk, wrestleRisk, hasLargeDogReactivity } = params;

  if (hasLargeDogReactivity) return 'HIGH';
  if (wrestleRisk?.intensity === 'HIGH') return 'HIGH';
  if (sizeGapRisk?.intensity === 'HIGH') return 'HIGH';
  if (chaseRisk?.intensity === 'MEDIUM') return 'HIGH';

  return 'MEDIUM';
}

function shouldEmitSevereSizeRisk(params: {
  sizeGapRisk?: SizeRisk;
  chaseRisk?: SizeRisk;
  wrestleRisk?: SizeRisk;
  hasLargeDogReactivity: boolean;
}): boolean {
  const { sizeGapRisk, chaseRisk, wrestleRisk, hasLargeDogReactivity } = params;

  if (!sizeGapRisk) return false;
  if (hasLargeDogReactivity) return true;
  if (wrestleRisk) return true;

  return isHighSizeGap(sizeGapRisk) && Boolean(chaseRisk);
}