import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

// TODO: Replace with your Supabase config from Supabase Dashboard
const supabaseUrl = 'https://uaxhnyyeagrokugdvjhm.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVheGhueXllYWdyb2t1Z2R2amhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODQzNjQsImV4cCI6MjA3Njg2MDM2NH0.2Fzn3mb5QA62Pcz1XtkIpxSiFOKVOKYwidq0b2OJk2s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Storage bucket name for kos images
export const KOS_IMAGES_BUCKET = 'kos-images';

/**
 * Upload image to Supabase Storage
 * @param uri - Local image URI
 * @param path - Storage path (e.g., 'kos/123/image1.jpg')
 * @returns Public URL of uploaded image
 */
export async function uploadImage(uri: string, path: string): Promise<string | null> {
  try {
    console.log('🔵 Starting upload:', { uri, path });

    // Read file as base64 using expo-file-system (more reliable in RN)
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    console.log('🔵 Base64 read, length:', base64.length);

    // Convert base64 to binary
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    console.log('🔵 Binary array created, size:', byteArray.length);

    const { data, error } = await supabase.storage
      .from(KOS_IMAGES_BUCKET)
      .upload(path, byteArray.buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('🔴 Upload error:', {
        message: error.message,
        name: error.name,
      });
      throw error;
    }

    console.log('🟢 Upload success:', data);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(KOS_IMAGES_BUCKET).getPublicUrl(data.path);

    console.log('🟢 Public URL:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('🔴 Upload error (full):', {
      message: error?.message || 'Unknown error',
      name: error?.name,
      status: error?.status,
      statusCode: error?.statusCode,
    });
    throw error;
  }
}

/**
 * Delete image from Supabase Storage
 * @param path - Storage path to delete
 */
export async function deleteImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(KOS_IMAGES_BUCKET).remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}
