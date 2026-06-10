import {DogSize, PlayStyle, SizeRisk, SizeScoreResult} from "../types";

type DogForSizeScoring = {
  size: DogSize;
  playStyles: PlayStyle[];
  reactiveToLargeDogs: boolean | null;
};

const SIZE_SCORE_MATRIX: Record<DogSize, Record<DogSize, number>> = {
  TOY: {
    TOY: 30,
    SMALL: 18,
    MEDIUM: -10,
    LARGE: -35,
    GIANT: -45,
  },
  SMALL: {
    TOY: 18,
    SMALL: 30,
    MEDIUM: 12,
    LARGE: -20,
    GIANT: -35,
  },
  MEDIUM: {
    TOY: -10,
    SMALL: 12,
    MEDIUM: 30,
    LARGE: 16,
    GIANT: 5,
  },
  LARGE: {
    TOY: -35,
    SMALL: -20,
    MEDIUM: 16,
    LARGE: 30,
    GIANT: 18,
  },
  GIANT: {
    TOY: -45,
    SMALL: -35,
    MEDIUM: 5,
    LARGE: 18,
    GIANT: 30,
  },
};

const DOG_SIZE_INDEX: Record<DogSize, number> = {
  TOY: 0,
  SMALL: 1,
  MEDIUM: 2,
  LARGE: 3,
  GIANT: 4,
};

/**
 * Adjusts the base size compatibility score based on rough play styles.
 *
 * The idea:
 * - Size mismatch alone already introduces risk.
 * - Rough play styles (CHASE, WRESTLE) can amplify that risk.
 *
 * We only apply penalties when the size gap is meaningful (gap >= 2),
 * because rough play between similarly sized dogs is usually acceptable.
 *
 * Rules:
 * - WRESTLE is considered more risky than CHASE (direct body contact).
 * - If both dogs have rough styles, the penalty increases.
 * - The larger the size gap, the stronger the penalty.
 *
 * This function does NOT reward good matches. It only adds extra penalties
 * on top of the base size compatibility score.
 */
function scoreSizePlayRiskModifier(
  gap: number,
  sourcePlayStyles: PlayStyle[],
  candidatePlayStyles: PlayStyle[],
): { modifier: number; risks: SizeRisk[] } {
  const risks: SizeRisk[] = [];

  if (gap < 2) {
    return {
      modifier: 0,
      risks,
    };
  }

  risks.push({
    type: 'SIZE_GAP',
    intensity: gap === 2 ? 'MEDIUM' : 'HIGH',
  });

  const sourceHasChase = hasPlayStyle(sourcePlayStyles, 'CHASE');
  const candidateHasChase = hasPlayStyle(candidatePlayStyles, 'CHASE');

  const sourceHasWrestle = hasPlayStyle(sourcePlayStyles, 'WRESTLE');
  const candidateHasWrestle = hasPlayStyle(candidatePlayStyles, 'WRESTLE');

  const chaseCount = Number(sourceHasChase) + Number(candidateHasChase);
  const wrestleCount = Number(sourceHasWrestle) + Number(candidateHasWrestle);

  if (chaseCount > 0) {
    risks.push({
      type: 'CHASE',
      intensity: gap === 2 ? 'LOW' : 'MEDIUM',
    });
  }

  if (wrestleCount > 0) {
    risks.push({
      type: 'WRESTLE',
      intensity: gap === 2 ? 'MEDIUM' : 'HIGH',
    });
  }

  if (gap === 2) {
    if (wrestleCount === 2) return { modifier: -12, risks };
    if (wrestleCount === 1 && chaseCount >= 1) return { modifier: -9, risks };
    if (wrestleCount === 1) return { modifier: -7, risks };
    if (chaseCount === 2) return { modifier: -7, risks };
    if (chaseCount === 1) return { modifier: -4, risks };

    return { modifier: 0, risks };
  }

  if (gap === 3) {
    if (wrestleCount === 2) return { modifier: -18, risks };
    if (wrestleCount === 1 && chaseCount >= 1) return { modifier: -15, risks };
    if (wrestleCount === 1) return { modifier: -12, risks };
    if (chaseCount === 2) return { modifier: -12, risks };
    if (chaseCount === 1) return { modifier: -7, risks };

    return { modifier: 0, risks };
  }

  // gap >= 4
  if (wrestleCount === 2) return { modifier: -24, risks };
  if (wrestleCount === 1 && chaseCount >= 1) return { modifier: -20, risks };
  if (wrestleCount === 1) return { modifier: -16, risks };
  if (chaseCount === 2) return { modifier: -16, risks };
  if (chaseCount === 1) return { modifier: -10, risks };

  return { modifier: 0, risks };
}

/**
 * Adds penalties when one dog is reactive to large dogs and the other dog
 * is actually LARGE or GIANT.
 *
 * We check both directions:
 * - source reactive to a candidate large size
 * - candidate reactive to a source large size
 *
 * This function only adds penalties. It does not add bonuses.
 */
function scoreLargeDogReactivityModifier(
  sourceDog: DogForSizeScoring,
  candidateDog: DogForSizeScoring,
): { modifier: number; risks: SizeRisk[] } {
  const risks: SizeRisk[] = [];
  let modifier = 0;

  const sourceReactiveToCandidateLargeDog =
    isLargeDog(candidateDog.size) && sourceDog.reactiveToLargeDogs === true;

  const candidateReactiveToSourceLargeDog =
    isLargeDog(sourceDog.size) && candidateDog.reactiveToLargeDogs === true;

  if (sourceReactiveToCandidateLargeDog) {
    modifier -= 12;
    risks.push({
      type: 'SOURCE_REACTIVE_TO_LARGE_DOG',
      intensity: 'HIGH',
    });
  }

  if (candidateReactiveToSourceLargeDog) {
    modifier -= 12;
    risks.push({
      type: 'CANDIDATE_REACTIVE_TO_LARGE_DOG',
      intensity: 'HIGH',
    });
  }

  return {
    modifier,
    risks,
  };
}

export function scoreSizeCompatibility(
  sourceDog: DogForSizeScoring,
  candidateDog: DogForSizeScoring,
): SizeScoreResult {
  const sizeGap = getSizeGap(sourceDog.size, candidateDog.size);
  const base = scoreBaseSizeCompatibility(sourceDog.size, candidateDog.size);

  const playRisk = scoreSizePlayRiskModifier(sizeGap, sourceDog.playStyles, candidateDog.playStyles);
  const largeDogReactivity = scoreLargeDogReactivityModifier(sourceDog, candidateDog);

  const modifier = playRisk.modifier + largeDogReactivity.modifier;

  return {
    base,
    modifier,
    total: base + modifier,
    sizeGap,
    risks: [...playRisk.risks, ...largeDogReactivity.risks],
  };
}

function getSizeGap(sourceSize: DogSize, candidateSize: DogSize): number {
  return Math.abs(DOG_SIZE_INDEX[sourceSize] - DOG_SIZE_INDEX[candidateSize]);
}

function hasPlayStyle(playStyles: PlayStyle[], style: PlayStyle): boolean {
  return playStyles.includes(style);
}

function isLargeDog(size: DogSize): boolean {
  return size === 'LARGE' || size === 'GIANT';
}

function scoreBaseSizeCompatibility(sourceSize: DogSize, candidateSize: DogSize): number {
  return SIZE_SCORE_MATRIX[sourceSize][candidateSize];
}
