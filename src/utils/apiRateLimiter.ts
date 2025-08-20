interface RequestToken {
  timestamp: number;
  resolve: () => void;
}

export class ApiRateLimiter {
  private requestQueue: RequestToken[] = [];
  private requestHistory: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number; // in milliseconds
  private isProcessing = false;

  constructor(maxRequests: number = 10, timeWindowMinutes: number = 1) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMinutes * 60 * 1000; // Convert to milliseconds
  }

  async acquireToken(): Promise<void> {
    return new Promise((resolve) => {
      const token: RequestToken = {
        timestamp: Date.now(),
        resolve,
      };

      this.requestQueue.push(token);
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const processNext = () => {
      if (this.requestQueue.length === 0) {
        this.isProcessing = false;
        return;
      }

      const now = Date.now();
      
      // Clean old requests from history
      this.requestHistory = this.requestHistory.filter(
        timestamp => now - timestamp < this.timeWindow
      );

      if (this.requestHistory.length < this.maxRequests) {
        // We can process the request immediately
        const token = this.requestQueue.shift()!;
        this.requestHistory.push(now);
        token.resolve();
        
        // Process next request after a small delay to avoid burst
        setTimeout(processNext, 100);
      } else {
        // We need to wait until the oldest request expires
        const oldestRequest = Math.min(...this.requestHistory);
        const waitTime = this.timeWindow - (now - oldestRequest) + 100; // Add 100ms buffer
        
        console.log(`Rate limit reached. Waiting ${Math.round(waitTime / 1000)}s before next request.`);
        
        setTimeout(() => {
          const token = this.requestQueue.shift()!;
          this.requestHistory.push(Date.now());
          token.resolve();
          processNext();
        }, waitTime);
      }
    };

    processNext();
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requestHistory = this.requestHistory.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    return Math.max(0, this.maxRequests - this.requestHistory.length);
  }

  getTimeUntilReset(): number {
    if (this.requestHistory.length === 0) return 0;
    
    const now = Date.now();
    const oldestRequest = Math.min(...this.requestHistory);
    const timeUntilReset = this.timeWindow - (now - oldestRequest);
    
    return Math.max(0, timeUntilReset);
  }

  getQueueLength(): number {
    return this.requestQueue.length;
  }
}

// Export singleton instance
export const apiRateLimiter = new ApiRateLimiter(10, 1); // 10 requests per minute