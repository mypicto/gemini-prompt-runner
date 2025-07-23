export class RetryService {

  async retryUntilSuccess(condition, timeout = 1000, interval = 100) {
    const startTime = Date.now();
    
    do {
      try {
        const result = await condition();
        if (result) {
          return result;
        }
      } catch (error) {
        throw error;
      }
      await this.#delay(interval);
    } while (Date.now() - startTime < timeout);
    
    throw new Error('Timeout: Operation failed to complete within the specified time');
  }

  #delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
