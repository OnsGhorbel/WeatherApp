// Service for handling offline requests and sync when online
class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.requestQueue = [];
    this.callbacks = new Map();
    this.init();
  }

  init() {
    // Load queued requests from localStorage
    this.loadQueueFromStorage();
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Check initial connectivity
    this.updateConnectivity();
  }

  handleOnline() {
    console.log('Internet connection restored');
    this.isOnline = true;
    this.processQueue();
  }

  handleOffline() {
    console.log('Internet connection lost');
    this.isOnline = false;
  }

  updateConnectivity() {
    this.isOnline = navigator.onLine;
  }

  // Queue a request when offline
  queueRequest(requestData) {
    const queueItem = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...requestData
    };

    this.requestQueue.push(queueItem);
    this.saveQueueToStorage();
    
    console.log('Request queued:', queueItem);
    return queueItem.id;
  }

  // Register a callback for when a queued request is processed
  onRequestProcessed(requestId, callback) {
    this.callbacks.set(requestId, callback);
  }

  // Process all queued requests when online
  async processQueue() {
    if (!this.isOnline || this.requestQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.requestQueue.length} queued requests`);
    
    const queueCopy = [...this.requestQueue];
    this.requestQueue = [];

    for (const queueItem of queueCopy) {
      try {
        await this.processQueueItem(queueItem);
      } catch (error) {
        console.error('Failed to process queued request:', error);
        // Re-queue the failed request
        this.requestQueue.push(queueItem);
      }
    }

    this.saveQueueToStorage();
  }

  async processQueueItem(queueItem) {
    const { id, type, data } = queueItem;
    
    try {
      let result;
      
      switch (type) {
        case 'weather_by_city':
          result = await this.fetchWeatherByCity(data.cityName);
          break;
        case 'weather_by_coords':
          result = await this.fetchWeatherByCoords(data.lat, data.lon);
          break;
        default:
          throw new Error(`Unknown request type: ${type}`);
      }

      // Execute callback if registered
      const callback = this.callbacks.get(id);
      if (callback) {
        callback(null, result);
        this.callbacks.delete(id);
      }

      console.log('Processed queued request:', id);
    } catch (error) {
      const callback = this.callbacks.get(id);
      if (callback) {
        callback(error, null);
        this.callbacks.delete(id);
      }
      throw error;
    }
  }

  async fetchWeatherByCity(cityName) {
    const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=b0a7bad410d5400c8c3145734251107&q=${cityName}`);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    return response.json();
  }

  async fetchWeatherByCoords(lat, lon) {
    const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=b0a7bad410d5400c8c3145734251107&q=${lat},${lon}`);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    return response.json();
  }

  // Save queue to localStorage
  saveQueueToStorage() {
    try {
      localStorage.setItem('offlineRequestQueue', JSON.stringify(this.requestQueue));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }

  // Load queue from localStorage
  loadQueueFromStorage() {
    try {
      const savedQueue = localStorage.getItem('offlineRequestQueue');
      if (savedQueue) {
        this.requestQueue = JSON.parse(savedQueue);
        console.log(`Loaded ${this.requestQueue.length} queued requests from storage`);
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
      this.requestQueue = [];
    }
  }

  // Clear all queued requests
  clearQueue() {
    this.requestQueue = [];
    this.callbacks.clear();
    this.saveQueueToStorage();
  }

  // Get current queue status
  getQueueStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.requestQueue.length,
      queue: this.requestQueue.map(item => ({
        id: item.id,
        type: item.type,
        timestamp: item.timestamp,
        data: item.data
      }))
    };
  }

  // Check if we're online and can make requests
  canMakeRequest() {
    return this.isOnline;
  }
}

export default OfflineService;
