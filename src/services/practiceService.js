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
          recording_description: notes || "Practice session recording",
          has_recording: true, // Mark as having an actual audio recording
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
      .eq("has_recording", true) // Only show actual practice recordings with audio
      .not("recording_url", "is", null) // Ensure recording_url is not null
      .neq("recording_url", "") // Ensure recording_url is not empty
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
      //   

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

      //   

      // Delete the session record first
      const { error: deleteError } = await supabase
        .from("practice_sessions")
        .delete()
        .eq("id", sessionId);

      if (deleteError) {
        console.error("Error deleting session record:", deleteError);
        throw deleteError;
      }

      //   

      // Then delete the recording from storage if it exists
      if (session?.recording_url) {
        const { error: storageError } = await supabase.storage
          .from("practice-recordings")
          .remove([session.recording_url]);

        if (storageError) {
          console.error("Error deleting recording file:", storageError);
          // Don't throw here as the database record is already deleted
        } else {
          
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

  /**
   * Save a practice session without an audio recording (for games)
   * @param {string} studentId - Student UUID
   * @param {Object} sessionData - Session details
   * @param {Object} gameMetadata - Game-specific metadata
   * @returns {Promise<Object>} Created session object
   */
  async savePracticeSessionWithoutRecording(
    studentId,
    sessionData = {},
    gameMetadata = {}
  ) {
    try {
      const {
        description = "Sight Reading Game Session",
        duration = 0,
        analysisScore = 0,
        notesPlayed = 0,
        uniqueNotes = 0,
        status = PRACTICE_SESSION_STATUS.PENDING_REVIEW,
      } = sessionData;

      // Determine status based on score if not provided
      let finalStatus = status;
      if (analysisScore >= 80) {
        finalStatus = PRACTICE_SESSION_STATUS.EXCELLENT;
      } else if (analysisScore >= 60) {
        finalStatus = PRACTICE_SESSION_STATUS.REVIEWED;
      } else if (analysisScore > 0) {
        finalStatus = PRACTICE_SESSION_STATUS.NEEDS_WORK;
      }

      // Create a record in the practice_sessions table
      const { data, error } = await supabase
        .from("practice_sessions")
        .insert({
          student_id: studentId,
          recording_url: "", // No recording file
          recording_description: description,
          has_recording: false, // Mark as game session without audio file
          status: finalStatus,
          submitted_at: new Date().toISOString(),
          duration: Math.floor(duration || 0),
          analysis_score: analysisScore,
          notes_played: notesPlayed,
          unique_notes: uniqueNotes,
          game_metadata: gameMetadata, // Store game-specific data as JSON
        })
        .select()
        .single();

      if (error) {
        console.error("Session creation error:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error saving practice session:", error);
      throw error;
    }
  },
};
