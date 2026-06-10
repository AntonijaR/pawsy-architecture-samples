import {
  AgeEnergyRisk,
  AgeEnergyScoreResult, MatchHardWarningType,
  MatchRisk,
  MatchStrength,
  NormalizedMatchSignals,
} from '../../types';


/**
 * Converts cross-factor age/energy risks into UI-ready signals.
 *
 * The scoring layer determines whether a conflict exists.
 * This layer decides how that conflict should be presented
 * to the user.
 */
export function normalizeAgeEnergySignals(
  ageEnergyScore: AgeEnergyScoreResult,
): NormalizedMatchSignals {
  const strengths: MatchStrength[] = [];
  const cautions: MatchRisk[] = [];
  const hardWarnings: MatchRisk[] = [];

  const ageEnergyMismatchRisk = findRisk(ageEnergyScore.risks, 'AGE_ENERGY_MISMATCH');
  const youngSeniorEnergyConflictRisk = findRisk(
    ageEnergyScore.risks,
    'YOUNG_SENIOR_ENERGY_CONFLICT',
  );

  if (youngSeniorEnergyConflictRisk) {
    hardWarnings.push({
      type: 'YOUNG_SENIOR_ENERGY_CONFLICT',
      source: 'ageEnergy',
      intensity: youngSeniorEnergyConflictRisk.intensity,
    });
  }

  if (ageEnergyMismatchRisk) {
    cautions.push({
      type: 'AGE_ENERGY_MISMATCH',
      source: 'ageEnergy',
      intensity: ageEnergyMismatchRisk.intensity,
    });
  }

  return {
    strengths,
    cautions,
    hardWarnings,
  };
}

function findRisk(risks: AgeEnergyRisk[], type: AgeEnergyRisk['type']): AgeEnergyRisk | undefined {
  return risks.find((risk) => risk.type === type);
}