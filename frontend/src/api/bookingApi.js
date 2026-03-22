const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class BookingAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/bookings`;
  }

  // ── Read token from the single correct key ─────────────────────────────────
  // After fix 4, only dpi_token is written to localStorage.
  // Previous code read 'token' which no longer exists — causing silent 401s.
  getHeaders() {
    const token = localStorage.getItem('dpi_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  async createBooking(bookingData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(bookingData)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Create booking error:', error);
      throw error;
    }
  }

  async getUserBookings(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      const url = queryParams.toString() ? `${this.baseURL}?${queryParams}` : this.baseURL;
      const response = await fetch(url, { method: 'GET', headers: this.getHeaders() });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get bookings error:', error);
      throw error;
    }
  }

  async getBookingById(bookingId) {
    try {
      const response = await fetch(`${this.baseURL}/${bookingId}`, {
        method: 'GET', headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get booking error:', error);
      throw error;
    }
  }

  async updateBookingStatus(bookingId, statusData) {
    try {
      const response = await fetch(`${this.baseURL}/${bookingId}/status`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(statusData)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Update booking status error:', error);
      throw error;
    }
  }

  async approveBooking(bookingId, meetingLink = '') {
    try {
      const response = await fetch(`${this.baseURL}/${bookingId}/approve`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ meetingLink })
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Approve booking error:', error);
      throw error;
    }
  }

  async cancelBooking(bookingId, cancellationReason) {
    try {
      const response = await fetch(`${this.baseURL}/${bookingId}/cancel`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ cancellationReason })
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Cancel booking error:', error);
      throw error;
    }
  }

  async getAvailableCounselors(specialization = '') {
    try {
      const url = specialization
        ? `${this.baseURL}/counselors?specialization=${encodeURIComponent(specialization)}`
        : `${this.baseURL}/counselors`;
      const response = await fetch(url, { method: 'GET', headers: this.getHeaders() });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get counselors error:', error);
      throw error;
    }
  }

  async getAvailableSlots(counselorId, date) {
    try {
      const response = await fetch(`${this.baseURL}/slots/${counselorId}/${date}`, {
        method: 'GET', headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get available slots error:', error);
      throw error;
    }
  }

  async getBookingStats() {
    try {
      const response = await fetch(`${this.baseURL}/admin/stats`, {
        method: 'GET', headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get booking stats error:', error);
      throw error;
    }
  }

  async searchBookings(searchParams) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      const response = await fetch(`${this.baseURL}/admin/search?${queryParams}`, {
        method: 'GET', headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Search bookings error:', error);
      throw error;
    }
  }

  // Helpers
  getStatusColor(status) {
    const colors = {
      pending:   'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getModeIcon(mode) {
    const icons = { 'online': '💻', 'in-person': '🏢', 'phone': '📞' };
    return icons[mode] || '📅';
  }
}

const bookingAPI = new BookingAPI();
export default bookingAPI;
export const {
  createBooking, getUserBookings, getBookingById, updateBookingStatus,
  approveBooking, cancelBooking, getAvailableCounselors, getAvailableSlots,
  getBookingStats, searchBookings, getStatusColor, getModeIcon
} = bookingAPI;
