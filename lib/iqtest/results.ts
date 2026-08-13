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

export interface CompletionTiming {
  timingVersion: 1;
  startedAt: string;
  completedAt: string;
  completionTimeSeconds: number;
}

export interface TimedAttemptPoint {
  pointId: number;
  iqScore: number;
  correctCount: number;
  completionTimeSeconds: number;
  completedAt: string;
  speedPercentile: number | null;
  isCurrentAttempt: boolean;
}

export interface TimingAnalytics {
  timedAttemptCount: number;
  medianCompletionSeconds: number;
  averageCompletionSeconds: number;
  fastestCompletionSeconds: number;
  percentile25Seconds: number;
  percentile75Seconds: number;
  speedPercentile: number | null;
  attempts: TimedAttemptPoint[];
}

export interface IQResultSubmission {
  attemptId: string;
  iqScore: number;
  answers: Record<number, string>;
  completionSeconds: number;
  testVersion?: number;
  selectedQuestionIds?: string[];
  timingVersion?: number;
  startedAt?: string;
  completedAt?: string;
  completionTimeSeconds?: number;
}

export interface IQResultResponse {
  accepted: boolean;
  iqScore: number;
  comparison: ParticipantComparison;
  timing?: CompletionTiming;
  timingAnalytics?: TimingAnalytics;
}
