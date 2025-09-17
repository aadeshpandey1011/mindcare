// frontend/src/utils/dateUtils.js

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (timeSlot) => {
  return timeSlot.replace('-', ' - ');
};

export const canCancelBooking = (date, timeSlot) => {
  const sessionDateTime = new Date(date);
  const [startTime] = timeSlot.split('-');
  const [hours, minutes] = startTime.split(':');
  sessionDateTime.setHours(parseInt(hours), parseInt(minutes));
  
  const twoHoursBefore = new Date(sessionDateTime.getTime() - 2 * 60 * 60 * 1000);
  return new Date() < twoHoursBefore;
};

export const isUpcomingBooking = (date) => {
  return new Date(date) > new Date();
};

export const getTimeUntilSession = (date, timeSlot) => {
  const sessionDateTime = new Date(date);
  const [startTime] = timeSlot.split('-');
  const [hours, minutes] = startTime.split(':');
  sessionDateTime.setHours(parseInt(hours), parseInt(minutes));
  
  const now = new Date();
  const timeDiff = sessionDateTime - now;
  
  if (timeDiff < 0) return 'Past';
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours_remaining = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} days`;
  if (hours_remaining > 0) return `${hours_remaining} hours`;
  return 'Soon';
};