// Image-prep pipeline for the scan flow (Section 7.3): resize a captured/picked
// photo to 640px width, compress ~0.7, and copy it into the app document
// directory so the garment keeps a small local copy (we only ever store the
// uri — Section 10). Uses the new expo-image-manipulator context API and the
// classic file-system surface from `expo-file-system/legacy` (Section 3),
// verified against the SDK 54 docs via Context7.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

import { uid } from './uid';

const GARMENT_DIR = `${FileSystem.documentDirectory}garments/`;

/** Ensures the garments/ subdirectory exists before we copy into it. */
async function ensureGarmentDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(GARMENT_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(GARMENT_DIR, { intermediates: true });
  }
}

/**
 * Resizes + compresses the source image and copies it into the document
 * directory. Returns the persisted local uri to store on the garment and feed
 * to the grader.
 */
export async function prepareGarmentImage(sourceUri: string): Promise<string> {
  // Resize to 640px wide (height auto to preserve ratio), then render + save
  // as a compressed JPEG.
  const rendered = await ImageManipulator.manipulate(sourceUri)
    .resize({ width: 640 })
    .renderAsync();
  const compressed = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });

  await ensureGarmentDir();
  const dest = `${GARMENT_DIR}${uid()}.jpg`;
  await FileSystem.copyAsync({ from: compressed.uri, to: dest });
  return dest;
}
