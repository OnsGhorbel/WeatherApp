import React, { useState, useEffect } from 'react';
import { offlineService } from '../api/fetchWeather';
import './OfflineStatus.css';

const OfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueStatus, setQueueStatus] = useState({ queueLength: 0, queue: [] });
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const status = offlineService.getQueueStatus();
      setIsOnline(status.isOnline);
      setQueueStatus(status);
    };

    // Initial update
    updateStatus();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      updateStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update queue status periodically
    const interval = setInterval(updateStatus, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleClearQueue = () => {
    offlineService.clearQueue();
    setQueueStatus({ queueLength: 0, queue: [] });
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getRequestDescription = (item) => {
    switch (item.type) {
      case 'weather_by_city':
        return `Weather for "${item.data.cityName}"`;
      case 'weather_by_coords':
        return `Weather for coordinates (${item.data.lat.toFixed(2)}, ${item.data.lon.toFixed(2)})`;
      default:
        return 'Unknown request';
    }
  };

  if (isOnline && queueStatus.queueLength === 0) {
    return (
      <div className="offline-status online">
        <span className="status-indicator">
          <span className="status-dot online"></span>
          <span className="status-text">Online</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`offline-status ${isOnline ? 'online' : 'offline'}`}>
      <div className="status-main">
        <span className="status-indicator">
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
          <span className="status-text">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </span>
        
        {queueStatus.queueLength > 0 && (
          <span className="queue-info">
            <span className="queue-count">{queueStatus.queueLength}</span>
            <span className="queue-text">
              {queueStatus.queueLength === 1 ? 'request queued' : 'requests queued'}
            </span>
            <button 
              className="toggle-queue-btn"
              onClick={() => setShowQueue(!showQueue)}
            >
              {showQueue ? '▲' : '▼'}
            </button>
          </span>
        )}
      </div>

      {showQueue && queueStatus.queueLength > 0 && (
        <div className="queue-details">
          <div className="queue-header">
            <h4>Queued Requests</h4>
            <button className="clear-queue-btn" onClick={handleClearQueue}>
              Clear All
            </button>
          </div>
          <div className="queue-list">
            {queueStatus.queue.map((item) => (
              <div key={item.id} className="queue-item">
                <div className="queue-item-info">
                  <span className="request-description">
                    {getRequestDescription(item)}
                  </span>
                  <span className="request-time">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="queue-footer">
            <p className="queue-note">
              {isOnline 
                ? 'Processing queued requests...' 
                : 'Requests will be processed when internet connection is restored'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineStatus;
