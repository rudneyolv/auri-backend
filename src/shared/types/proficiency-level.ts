export const PROFICIENCY_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
] as const;

export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];
