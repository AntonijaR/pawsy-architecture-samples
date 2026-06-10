export type EnergyLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type DogSize = 'TOY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'GIANT';
export type DogSex = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type PlayStyle = 'CHASE' | 'WRESTLE' | 'TUG' | 'FETCH' | 'SNIFF_ONLY' | 'WATER_PLAY';
export type AgeStage = 'UNKNOWN' | 'PUPPY' | 'YOUNG' | 'ADULT' | 'SENIOR';

export type Intensity = 'LOW' | 'MEDIUM' | 'HIGH';

export type MatchTier = 'EXCELLENT' | 'GOOD' | 'MIXED' | 'CAUTION' | 'POOR';

export type Dog = {
  id: string;
  name: string | null;
  primaryOwnerUserId: string;
  ageYears: number | null;
  ageMonths: number | null;
  sex: DogSex;
  size: DogSize;
  energy: EnergyLevel;
  primaryBreedSlug: string | null;
  playStyles: PlayStyle[];
  friendlyDogs: number;
  reactiveToMaleDogs: boolean | null;
  reactiveToFemaleDogs: boolean | null;
  reactiveToLargeDogs: boolean | null;
  reactiveToHighEnergyDogs: boolean | null;
  needsSlowIntroduction: boolean | null;
};

export type AgeEnergyRisk = RiskIntensity & {
  type: AgeEnergyRiskType;
};

export type SizeRisk =  RiskIntensity & {
  type: SizeRiskType;
};

export type AgeRisk =  RiskIntensity & {
  type: AgeRiskType;
};

export type EnergyRisk =  RiskIntensity & {
  type: EnergyRiskType;
};

export type SizeScoreResult = ScoreResult & {
  sizeGap: number;
  risks: SizeRisk[];
};

export type AgeScoreResult = ScoreResult & {
  ageDiffMonths: number | null;
  risks: AgeRisk[];
};

export type EnergyScoreResult = ScoreResult & {
  energyGap: number;
  risks: EnergyRisk[];
};

export type AgeEnergyScoreResult = ScoreResult & {
  energyGap: number;
  sourceStage: AgeStage;
  candidateStage: AgeStage;
  risks: AgeEnergyRisk[];
};

export type RawScores = {
  size: SizeScoreResult;
  age: AgeScoreResult;
  energy: EnergyScoreResult;
  ageEnergy: AgeEnergyScoreResult;
};

export type NormalizedMatchSignals = {
  strengths: MatchStrength[];
  cautions: MatchRisk[];
  hardWarnings: MatchRisk[];
};

export type MatchStrength = {
  type: MatchStrengthType;
  source: MatchSignalSource;
  intensity?: Intensity;
};

export type MatchRisk = {
  type: MatchCautionType | MatchHardWarningType;
  source: MatchSignalSource;
  intensity?: Intensity;
  whichDog?: WhichDog;
};

type ScoreResult = {
  base: number;
  modifier: number;
  total: number;
}

type RiskIntensity = {
  intensity: Intensity;
}

type WhichDog = 'source' | 'match';

type MatchSignalSource =
    | 'size'
    | 'sex'
    | 'breed'
    | 'age'
    | 'energy'
    | 'ageEnergy'
    | 'playStyle'
    | 'additional';

type MatchStrengthType =
    | 'COMPATIBLE_SIZE'
    | 'SIMILAR_ENERGY'
    | 'SIMILAR_AGE'
    | 'SHARED_PLAY_STYLES'
    | 'SAME_BREED'
    | 'OPPOSITE_SEX'
    | 'DOG_FRIENDLY_MATCH';

type MatchCautionType =
    | 'SIZE_MISMATCH'
    | 'ENERGY_MISMATCH'
    | 'AGE_GAP'
    | 'SLOW_INTRODUCTION'
    | 'ROUGH_PLAY_CAUTION'
    | 'AGE_ENERGY_MISMATCH';

export type MatchHardWarningType =
    | 'SEX_REACTIVITY'
    | 'LARGE_DOG_REACTIVITY'
    | 'HIGH_ENERGY_REACTIVITY'
    | 'PUPPY_SENIOR_MISMATCH'
    | 'YOUNG_SENIOR_ENERGY_CONFLICT'
    | 'SEVERE_SIZE_RISK';

type AgeEnergyRiskType = 'AGE_ENERGY_MISMATCH' | 'YOUNG_SENIOR_ENERGY_CONFLICT';

type AgeRiskType = 'LARGE_AGE_GAP' | 'PUPPY_SENIOR_MISMATCH';

type SizeRiskType =
    | 'SIZE_GAP'
    | 'CHASE'
    | 'WRESTLE'
    | 'SOURCE_REACTIVE_TO_LARGE_DOG'
    | 'CANDIDATE_REACTIVE_TO_LARGE_DOG';

type EnergyRiskType =
    | 'ENERGY_MISMATCH'
    | 'SOURCE_REACTIVE_TO_HIGH_ENERGY_DOGS'
    | 'CANDIDATE_REACTIVE_TO_HIGH_ENERGY_DOGS';