export interface ScoreDistributionBin {
  label: string;
  minimum: number;
  maximum: number;
  count: number;
}

export interface ParticipantComparison {
  participantCount: number;
  medianScore: number;
  higherThanPercent: number | null;
  scoreDistribution: ScoreDistributionBin[];
}

export interface IQResultSubmission {
  attemptId: string;
  iqScore: number;
  answers: Record<number, string>;
  completionSeconds: number;
}

export interface IQResultResponse {
  accepted: boolean;
  iqScore: number;
  comparison: ParticipantComparison;
}
