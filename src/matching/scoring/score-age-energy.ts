import {AgeEnergyRisk, AgeEnergyScoreResult, AgeStage, EnergyLevel} from "../types";

type DogForAgeEnergyScoring = {
  ageYears: number | null;
  ageMonths: number | null;
  energy: EnergyLevel;
};

const ENERGY_INDEX: Record<EnergyLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

const AGE_MONTHS = {
  PUPPY_MAX: 12,
  YOUNG_MAX: 36,
  ADULT_MAX: 96,
} as const;

/**
 * Adds an extra penalty when age/life-stage mismatch makes an energy mismatch
 * more important.
 *
 * This is a cross-factor modifier: it does not score age or energy alone.
 * It only applies when the combination of both signals creates extra risk.
 */
export function scoreAgeEnergyModifier(
    sourceDog: DogForAgeEnergyScoring,
    candidateDog: DogForAgeEnergyScoring,
): AgeEnergyScoreResult {
  const sourceStage = getAgeStage(getAgeInMonths(sourceDog));
  const candidateStage = getAgeStage(getAgeInMonths(candidateDog));
  const energyGap = getEnergyGap(sourceDog.energy, candidateDog.energy);

  if (sourceStage === 'UNKNOWN' || candidateStage === 'UNKNOWN') {
    return createResult({
      modifier: 0,
      energyGap,
      sourceStage,
      candidateStage,
      risks: [],
    });
  }

  if (energyGap === 0 || sourceStage === candidateStage) {
    return createResult({
      modifier: 0,
      energyGap,
      sourceStage,
      candidateStage,
      risks: [],
    });
  }

  const isPuppySenior =
      (sourceStage === 'PUPPY' && candidateStage === 'SENIOR') ||
      (sourceStage === 'SENIOR' && candidateStage === 'PUPPY');

  const isYoungSenior =
      (sourceStage === 'YOUNG' && candidateStage === 'SENIOR') ||
      (sourceStage === 'SENIOR' && candidateStage === 'YOUNG');

  const isAdultSenior =
      (sourceStage === 'ADULT' && candidateStage === 'SENIOR') ||
      (sourceStage === 'SENIOR' && candidateStage === 'ADULT');

  if (isPuppySenior) {
    return createResult({
      modifier: energyGap === 1 ? -6 : -12,
      energyGap,
      sourceStage,
      candidateStage,
      risks: [
        {
          type: 'YOUNG_SENIOR_ENERGY_CONFLICT',
          intensity: energyGap === 1 ? 'MEDIUM' : 'HIGH',
        },
      ],
    });
  }

  if (isYoungSenior) {
    return createResult({
      modifier: energyGap === 1 ? -5 : -10,
      energyGap,
      sourceStage,
      candidateStage,
      risks: [
        {
          type: 'YOUNG_SENIOR_ENERGY_CONFLICT',
          intensity: energyGap === 1 ? 'MEDIUM' : 'HIGH',
        },
      ],
    });
  }

  if (isAdultSenior) {
    return createResult({
      modifier: energyGap === 1 ? -2 : -6,
      energyGap,
      sourceStage,
      candidateStage,
      risks: [
        {
          type: 'AGE_ENERGY_MISMATCH',
          intensity: energyGap === 1 ? 'LOW' : 'MEDIUM',
        },
      ],
    });
  }

  return createResult({
    modifier: 0,
    energyGap,
    sourceStage,
    candidateStage,
    risks: [],
  });
}

function getAgeInMonths(dog: DogForAgeEnergyScoring): number | null {
  if (dog.ageYears === null && dog.ageMonths === null) {
    return null;
  }

  return (dog.ageYears ?? 0) * 12 + (dog.ageMonths ?? 0);
}

function getAgeStage(ageMonths: number | null): AgeStage {
  if (ageMonths === null) return 'UNKNOWN';
  if (ageMonths < AGE_MONTHS.PUPPY_MAX) return 'PUPPY';
  if (ageMonths < AGE_MONTHS.YOUNG_MAX) return 'YOUNG';
  if (ageMonths < AGE_MONTHS.ADULT_MAX) return 'ADULT';
  return 'SENIOR';
}

function getEnergyGap(sourceEnergy: EnergyLevel, candidateEnergy: EnergyLevel): number {
  return Math.abs(ENERGY_INDEX[sourceEnergy] - ENERGY_INDEX[candidateEnergy]);
}

function createResult(params: {
  modifier: number;
  energyGap: number;
  sourceStage: AgeStage;
  candidateStage: AgeStage;
  risks: AgeEnergyRisk[];
}): AgeEnergyScoreResult {
  const base = 0;

  return {
    base,
    modifier: params.modifier,
    total: base + params.modifier,
    energyGap: params.energyGap,
    sourceStage: params.sourceStage,
    candidateStage: params.candidateStage,
    risks: params.risks,
  };
}