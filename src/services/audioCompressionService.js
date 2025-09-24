/**
 * Audio Compression Service
 * Provides audio compression, format conversion, and optimization utilities
 */

// Audio quality presets
export const AUDIO_QUALITY_PRESETS = {
  LOW: {
    bitRate: 64000,
    sampleRate: 22050,
    quality: "low",
    label: "Low (64kbps)",
    fileSize: "smallest",
  },
  MEDIUM: {
    bitRate: 128000,
    sampleRate: 44100,
    quality: "medium",
    label: "Medium (128kbps)",
    fileSize: "balanced",
  },
  HIGH: {
    bitRate: 192000,
    sampleRate: 44100,
    quality: "high",
    label: "High (192kbps)",
    fileSize: "larger",
  },
  LOSSLESS: {
    bitRate: 320000,
    sampleRate: 48000,
    quality: "lossless",
    label: "Lossless (320kbps)",
    fileSize: "largest",
  },
};

// Supported output formats
export const SUPPORTED_FORMATS = {
  WEBM_OPUS: {
    mimeType: "audio/webm;codecs=opus",
    extension: "webm",
    label: "WebM (Opus)",
    compatibility: "modern browsers",
    compression: "excellent",
  },
  WEBM: {
    mimeType: "audio/webm",
    extension: "webm",
    label: "WebM",
    compatibility: "good",
    compression: "good",
  },
  MP4: {
    mimeType: "audio/mp4",
    extension: "m4a",
    label: "MP4 (AAC)",
    compatibility: "excellent",
    compression: "good",
  },
  OGG: {
    mimeType: "audio/ogg;codecs=opus",
    extension: "ogg",
    label: "OGG (Opus)",
    compatibility: "firefox, chrome",
    compression: "excellent",
  },
};

class AudioCompressionService {
  /**
   * Get optimal recording options based on quality preset and browser support
   */
  static getRecordingOptions(
    qualityPreset = "MEDIUM",
    preferredFormat = "WEBM_OPUS"
  ) {
    // Validate and fallback qualityPreset
    let quality = AUDIO_QUALITY_PRESETS[qualityPreset];
    if (!quality) {
      console.warn(
        `Invalid quality preset "${qualityPreset}", falling back to MEDIUM`
      );
      quality = AUDIO_QUALITY_PRESETS.MEDIUM;
    }

    // Validate and fallback preferredFormat
    let format = SUPPORTED_FORMATS[preferredFormat];
    if (!format) {
      console.warn(
        `Invalid format "${preferredFormat}", falling back to WEBM_OPUS`
      );
      preferredFormat = "WEBM_OPUS";
      format = SUPPORTED_FORMATS.WEBM_OPUS;
    }

    // Test format support and fallback if needed
    const supportedFormat = this.getBestSupportedFormat(preferredFormat);

    return {
      mimeType: supportedFormat.mimeType,
      audioBitsPerSecond: quality.bitRate,
      options: {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: quality.sampleRate,
          channelCount: 1, // Mono for smaller file size
        },
      },
      format: supportedFormat,
      quality: quality,
    };
  }

  /**
   * Test browser support for audio formats and return the best option
   */
  static getBestSupportedFormat(preferred = "WEBM_OPUS") {
    const formatPriority = [preferred, "WEBM_OPUS", "WEBM", "MP4", "OGG"];

    for (const formatKey of formatPriority) {
      const format = SUPPORTED_FORMATS[formatKey];
      if (format && MediaRecorder.isTypeSupported(format.mimeType)) {
        return format;
      }
    }

    // Fallback to basic webm if nothing else works
    return SUPPORTED_FORMATS.WEBM;
  }

  /**
   * Compress audio blob using Web Audio API (experimental)
   */
  static async compressAudioBlob(blob, targetQuality = "MEDIUM") {
    try {
      let quality = AUDIO_QUALITY_PRESETS[targetQuality];
      if (!quality) {
        console.warn(
          `Invalid quality preset "${targetQuality}", falling back to MEDIUM`
        );
        quality = AUDIO_QUALITY_PRESETS.MEDIUM;
      }

      // For now, return the original blob as browser-native compression
      // is already quite good. In the future, this could implement
      // additional compression using Web Audio API

      return {
        blob,
        originalSize: blob.size,
        compressedSize: blob.size,
        compressionRatio: 1,
        format: this.detectBlobFormat(blob),
        quality: quality,
      };
    } catch (error) {
      console.error("Audio compression failed:", error);
      throw new Error("Failed to compress audio");
    }
  }

  /**
   * Estimate file size based on duration and quality settings
   */
  static estimateFileSize(durationSeconds, qualityPreset = "MEDIUM") {
    let quality = AUDIO_QUALITY_PRESETS[qualityPreset];
    if (!quality) {
      console.warn(
        `Invalid quality preset "${qualityPreset}", falling back to MEDIUM`
      );
      quality = AUDIO_QUALITY_PRESETS.MEDIUM;
    }

    const bitsPerSecond = quality.bitRate;
    const bytesPerSecond = bitsPerSecond / 8;
    const estimatedBytes = durationSeconds * bytesPerSecond;

    return {
      bytes: Math.round(estimatedBytes),
      kilobytes: Math.round(estimatedBytes / 1024),
      megabytes: Math.round((estimatedBytes / (1024 * 1024)) * 100) / 100,
      humanReadable: this.formatFileSize(estimatedBytes),
    };
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Detect the format of an audio blob
   */
  static detectBlobFormat(blob) {
    if (blob.type.includes("webm")) {
      return blob.type.includes("opus")
        ? SUPPORTED_FORMATS.WEBM_OPUS
        : SUPPORTED_FORMATS.WEBM;
    } else if (blob.type.includes("mp4")) {
      return SUPPORTED_FORMATS.MP4;
    } else if (blob.type.includes("ogg")) {
      return SUPPORTED_FORMATS.OGG;
    }

    return SUPPORTED_FORMATS.WEBM; // Default fallback
  }

  /**
   * Validate audio blob before processing
   */
  static validateAudioBlob(blob, maxSizeMB = 50) {
    const errors = [];

    if (!blob) {
      errors.push("No audio blob provided");
    }

    if (blob && blob.size === 0) {
      errors.push("Audio blob is empty");
    }

    if (blob && blob.size > maxSizeMB * 1024 * 1024) {
      errors.push(
        `File size (${this.formatFileSize(blob.size)}) exceeds maximum allowed size (${maxSizeMB}MB)`
      );
    }

    if (blob && !blob.type.includes("audio")) {
      errors.push("Invalid file type. Expected audio file.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      fileInfo: blob
        ? {
            size: blob.size,
            type: blob.type,
            sizeFormatted: this.formatFileSize(blob.size),
          }
        : null,
    };
  }

  /**
   * Get browser audio capabilities
   */
  static getBrowserCapabilities() {
    const capabilities = {
      mediaRecorder: !!window.MediaRecorder,
      webAudio: !!(window.AudioContext || window.webkitAudioContext),
      getUserMedia: !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      ),
      supportedFormats: [],
    };

    // Test format support
    Object.entries(SUPPORTED_FORMATS).forEach(([key, format]) => {
      if (
        MediaRecorder.isTypeSupported &&
        MediaRecorder.isTypeSupported(format.mimeType)
      ) {
        capabilities.supportedFormats.push({
          key,
          ...format,
        });
      }
    });

    return capabilities;
  }

  /**
   * Create optimized recording configuration for specific use cases
   */
  static getOptimizedConfig(useCase = "practice") {
    const configs = {
      practice: {
        // Balanced quality for practice sessions
        quality: "MEDIUM",
        format: "WEBM_OPUS",
        maxDuration: 600, // 10 minutes
        description: "Optimized for practice session recordings",
      },
      demo: {
        // High quality for demos and presentations
        quality: "HIGH",
        format: "WEBM_OPUS",
        maxDuration: 300, // 5 minutes
        description: "High quality for demos and presentations",
      },
      quick: {
        // Low quality for quick notes and short recordings
        quality: "LOW",
        format: "WEBM_OPUS",
        maxDuration: 120, // 2 minutes
        description: "Compact size for quick recordings",
      },
      archive: {
        // Best quality for archival purposes
        quality: "LOSSLESS",
        format: "WEBM_OPUS",
        maxDuration: 1800, // 30 minutes
        description: "Best quality for long-term storage",
      },
    };

    const config = configs[useCase] || configs.practice;
    const recordingOptions = this.getRecordingOptions(
      config.quality,
      config.format
    );

    return {
      ...config,
      ...recordingOptions,
      // Preserve the original quality string (don't let it get overwritten by recordingOptions.quality object)
      qualityPreset: config.quality,
    };
  }
}

export default AudioCompressionService;
