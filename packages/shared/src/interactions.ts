export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface ModeratedSubmission {
  status: ModerationStatus;
  createdAt: string;
}

export const PUBLIC_SUBMISSION_LIMITS = {
  authorName: 80,
  body: 2000,
} as const;

export function isVisibleSubmission(submission: ModeratedSubmission): boolean {
  return submission.status === 'approved';
}
