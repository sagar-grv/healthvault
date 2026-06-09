/**
 * Processes queued uploads when back online.
 * Reads from IndexedDB queue, uploads to Supabase, updates status.
 */

import { createClient } from '@/lib/supabase/client';
import { getPendingUploads, updateUploadStatus, clearCompletedUploads } from './db';

let processing = false;

export async function processUploadQueue(): Promise<void> {
  if (processing) return;
  if (!navigator.onLine) return;

  processing = true;
  try {
    const pending = await getPendingUploads();
    if (pending.length === 0) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    for (const upload of pending) {
      try {
        await updateUploadStatus(upload.id!, 'uploading');

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('reports')
          .upload(upload.filePath, upload.file, {
            contentType: upload.mimeType,
            upsert: false,
          });

        if (uploadError) throw new Error(uploadError.message);

        // Save to database
        const reportId = upload.filePath.split('/')[1]; // userId/reportId/fileName
        const { error: dbError } = await supabase.from('reports').insert({
          id: reportId,
          patient_id: user.id,
          title: upload.title,
          report_type: upload.reportType,
          file_path: upload.filePath,
          file_name: upload.fileName,
          file_size: upload.file.size,
          mime_type: upload.mimeType,
          notes: upload.notes || null,
          report_date: upload.reportDate,
          is_shareable: upload.isShareable,
        });

        if (dbError) throw new Error(dbError.message);

        await updateUploadStatus(upload.id!, 'done');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        await updateUploadStatus(upload.id!, 'failed', message);
      }
    }

    await clearCompletedUploads();
  } finally {
    processing = false;
  }
}

/**
 * Start processing queue when back online.
 * Returns a cleanup function.
 */
export function startQueueProcessor(): () => void {
  const handleOnline = () => {
    processUploadQueue();
  };

  window.addEventListener('online', handleOnline);

  // Process immediately if online
  if (navigator.onLine) {
    processUploadQueue();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
