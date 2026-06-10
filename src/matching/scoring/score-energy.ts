import {EnergyLevel, EnergyRisk, EnergyScoreResult} from "../types";

type DogForEnergyScoring = {
  energy: EnergyLevel;
  reactiveToHighEnergyDogs: boolean | null;
};

const ENERGY_INDEX: Record<EnergyLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

export function scoreEnergyCompatibility(
    sourceDog: DogForEnergyScoring,
    candidateDog: DogForEnergyScoring,
): EnergyScoreResult {
  const energyGap = getEnergyGap(sourceDog.energy, candidateDog.energy);
  const base = scoreBaseEnergyCompatibility(sourceDog.energy, candidateDog.energy);

  const { modifier, risks } = scoreEnergyRiskModifier(sourceDog, candidateDog, energyGap);

  return {
    base,
    modifier,
    total: base + modifier,
    energyGap,
    risks,
  };
}

/**
 * Adjusts the base energy compatibility score with contextual risk.
 *
 * Pure energy mismatch matters, but it should not dominate the score alone.
 * The strongest penalty is reserved for cases where one dog is high-energy
 * and the other is reactive to high-energy dogs.
 */
function scoreEnergyRiskModifier(
    sourceDog: DogForEnergyScoring,
    candidateDog: DogForEnergyScoring,
    energyGap: number,
): { modifier: number; risks: EnergyRisk[] } {
  const risks: EnergyRisk[] = [];
  let modifier = 0;

  if (energyGap === 1) {
    risks.push({
      type: 'ENERGY_MISMATCH',
      intensity: 'LOW',
    });
  }

  if (energyGap >= 2) {
    risks.push({
      type: 'ENERGY_MISMATCH',
      intensity: 'MEDIUM',
    });
  }

  const sourceReactiveToCandidateHighEnergy =
      candidateDog.energy === 'HIGH' && sourceDog.reactiveToHighEnergyDogs === true;

  const candidateReactiveToSourceHighEnergy =
      sourceDog.energy === 'HIGH' && candidateDog.reactiveToHighEnergyDogs === true;

  if (sourceReactiveToCandidateHighEnergy) {
    modifier -= 12;
    risks.push({
      type: 'SOURCE_REACTIVE_TO_HIGH_ENERGY_DOGS',
      intensity: 'HIGH',
    });
  }

  if (candidateReactiveToSourceHighEnergy) {
    modifier -= 12;
    risks.push({
      type: 'CANDIDATE_REACTIVE_TO_HIGH_ENERGY_DOGS',
      intensity: 'HIGH',
    });
  }

  return {
    modifier,
    risks,
  };
}

function getEnergyGap(sourceEnergy: EnergyLevel, candidateEnergy: EnergyLevel): number {
  return Math.abs(ENERGY_INDEX[sourceEnergy] - ENERGY_INDEX[candidateEnergy]);
}

function scoreBaseEnergyCompatibility(
    sourceEnergy: EnergyLevel,
    candidateEnergy: EnergyLevel,
): number {
  const energyGap = getEnergyGap(sourceEnergy, candidateEnergy);

  if (energyGap === 0) return 12;
  if (energyGap === 1) return 4;
  return -6;
}