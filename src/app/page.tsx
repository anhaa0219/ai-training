'use client';

import { ReactNode, useRef, useState } from 'react';
import Image from 'next/image';
import { BackButton } from './_components/BackButton';
import { MainButton } from './_components/MainButton';
import { StepBar } from './_components/StepBar';
import { StepCard } from './_components/StepCard';
import { Step, PhotoItem, PhotoLabel } from './types';
import { getSupabaseClient } from './_lib/supabase';

const STORAGE_BUCKET = 'training-photos';

const STEP_TITLES = [
  'Add your photos',
  'Tell the model what each photo is',
  'Train the model',
  'Test with new photos',
];

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [testPhotos, setTestPhotos] = useState<PhotoItem[]>([]);
  const [predictions, setPredictions] = useState<Record<string, { label: string; confidence: number }>>({});
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'complete' | 'error'>('idle');
  const [trainingProgress, setTrainingProgress] = useState<number | null>(null);
  const [trainingRound, setTrainingRound] = useState<number | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const testUploadRef = useRef<HTMLInputElement>(null);

  const openFilePicker = (input: HTMLInputElement | null) => {
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // Fall back to click for browsers that block showPicker in this context.
      }
    }
    input.click();
  };
  const updatePhoto = (target: 'training' | 'test', id: string, updates: Partial<PhotoItem>) => {
    const update = (items: PhotoItem[]) => items.map((photo) => photo.id === id ? { ...photo, ...updates } : photo);
    if (target === 'training') setPhotos(update);
    else setTestPhotos(update);
  };

  const uploadPhoto = async (photo: PhotoItem, target: 'training' | 'test') => {
    try {
      const safeName = photo.file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'image';
      const storagePath = `${target}/${photo.id}/${safeName}`;
      const { error } = await getSupabaseClient()
        .storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, photo.file, {
          cacheControl: '3600',
          contentType: photo.file.type,
          upsert: false,
        });

      if (error) throw error;
      updatePhoto(target, photo.id, { uploadStatus: 'saved', storagePath, uploadError: undefined });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      updatePhoto(target, photo.id, { uploadStatus: 'error', uploadError: message });
    }
  };

  const addPhotos = (files: FileList | null, target: 'training' | 'test') => {
    if (!files) return;
    const additions = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), uploadStatus: 'uploading' as const }));

    if (target === 'training') setPhotos((current) => [...current, ...additions]);
    else setTestPhotos((current) => [...current, ...additions]);
    additions.forEach((photo) => { void uploadPhoto(photo, target); });
  };

  const removePhoto = (id: string, target: 'training' | 'test') => {
    const update = (items: PhotoItem[]) => {
      const removed = items.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return items.filter((photo) => photo.id !== id);
    };
    if (target === 'training') setPhotos(update);
    else {
      setTestPhotos(update);
      setPredictions((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
  };

  const setPhotoLabel = (id: string, label: PhotoLabel) => {
    setPhotos((current) => current.map((photo) => photo.id === id ? { ...photo, label } : photo));
  };

  const labeledCount = photos.filter((photo) => photo.label).length;
  const catCount = photos.filter((photo) => photo.label === 'cat').length;
  const notCatCount = photos.filter((photo) => photo.label === 'not-cat').length;
  const unclassifiedCount = testPhotos.filter((photo) => !predictions[photo.id]).length;
  const uploadsPending = photos.some((photo) => photo.uploadStatus !== 'saved');
  const trainingUploadCount = photos.filter((photo) => photo.uploadStatus === 'uploading').length;
  const testUploadCount = testPhotos.filter((photo) => photo.uploadStatus === 'uploading').length;

  return (
    <main className="app-shell">
      <header className="page-heading">
        <h1>Screen {step}: {['Upload', 'Label', 'Train', 'Test'][step - 1]}</h1>
      </header>

      <section className="workspace" aria-label="Photo model workflow">
        <StepBar currentStep={step} onStepClick={setStep} />

        <StepCard>
          <div className="card-heading">
            <div>
              <p className="step-kicker">Step {step}</p>
              <h2>{STEP_TITLES[step - 1]}</h2>
            </div>
            {step === 1 && photos.length > 0 && <span className="count-pill">{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>}
          </div>

          {step === 1 && (
            <>
              <input ref={uploadRef} className="visually-hidden" type="file" accept="image/*" multiple onChange={(event) => { addPhotos(event.target.files, 'training'); event.target.value = ''; }} />
              <button className="upload-zone" type="button" onClick={() => openFilePicker(uploadRef.current)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addPhotos(event.dataTransfer.files, 'training'); }}>
                <UploadIcon />
                <strong>{photos.length ? 'Add more photos' : 'Click to choose photos'}</strong>
                <span>You can pick many photos at once</span>
              </button>
              {photos.length > 0 && (
                <div className="photo-grid" aria-label="Uploaded training photos">
                  {photos.map((photo) => <PhotoTile key={photo.id} photo={photo} onRemove={() => removePhoto(photo.id, 'training')} onRetry={() => { updatePhoto('training', photo.id, { uploadStatus: 'uploading', uploadError: undefined }); void uploadPhoto(photo, 'training'); }} />)}
                </div>
              )}
              {trainingUploadCount > 0 && <p className="upload-summary" role="status">Saving {trainingUploadCount} {trainingUploadCount === 1 ? 'photo' : 'photos'} to Supabase…</p>}
              <InfoNote><strong>Why so many photos?</strong> The model learns only from what you show it.</InfoNote>
              <div className="actions actions-end"><MainButton onClick={() => setStep(2)} disabled={photos.length === 0 || uploadsPending}>Next: Label photos <ArrowIcon /></MainButton></div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="label-summary" aria-live="polite">
                <span className="summary-chip cat-chip">Cat: {catCount}</span>
                <span className="summary-chip not-cat-chip">Not cat: {notCatCount}</span>
                <span className="summary-chip neutral-chip">Still to label: {photos.length - labeledCount}</span>
              </div>
              {photos.length === 0 ? (
                <EmptyState title="No photos to label yet" description="Go back and add photos. They will appear here when you upload them." />
              ) : (
                <div className="label-grid">
                  {photos.map((photo) => <LabelPhoto key={photo.id} photo={photo} onLabel={(label) => setPhotoLabel(photo.id, label)} />)}
                </div>
              )}
              <div className="actions actions-between">
                <BackButton onClick={() => setStep(1)} />
                <MainButton onClick={() => setStep(3)} disabled={photos.length > 0 && (labeledCount < photos.length || uploadsPending)}>
                  {uploadsPending ? 'Waiting for photo uploads' : photos.length === 0 ? 'Continue to training' : labeledCount < photos.length ? `Label ${photos.length - labeledCount} more to continue` : 'Next: Train'} <ArrowIcon />
                </MainButton>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="training-panel" aria-live="polite">
                {trainingStatus === 'idle' && <EmptyState title="Training results will appear here" description="Once model training is connected, its progress and results can be shown in this space." />}
                {trainingStatus === 'training' && <ProgressDisplay progress={trainingProgress} round={trainingRound} />}
                {trainingStatus === 'complete' && <div className="status-message success-message"><span className="status-icon">✓</span><div><strong>Training complete</strong><p>Your model is ready to test with new photos.</p></div></div>}
                {trainingStatus === 'error' && <div className="status-message error-message"><span className="status-icon">!</span><div><strong>Training did not complete</strong><p>Try again when the training service is available.</p></div></div>}
              </div>
              <InfoNote><strong>What is happening?</strong> After each round the model checks its guesses and adjusts.</InfoNote>
              <div className="actions actions-between">
                <BackButton onClick={() => setStep(2)} />
                <MainButton onClick={() => setStep(4)}>Continue to testing <ArrowIcon /></MainButton>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="test-overview">
                <strong>{Object.keys(predictions).length} / {testPhotos.length}</strong>
                <span>test photos with results</span>
              </div>
              <input ref={testUploadRef} className="visually-hidden" type="file" accept="image/*" multiple onChange={(event) => { addPhotos(event.target.files, 'test'); event.target.value = ''; }} />
              <button className="test-upload" type="button" onClick={() => openFilePicker(testUploadRef.current)}>
                <UploadIcon />
                <span>{testPhotos.length ? 'Add more test photos' : 'Choose photos to test'}</span>
              </button>
              {testUploadCount > 0 && <p className="upload-summary" role="status">Saving {testUploadCount} {testUploadCount === 1 ? 'photo' : 'photos'} to Supabase…</p>}
              {testPhotos.length > 0 ? (
                <div className="test-grid">
                  {testPhotos.map((photo) => <TestPhoto key={photo.id} photo={photo} prediction={predictions[photo.id]} onRemove={() => removePhoto(photo.id, 'test')} onRetry={() => { updatePhoto('test', photo.id, { uploadStatus: 'uploading', uploadError: undefined }); void uploadPhoto(photo, 'test'); }} />)}
                </div>
              ) : (
                <EmptyState title="Test results will appear here" description="Add new photos to see the model’s predictions when a trained model is connected." />
              )}
              <div className="actions actions-between"><BackButton onClick={() => setStep(3)} /><span className="muted-hint">{unclassifiedCount > 0 ? `${unclassifiedCount} waiting for a model result` : 'Ready for model results'}</span></div>
            </>
          )}
        </StepCard>
      </section>
    </main>
  );
}

function PhotoTile({ photo, onRemove, onRetry }: { photo: PhotoItem; onRemove: () => void; onRetry: () => void }) {
  return <div className={`photo-tile upload-${photo.uploadStatus}`}>
    <Image src={photo.preview} alt={photo.file.name} width={600} height={600} unoptimized />
    <span className="photo-name">{photo.file.name}</span>
    {photo.uploadStatus !== 'uploading' && <span className="upload-status" role="status">{photo.uploadStatus === 'saved' ? 'Saved to Supabase' : photo.uploadError || 'Upload failed'}</span>}
    {photo.uploadStatus === 'error' && <button className="retry-upload" type="button" onClick={onRetry}>Retry upload</button>}
    <button className="remove-photo" type="button" aria-label={`Remove ${photo.file.name}`} onClick={onRemove}>×</button>
  </div>;
}

function LabelPhoto({ photo, onLabel }: { photo: PhotoItem; onLabel: (label: PhotoLabel) => void }) {
  return <article className={`label-card ${photo.label ? `${photo.label}-selected` : ''}`}>
    <Image src={photo.preview} alt={photo.file.name} width={600} height={600} unoptimized />
    <div className="label-card-actions">
      <button type="button" className={photo.label === 'cat' ? 'chosen-cat' : ''} aria-pressed={photo.label === 'cat'} onClick={() => onLabel('cat')}>Cat</button>
      <button type="button" className={photo.label === 'not-cat' ? 'chosen-not-cat' : ''} aria-pressed={photo.label === 'not-cat'} onClick={() => onLabel('not-cat')}>Not cat</button>
    </div>
  </article>;
}

function TestPhoto({ photo, prediction, onRemove, onRetry }: { photo: PhotoItem; prediction?: { label: string; confidence: number }; onRemove: () => void; onRetry: () => void }) {
  return <article className={`test-card ${prediction ? 'has-prediction' : ''}`}>
    <div className="test-image-wrap"><Image src={photo.preview} alt={photo.file.name} width={600} height={600} unoptimized /><button className="remove-photo" type="button" aria-label={`Remove ${photo.file.name}`} onClick={onRemove}>×</button></div>
    <div className="test-card-info">
      {prediction ? <><strong>{prediction.label}</strong><span>{Math.round(prediction.confidence * 100)}% sure</span></> : <><strong className="waiting-label">{photo.uploadStatus === 'error' ? 'Upload failed' : 'Waiting for result'}</strong><span>{photo.uploadError || photo.file.name}</span>{photo.uploadStatus === 'error' && <button className="retry-upload" type="button" onClick={onRetry}>Retry upload</button>}</>}
    </div>
  </article>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><span className="empty-mark" aria-hidden="true">···</span><strong>{title}</strong><p>{description}</p></div>;
}

function InfoNote({ children }: { children: ReactNode }) { return <aside className="info-note">{children}</aside>; }

function ProgressDisplay({ progress, round }: { progress: number | null; round: number | null }) {
  return <div className="progress-display"><div className="progress-heading"><span>Training</span>{progress !== null && <strong>{progress}%</strong>}</div><div className="progress-track"><span style={{ width: `${progress ?? 0}%` }} /></div>{round !== null && <span className="muted-hint">Round {round}</span>}</div>;
}

function UploadIcon() { return <svg className="upload-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 31V5m0 0L13 16M24 5l11 11M7 30v10a3 3 0 003 3h28a3 3 0 003-3V30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function ArrowIcon() { return <svg className="button-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
