export interface ScoredAssessment {
  score: number;
  maximumScore: number;
  weight: number;
}

/**
 * Weighted academic average across a student's scored assessments.
 *
 * Each assessment score is first normalized against its maximum score, then
 * combined using a weighted mean over the assessments the student has actually
 * been scored on. Un-scored assessments are excluded rather than treated as
 * zero, so an average calculated mid-semester reflects performance so far
 * instead of being dragged down by work that has not happened yet.
 *
 * Returns null when the student has no scores at all.
 */
export function calculateAcademicAverage(
  scoredAssessments: ScoredAssessment[]
): number | null {
  if (scoredAssessments.length === 0) return null;

  const totalWeight = scoredAssessments.reduce((sum, a) => sum + a.weight, 0);
  if (totalWeight <= 0) return null;

  const weightedSum = scoredAssessments.reduce((sum, a) => {
    const percentage = a.maximumScore > 0 ? (a.score / a.maximumScore) * 100 : 0;
    return sum + percentage * a.weight;
  }, 0);

  return weightedSum / totalWeight;
}

/** Score Percentage = Student Score / Maximum Score × 100 */
export function calculateScorePercentage(
  score: number,
  maximumScore: number
): number {
  if (maximumScore <= 0) return 0;
  return (score / maximumScore) * 100;
}
