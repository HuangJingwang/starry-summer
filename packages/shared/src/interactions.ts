export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface ModeratedSubmission {
  status: ModerationStatus;
  createdAt: string;
}

export function isVisibleSubmission(submission: ModeratedSubmission): boolean {
  return submission.status === 'approved';
}
