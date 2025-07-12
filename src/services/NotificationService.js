// Notification service for weather alerts
class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = null;
    this.registration = null;
  }

  async init() {
    if (!this.isSupported) {
      console.log('Notifications not supported');
      return false;
    }

    try {
      // Register service worker - use existing registration if available
      if (navigator.serviceWorker.controller) {
        this.registration = await navigator.serviceWorker.ready;
      } else {
        this.registration = await navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/serviceWorker.js`);
      }
      console.log('Service Worker registered');
      
      // Check current permission
      this.permission = Notification.permission;
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission() {
    if (!this.isSupported) {
      return 'not-supported';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Permission request failed:', error);
      return 'denied';
    }
  }

  async scheduleDailyWeatherNotification(time = '08:00') {
    if (this.permission !== 'granted') {
      return false;
    }

    // Store notification preference
    localStorage.setItem('weatherNotificationTime', time);
    localStorage.setItem('weatherNotificationEnabled', 'true');

    // Schedule the notification
    this.scheduleDailyCheck();
    
    return true;
  }

  scheduleDailyCheck() {
    // Clear any existing interval
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }

    // Check every minute if it's time for notification
    this.notificationInterval = setInterval(() => {
      this.checkNotificationTime();
    }, 60000); // Check every minute
  }

  checkNotificationTime() {
    const enabled = localStorage.getItem('weatherNotificationEnabled') === 'true';
    const notificationTime = localStorage.getItem('weatherNotificationTime') || '08:00';
    
    if (!enabled) return;

    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    
    const lastNotificationDate = localStorage.getItem('lastWeatherNotification');
    const today = now.toDateString();

    // Check if it's time and we haven't sent today's notification
    if (currentTime === notificationTime && lastNotificationDate !== today) {
      this.sendWeatherNotification();
      localStorage.setItem('lastWeatherNotification', today);
    }
  }

  async sendWeatherNotification() {
    if (!this.registration || this.permission !== 'granted') {
      return;
    }

    try {
      // Get current location weather
      const weatherData = await this.getCurrentLocationWeather();
      
      const notificationOptions = {
        body: weatherData ? 
          `Good morning! Today's weather: ${weatherData.current.condition.text}, ${weatherData.current.temp_c}°C` :
          'Good morning! Don\'t forget to check today\'s weather forecast.',
        icon: weatherData ? weatherData.current.condition.icon : '/logo.png',
        badge: '/logo.png',
        tag: 'daily-weather',
        requireInteraction: false,
        actions: [
          {
            action: 'view',
            title: 'View Details'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ],
        data: {
          url: window.location.origin,
          weather: weatherData
        }
      };

      await this.registration.showNotification('Daily Weather Alert', notificationOptions);
    } catch (error) {
      console.error('Failed to send weather notification:', error);
    }
  }

  async getCurrentLocationWeather() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=b0a7bad410d5400c8c3145734251107&q=${latitude},${longitude}`);
            const data = await response.json();
            resolve(data);
          } catch (error) {
            console.error('Failed to fetch weather:', error);
            resolve(null);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        },
        { timeout: 10000 }
      );
    });
  }

  disableNotifications() {
    localStorage.setItem('weatherNotificationEnabled', 'false');
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
  }

  isNotificationEnabled() {
    return localStorage.getItem('weatherNotificationEnabled') === 'true';
  }

  getNotificationTime() {
    return localStorage.getItem('weatherNotificationTime') || '08:00';
  }

  // Send immediate test notification
  async sendTestNotification() {
    if (this.permission !== 'granted' || !this.registration) {
      return false;
    }

    try {
      await this.registration.showNotification('Weather App Test', {
        body: 'This is a test notification. Daily weather alerts are now enabled!',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'test-notification'
      });
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }
}

export default NotificationService;
