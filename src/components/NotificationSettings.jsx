import React, { useState, useEffect } from 'react';
import NotificationService from '../services/NotificationService';
import './NotificationSettings.css';

const NotificationSettings = () => {
  const [notificationService] = useState(new NotificationService());
  const [permission, setPermission] = useState('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initializeNotifications = async () => {
    console.log('Initializing notifications...');
    try {
      const supported = await notificationService.init();
      console.log('Notifications supported:', supported);
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        setIsEnabled(notificationService.isNotificationEnabled());
        setNotificationTime(notificationService.getNotificationTime());
        console.log('Notification permission:', Notification.permission);
        console.log('Notification enabled:', notificationService.isNotificationEnabled());
        
        // Start the daily check if notifications are enabled
        if (notificationService.isNotificationEnabled() && Notification.permission === 'granted') {
          notificationService.scheduleDailyCheck();
        }
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      setIsSupported(false);
    }
  };

  useEffect(() => {
    initializeNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      const permissionResult = await notificationService.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult === 'granted') {
        const success = await notificationService.scheduleDailyWeatherNotification(notificationTime);
        if (success) {
          setIsEnabled(true);
          // Send test notification
          await notificationService.sendTestNotification();
        }
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = () => {
    notificationService.disableNotifications();
    setIsEnabled(false);
  };

  const handleTimeChange = async (event) => {
    const newTime = event.target.value;
    setNotificationTime(newTime);
    
    if (isEnabled) {
      await notificationService.scheduleDailyWeatherNotification(newTime);
    }
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    try {
      await notificationService.sendTestNotification();
    } catch (error) {
      console.error('Test notification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="notification-settings">
        <div className="notification-card">
          <h3>🔔 Daily Weather Notifications</h3>
          <div className="notification-status not-supported">
            <p>❌ Notifications are not supported in this browser</p>
            <p>Try using a modern browser like Chrome, Firefox, or Edge</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <div className="notification-card">
        <h3>🔔 Daily Weather Notifications</h3>
        <p className="notification-description">
          Get daily weather alerts every morning to stay informed about your local weather conditions.
        </p>
        
        <div className="notification-controls">
          <div className="notification-status">
            <div className="status-indicator">
              <span className={`status-dot ${permission === 'granted' ? 'granted' : permission === 'denied' ? 'denied' : 'default'}`}></span>
              <span className="status-text">
                {permission === 'granted' ? 'Notifications Allowed' : 
                 permission === 'denied' ? 'Notifications Blocked' : 
                 'Notifications Not Requested'}
              </span>
            </div>
          </div>

          {permission === 'granted' && (
            <div className="notification-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={isEnabled ? handleDisableNotifications : handleEnableNotifications}
                  disabled={isLoading}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          )}

          {permission === 'granted' && isEnabled && (
            <div className="time-picker">
              <label htmlFor="notification-time">
                📅 Daily notification time:
              </label>
              <input
                id="notification-time"
                type="time"
                value={notificationTime}
                onChange={handleTimeChange}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="notification-actions">
            {permission !== 'granted' && (
              <button 
                className="enable-btn"
                onClick={handleEnableNotifications}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Setting up...' : '🔔 Enable Notifications'}
              </button>
            )}
            
            {permission === 'granted' && (
              <button 
                className="test-btn"
                onClick={handleTestNotification}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Sending...' : '🧪 Send Test Notification'}
              </button>
            )}
          </div>

          {permission === 'denied' && (
            <div className="permission-denied">
              <p>❌ Notifications have been blocked</p>
              <p>To enable notifications:</p>
              <ol>
                <li>Click the lock icon in your browser's address bar</li>
                <li>Change notifications to "Allow"</li>
                <li>Refresh the page</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
