// Utility to initialize notifications on app startup
import NotificationService from '../services/NotificationService';

export const initializeNotifications = async () => {
  const notificationService = new NotificationService();
  
  try {
    const initialized = await notificationService.init();
    
    if (initialized && notificationService.isNotificationEnabled() && Notification.permission === 'granted') {
      // Start the daily notification schedule
      notificationService.scheduleDailyCheck();
      console.log('Daily weather notifications initialized');
    }
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
  }
};

// Call this function when the app loads
export default initializeNotifications;
