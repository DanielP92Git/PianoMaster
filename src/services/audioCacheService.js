/**
 * Audio Cache Service
 * Implements LRU caching for frequently accessed audio recordings
 */

class AudioCacheService {
  constructor(maxSize = 50, maxAge = 30 * 60 * 1000) { // 30 minutes default
    this.cache = new Map();
    this.maxSize = maxSize;
    this.maxAge = maxAge;
    this.accessOrder = new Map(); // Track access times
    this.cleanupInterval = null;
    
    // Start cleanup timer
    this.startCleanup();
  }

  /**
   * Get cached audio URL or create new one
   */
  async get(key, fetchFunction) {
    const now = Date.now();
    
    // Check if we have a valid cached entry
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      
      // Check if entry is still valid (not expired)
      if (now - entry.timestamp < this.maxAge) {
        // Update access time
        this.accessOrder.set(key, now);
        
        // Verify the URL is still valid (not revoked)
        if (this.isUrlValid(entry.url)) {
          return entry.url;
        } else {
          // URL was revoked, remove from cache
          this.delete(key);
        }
      } else {
        // Entry expired, remove it
        this.delete(key);
      }
    }

    // Fetch new URL
    try {
      const url = await fetchFunction();
      this.set(key, url);
      return url;
    } catch (error) {
      console.error('Failed to fetch audio URL for caching:', error);
      throw error;
    }
  }

  /**
   * Set a cached audio URL
   */
  set(key, url) {
    const now = Date.now();
    
    // If cache is full, remove least recently used item
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    // Store the entry
    this.cache.set(key, {
      url,
      timestamp: now,
      size: this.estimateSize(url)
    });
    
    // Update access order
    this.accessOrder.set(key, now);
  }

  /**
   * Delete a cached entry
   */
  delete(key) {
    const entry = this.cache.get(key);
    if (entry) {
      // Revoke the object URL to free memory
      try {
        if (entry.url.startsWith('blob:')) {
          URL.revokeObjectURL(entry.url);
        }
      } catch (error) {
        console.warn('Failed to revoke URL:', error);
      }
    }
    
    this.cache.delete(key);
    this.accessOrder.delete(key);
  }

  /**
   * Clear all cached entries
   */
  clear() {
    // Revoke all object URLs
    for (const [key, entry] of this.cache.entries()) {
      if (entry.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(entry.url);
        } catch (error) {
          console.warn('Failed to revoke URL during clear:', error);
        }
      }
    }
    
    this.cache.clear();
    this.accessOrder.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let totalSize = 0;
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += entry.size;
      if (now - entry.timestamp >= this.maxAge) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalEstimatedSize: totalSize,
      expiredEntries: expiredCount,
      hitRate: this.calculateHitRate(),
      oldestEntry: this.getOldestEntry(),
      newestEntry: this.getNewestEntry()
    };
  }

  /**
   * Preload audio URLs for better performance
   */
  async preload(urlMappings) {
    const promises = Object.entries(urlMappings).map(async ([key, fetchFunction]) => {
      try {
        if (!this.cache.has(key)) {
          await this.get(key, fetchFunction);
        }
      } catch (error) {
        console.warn(`Failed to preload audio for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Check if cached URL is still valid
   */
  isUrlValid(url) {
    if (!url) return false;
    
    // For blob URLs, we assume they're valid unless revoked
    if (url.startsWith('blob:')) {
      return true;
    }
    
    // For regular URLs, we could check with a HEAD request
    // but that might be expensive, so we'll assume valid for now
    return true;
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();

    // Find the least recently used entry
    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * Start automatic cleanup of expired entries
   */
  startCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Remove expired entries
   */
  cleanupExpired() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.maxAge) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      
    }
  }

  /**
   * Estimate memory size of URL (rough approximation)
   */
  estimateSize(url) {
    return url.length * 2; // Rough estimate for string storage
  }

  /**
   * Calculate cache hit rate (simplified)
   */
  calculateHitRate() {
    // This is a simplified implementation
    // In a real scenario, you'd track hits vs misses
    return this.cache.size > 0 ? 0.85 : 0; // Mock hit rate
  }

  /**
   * Get oldest cache entry info
   */
  getOldestEntry() {
    let oldest = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldest = { key, timestamp: entry.timestamp };
      }
    }

    return oldest;
  }

  /**
   * Get newest cache entry info
   */
  getNewestEntry() {
    let newest = null;
    let newestTime = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp > newestTime) {
        newestTime = entry.timestamp;
        newest = { key, timestamp: entry.timestamp };
      }
    }

    return newest;
  }

  /**
   * Destroy the cache and cleanup resources
   */
  destroy() {
    this.stopCleanup();
    this.clear();
  }
}

// Create and export singleton instance
const audioCacheService = new AudioCacheService();

export default audioCacheService; 