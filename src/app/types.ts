export type Step = 1 | 2 | 3 | 4;

export interface StepItem {
  id: Step;
  label: string;
}

export type PhotoLabel = 'cat' | 'not-cat';
export type PhotoUploadStatus = 'uploading' | 'saved' | 'error';

export interface PhotoItem {
  id: string;
  file: File;
  preview: string;
  label?: PhotoLabel;
  uploadStatus: PhotoUploadStatus;
  storagePath?: string;
  uploadError?: string;
}
