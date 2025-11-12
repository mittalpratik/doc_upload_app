export type UploadStatus = 'pending' | 'queued' | 'uploading' | 'completed' | 'failed' | 'canceled';

export interface FileUpload {
  id: string;
  file: File;
  progress: number; 
  status: UploadStatus;
  error?: string | null;
  attempts: number;
  //subscription to cancel whenin progress
  _sub?: import('rxjs').Subscription | null;
}
