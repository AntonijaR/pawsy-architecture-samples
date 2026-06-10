import {AgeRisk, AgeScoreResult, AgeStage} from "../types";

type DogForAgeScoring = {
  ageYears: number | null;
  ageMonths: number | null;
};

const AGE_MONTHS = {
  PUPPY_MAX: 12,
  YOUNG_MAX: 36,
  ADULT_MAX: 96,
  SAME_AGE_1: 12,
  SAME_AGE_2: 24,
  SAME_AGE_3: 48,
  SAME_AGE_4: 72,
  SAME_AGE_5: 96,
  LARGE_GAP_MEDIUM: 72,
  LARGE_GAP_HIGH: 96,
} as const;

/**
 * Scores age compatibility using total months rather than decimal years.
 *
 * This avoids ambiguity around dogs like "1 year and 8 months" and keeps
 * all threshold comparisons consistent.
 */
export function scoreAgeCompatibility(
    sourceDog: DogForAgeScoring,
    candidateDog: DogForAgeScoring,
): AgeScoreResult {
  const sourceAgeMonths = getDogAgeInMonths(sourceDog);
  const candidateAgeMonths = getDogAgeInMonths(candidateDog);

  if (sourceAgeMonths === null || candidateAgeMonths === null) {
    return {
      base: 0,
      modifier: 0,
      total: 0,
      ageDiffMonths: null,
      risks: [],
    };
  }

  const ageDiffMonths = Math.abs(sourceAgeMonths - candidateAgeMonths);

  const base = getBaseAgeScore(ageDiffMonths);
  const { modifier, risks } = scoreAgeModifier(sourceAgeMonths, candidateAgeMonths, ageDiffMonths);

  return {
    base,
    modifier,
    total: base + modifier,
    ageDiffMonths,
    risks,
  };
}

function getDogAgeInMonths(dog: DogForAgeScoring): number | null {
  if (dog.ageYears === null && dog.ageMonths === null) {
    return null;
  }

  return (dog.ageYears ?? 0) * 12 + (dog.ageMonths ?? 0);
}

function getAgeStage(ageMonths: number): AgeStage {
  if (ageMonths < AGE_MONTHS.PUPPY_MAX) return 'PUPPY';
  if (ageMonths < AGE_MONTHS.YOUNG_MAX) return 'YOUNG';
  if (ageMonths < AGE_MONTHS.ADULT_MAX) return 'ADULT';
  return 'SENIOR';
}

function getBaseAgeScore(ageDiffMonths: number): number {
  if (ageDiffMonths <= AGE_MONTHS.SAME_AGE_1) return 12;
  if (ageDiffMonths <= AGE_MONTHS.SAME_AGE_2) return 8;
  if (ageDiffMonths <= AGE_MONTHS.SAME_AGE_3) return 3;
  if (ageDiffMonths <= AGE_MONTHS.SAME_AGE_4) return -4;
  if (ageDiffMonths <= AGE_MONTHS.SAME_AGE_5) return -10;
  return -16;
}

function scoreAgeModifier(
    sourceAgeMonths: number,
    candidateAgeMonths: number,
    ageDiffMonths: number,
): { modifier: number; risks: AgeRisk[] } {
  const risks: AgeRisk[] = [];
  let modifier = 0;

  const sourceStage = getAgeStage(sourceAgeMonths);
  const candidateStage = getAgeStage(candidateAgeMonths);

  if (sourceStage === candidateStage) {
    modifier += 4;
  }

  const isExtremeMismatch =
      (sourceStage === 'PUPPY' && candidateStage === 'SENIOR') ||
      (sourceStage === 'SENIOR' && candidateStage === 'PUPPY');

  if (isExtremeMismatch) {
    modifier -= 8;
    risks.push({
      type: 'PUPPY_SENIOR_MISMATCH',
      intensity: 'HIGH',
    });
  }

  if (ageDiffMonths > AGE_MONTHS.LARGE_GAP_MEDIUM) {
    risks.push({
      type: 'LARGE_AGE_GAP',
      intensity: ageDiffMonths > AGE_MONTHS.LARGE_GAP_HIGH ? 'HIGH' : 'MEDIUM',
    });
  }

  return { modifier, risks };
}