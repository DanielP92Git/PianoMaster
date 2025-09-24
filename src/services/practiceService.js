import supabase from "./supabase";
import AudioCompressionService from "./audioCompressionService";

// Practice session status enum
export const PRACTICE_SESSION_STATUS = {
  PENDING_REVIEW: "pending_review",
  REVIEWED: "reviewed",
  NEEDS_WORK: "needs_work",
  EXCELLENT: "excellent",
};

// Upload progress callback type
const DEFAULT_UPLOAD_OPTIONS = {
  maxRetries: 3,
  retryDelay: 1000, // ms
  compressionQuality: "MEDIUM",
  onProgress: null,
  onRetry: null,
};

export const practiceService = {
  async uploadPracticeSession(
    file,
    studentId,
    notes,
    duration = 0,
    options = {}
  ) {
    const uploadOptions = { ...DEFAULT_UPLOAD_OPTIONS, ...options };

    try {
      // Validate the audio file
      const validation = AudioCompressionService.validateAudioBlob(file);
      if (!validation.isValid) {
        throw new Error(`Invalid audio file: ${validation.errors.join(", ")}`);
      }

      // Compress the audio if needed
      const compressionResult = await AudioCompressionService.compressAudioBlob(
        file,
        uploadOptions.compressionQuality
      );

      // Detect format and create appropriate filename
      const format = AudioCompressionService.detectBlobFormat(
        compressionResult.blob
      );
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${studentId}/${timestamp}.${format.extension}`;

      // Upload with retry logic
      const uploadResult = await this._uploadWithRetry(
        compressionResult.blob,
        fileName,
        format.mimeType,
        uploadOptions
      );

      // Create a record in the practice_sessions table
      const { data: sessionData, error: sessionError } = await supabase
        .from("practice_sessions")
        .insert({
          student_id: studentId,
          recording_url: fileName,
          recording_description:
            notes ||
            `Recording: ${format.label}, Quality: ${compressionResult.quality?.label || "Unknown"}, Size: ${Math.round(compressionResult.blob.size / 1024)}KB`,
          status: PRACTICE_SESSION_STATUS.PENDING_REVIEW,
          submitted_at: new Date().toISOString(),
          duration: Math.floor(duration || 0),
        })
        .select()
        .single();

      if (sessionError) {
        console.error("Session creation error:", sessionError);
        throw sessionError;
      }

      return {
        ...sessionData,
        uploadInfo: {
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          compressionRatio: compressionResult.compressionRatio,
          format: format.label,
          quality: compressionResult.quality?.label || "Unknown",
          fileSize: compressionResult.blob.size,
        },
      };
    } catch (error) {
      console.error("Error uploading practice session:", error);
      throw error;
    }
  },

  // Private method for upload with retry logic
  async _uploadWithRetry(blob, fileName, contentType, options) {
    let lastError;

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        // Report progress
        if (options.onProgress) {
          options.onProgress({
            phase: "uploading",
            attempt,
            totalAttempts: options.maxRetries,
            percentage: 0,
          });
        }

        const { data: fileData, error: uploadError } = await supabase.storage
          .from("practice-recordings")
          .upload(fileName, blob, {
            cacheControl: "3600",
            contentType: contentType,
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Success
        if (options.onProgress) {
          options.onProgress({
            phase: "completed",
            attempt,
            totalAttempts: options.maxRetries,
            percentage: 100,
          });
        }

        return fileData;
      } catch (error) {
        lastError = error;
        console.warn(`Upload attempt ${attempt} failed:`, error);

        if (attempt < options.maxRetries) {
          // Report retry
          if (options.onRetry) {
            options.onRetry({
              attempt,
              error: error.message,
              retryIn: options.retryDelay,
            });
          }

          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, options.retryDelay)
          );
        }
      }
    }

    // All retries failed
    throw lastError;
  },

  async getPracticeSessions(studentId) {
    if (!studentId) return [];

    const { data, error } = await supabase
      .from("practice_sessions")
      .select("*")
      .eq("student_id", studentId)
      .order("submitted_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async updatePracticeSessionNotes(sessionId, notes) {
    const { data, error } = await supabase
      .from("practice_sessions")
      .update({ recording_description: notes })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePracticeSession(sessionId) {
    try {
      //   console.log("Starting deletion process for session:", sessionId);

      // First get the session to get the recording URL
      const { data: session, error: fetchError } = await supabase
        .from("practice_sessions")
        .select("recording_url")
        .eq("id", sessionId)
        .single();

      if (fetchError) {
        console.error("Error fetching session:", fetchError);
        throw fetchError;
      }

      //   console.log("Found session with recording URL:", session?.recording_url);

      // Delete the session record first
      const { error: deleteError } = await supabase
        .from("practice_sessions")
        .delete()
        .eq("id", sessionId);

      if (deleteError) {
        console.error("Error deleting session record:", deleteError);
        throw deleteError;
      }

      //   console.log("Successfully deleted session record");

      // Then delete the recording from storage if it exists
      if (session?.recording_url) {
        const { error: storageError } = await supabase.storage
          .from("practice-recordings")
          .remove([session.recording_url]);

        if (storageError) {
          console.error("Error deleting recording file:", storageError);
          // Don't throw here as the database record is already deleted
        } else {
          console.log("Successfully deleted recording file");
        }
      }

      return true;
    } catch (error) {
      console.error("Error in deletePracticeSession:", error);
      throw error;
    }
  },

  async getRecordingUrl(path) {
    if (!path) throw new Error("No recording path provided");

    try {
      // Create a signed URL that expires in 1 hour
      const { data, error } = await supabase.storage
        .from("practice-recordings")
        .createSignedUrl(path, 3600, {
          download: false, // Stream audio instead of downloading
        });

      if (error) {
        console.error("Signed URL error:", error);
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error("No signed URL returned from storage");
      }

      return data.signedUrl;
    } catch (error) {
      console.error("Error in getRecordingUrl:", error);
      throw new Error("Failed to get recording URL");
    }
  },

  async cleanupAllSessions(studentId) {
    try {
      // Get all sessions for the student
      const { data: sessions, error: fetchError } = await supabase
        .from("practice_sessions")
        .select("id, recording_url")
        .eq("student_id", studentId);

      if (fetchError) throw fetchError;

      // Delete all recordings from storage
      const recordingUrls = sessions
        .map((session) => session.recording_url)
        .filter((url) => url); // Filter out any null/undefined URLs

      if (recordingUrls.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("practice-recordings")
          .remove(recordingUrls);

        if (storageError) {
          console.error("Error deleting recordings:", storageError);
        }
      }

      // Delete all session records
      const { error: deleteError } = await supabase
        .from("practice_sessions")
        .delete()
        .eq("student_id", studentId);

      if (deleteError) throw deleteError;

      return true;
    } catch (error) {
      console.error("Error cleaning up sessions:", error);
      throw error;
    }
  },
};
