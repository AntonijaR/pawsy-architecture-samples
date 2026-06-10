import { scoreSizeCompatibility } from './scoring/score-size';
import { scoreAgeCompatibility } from './scoring/score-age';
import { scoreEnergyCompatibility } from './scoring/score-energy';
import { scoreAgeEnergyModifier } from './scoring/score-age-energy';
import { orchestrateMatchResult } from './orchestrator';
import {Dog} from './types';

type ScoreCandidatesParams = {
  sourceDog: Dog;
  eligibleDogs: Dog[];
  userDistanceMap: Map<string, number>;
  isDebugEnabled: boolean;
};

/**
 * Scores dogs that already passed eligibility and geospatial filtering.
 *
 * Each scoring module focuses on one compatibility dimension.
 * The orchestrator combines raw scores into a final score, tier,
 * strengths, cautions, warnings, and optional debug breakdown.
 */
export function scoreEligibleDogs(params: ScoreCandidatesParams) {
  const { sourceDog, eligibleDogs, userDistanceMap, isDebugEnabled } = params;

  return eligibleDogs.map((eligibleDog) => {
    const rawScores = {
      size: scoreSizeCompatibility(sourceDog, eligibleDog),
      age: scoreAgeCompatibility(sourceDog, eligibleDog),
      energy: scoreEnergyCompatibility(sourceDog, eligibleDog),
      ageEnergy: scoreAgeEnergyModifier(sourceDog, eligibleDog),
    };

    const orchestrated = orchestrateMatchResult(rawScores);

    return {
      ...eligibleDog,
      distanceKm: userDistanceMap.get(eligibleDog.primaryOwnerUserId) ?? Infinity,
      matchScore: orchestrated.totalScore,
      tier: orchestrated.tier,
      strengths: orchestrated.strengths,
      cautions: orchestrated.cautions,
      hardWarnings: orchestrated.hardWarnings,
      debug: isDebugEnabled ? orchestrated.breakdown : null,
    };
  });
}