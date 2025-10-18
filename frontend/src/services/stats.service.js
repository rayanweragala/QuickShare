import { logger } from "../utils/logger";

class StatsService {
  constructor() {
    this.stats = this.loadStats();
  }

  loadStats() {
    try {
      const stored = localStorage.getItem("localshare_stats");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.dailyStats) {
          parsed.dailyStats = {};
        }
        return parsed;
      }
    } catch (error) {
      logger.error("failed to load stats", error);
    }

    return {
      totalFiles: 0,
      totalBytes: 0,
      totalSessions: 0,
      lastUpdated: Date.now(),
      dailyStats: {},
    };
  }

  saveStats() {
    try {
      localStorage.setItem("localshare_stats", JSON.stringify(this.stats));
    } catch (error) {
      logger.error("failed to save stats", error);
    }
  }

  recordFileTransfer(fileName, fileSize, sessionType) {
    const today = new Date().toISOString().split("T")[0];

    if (!this.stats.dailyStats) {
      this.stats.dailyStats = {};
    }

    if (!this.stats.dailyStats[today]) {
      this.stats.dailyStats[today] = {
        files: 0,
        bytes: 0,
        sessions: 0,
      };
    }

    this.stats.totalFiles += 1;
    this.stats.totalBytes += fileSize;
    this.stats.dailyStats[today].files += 1;
    this.stats.dailyStats[today].bytes += fileSize;
    this.stats.lastUpdated = Date.now();

    this.cleanupOldStats();

    this.saveStats();

    logger.info("File transfer recorded:", {
      fileName,
      fileSize,
      totalFiles: this.stats.totalFiles,
    });

    return this.stats;
  }

  recordSession(sessionType) {
    const today = new Date().toISOString().split("T")[0];

    if (!this.stats.dailyStats) {
      this.stats.dailyStats = {};
    }

    if (!this.stats.dailyStats[today]) {
      this.stats.dailyStats[today] = {
        files: 0,
        bytes: 0,
        sessions: 0,
      };
    }

    this.stats.totalSessions += 1;
    this.stats.dailyStats[today].sessions += 1;
    this.stats.lastUpdated = Date.now();

    this.saveStats();
    return this.stats;
  }

  cleanupOldStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    Object.keys(this.stats.dailyStats).forEach((date) => {
      if (new Date(date) < thirtyDaysAgo) {
        delete this.stats.dailyStats[date];
      }
    });
  }

  getStats() {
    if (!this.stats.dailyStats) {
      this.stats.dailyStats = {};
    }
    return { ...this.stats };
  }

  getTodayStats() {
    const today = new Date().toISOString().split("T")[0];
    if (!this.stats.dailyStats) {
      this.stats.dailyStats = {};
    }
    return this.stats.dailyStats[today] || { files: 0, bytes: 0, sessions: 0 };
  }


  // backend syncing not doing this now maybe future :)
  // async syncWithBackend() {
  //   try {
  //     return this.stats;
  //   } catch (error) {
  //     logger.error("Failed to sync stats with backend:", error);
  //     return this.stats;
  //   }
  // }
}

export const statsService = new StatsService();
