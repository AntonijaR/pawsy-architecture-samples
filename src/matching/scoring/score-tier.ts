import type {MatchRisk, MatchTier} from '../types';


/**
 * Converts a normalized score into a user-facing match tier.
 *
 * Risks can cap or downgrade the tier, so a numerically strong match
 * cannot appear as "excellent" when there are important safety warnings.
 */
export function getMatchTier(params: {
  normalizedScore: number;
  cautions: MatchRisk[];
  hardWarnings: MatchRisk[];
}) {
  const { normalizedScore, cautions, hardWarnings } = params;

  const cautionCount = cautions.length;
  const hardWarningCount = hardWarnings.length;

  const baselineTier = getBaselineTier(normalizedScore);
  let tier = baselineTier;

  if (cautionCount >= 2 && tier === 'EXCELLENT') {
    tier = 'GOOD';
  }

  if (hardWarningCount === 1) {
    tier = downgradeTierOnce(tier);
    tier = capTierAt(tier, 'MIXED');
  }

  if (hardWarningCount >= 2) {
    tier = capTierAt(tier, 'CAUTION');
  }

  const hasSevereSizeRisk = hardWarnings.some((warning) => warning.type === 'SEVERE_SIZE_RISK');

  if (hasSevereSizeRisk) {
    tier = capTierAt(tier, 'CAUTION');
  }

  return {
    tier,
    baselineTier,
    normalizedScore,
    cautionCount,
    hardWarningCount,
  };
}

function getBaselineTier(normalizedScore: number): MatchTier {
  if (normalizedScore >= 90) return 'EXCELLENT';
  if (normalizedScore >= 75) return 'GOOD';
  if (normalizedScore >= 55) return 'MIXED';
  if (normalizedScore >= 35) return 'CAUTION';
  return 'POOR';
}

function downgradeTierOnce(tier: MatchTier): MatchTier {
  switch (tier) {
    case 'EXCELLENT':
      return 'GOOD';
    case 'GOOD':
      return 'MIXED';
    case 'MIXED':
      return 'CAUTION';
    case 'CAUTION':
    case 'POOR':
      return 'POOR';
  }
}

function capTierAt(currentTier: MatchTier, maxTier: MatchTier): MatchTier {
  const rank: Record<MatchTier, number> = {
    EXCELLENT: 5,
    GOOD: 4,
    MIXED: 3,
    CAUTION: 2,
    POOR: 1,
  };

  return rank[currentTier] > rank[maxTier] ? maxTier : currentTier;
}