// import axios from "axios";

// const API = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
//   withCredentials: true,
// });

// // Fetch all counsellor slots
// export const getAvailableSlots = () => API.get("/booking/slots");

// // Book an appointment
// export const bookAppointment = (data, token) =>
//   API.post("/booking", data, {
//     headers: { Authorization: `Bearer ${token}` },
//   });

// // Get user bookings
// export const getUserBookings = (token) =>
//   API.get("/booking/my", {
//     headers: { Authorization: `Bearer ${token}` },
//   });

// // Cancel booking
// export const cancelBooking = (id, token) =>
//   API.delete(`/booking/${id}`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });


// //++++++++++++
// // api/bookingApi.js
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// class BookingAPI {
//   constructor() {
//     this.baseURL = `${API_BASE_URL}/bookings`;
//   }

//   // Helper method to get auth headers
//   getAuthHeaders(token) {
//     return {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`
//     };
//   }

//   // Handle API responses
//   async handleResponse(response) {
//     const data = await response.json();
    
//     if (!response.ok) {
//       throw new Error(data.message || `HTTP error! status: ${response.status}`);
//     }
    
//     return data;
//   }

//   // Create a new booking
//   async createBooking(bookingData, token) {
//     try {
//       const response = await fetch(`${this.baseURL}`, {
//         method: 'POST',
//         headers: this.getAuthHeaders(token),
//         body: JSON.stringify(bookingData)
//       });
      
//       return await this.handleResponse(response);
//     } catch (error) {
//       console.error('Create booking error:', error);
//       throw error;
//     }
//   }

//   // Get user's bookings with filters
//   async getUserBookings(token, filters = {}) {
//     try {
//       const queryParams = new URLSearchParams();
      
//       if (filters.status) queryParams.append('status', filters.status);
//       if (filters.page) queryParams.append('page', filters.page);
//       if (filters.limit) queryParams.append('limit', filters.limit);
      
//       const url = `${this.baseURL}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
//       const response = await fetch(url, {
//         method: 'GET',
//         headers: this.getAuthHeaders(token)
//       });
      
//       return await this.handleResponse(response);
//     } catch (error) {
//       console.error('Get bookings error:', error);
//       throw error;
//     }
//   }

//   // Update booking status (approve/decline/cancel/complete)
//   async updateBookingStatus(bookingId, statusData, token) {
//     try {
//       const response = await fetch(`${this.baseURL}/${bookingId}/status`, {
//         method: 'PUT',
//         headers: this.getAuthHeaders(token),
//         body: JSON.stringify(statusData)
//       });
      
//       return await this.handleResponse(response);
//     } catch (error) {
//       console.error('Update booking status error:', error);
//       throw error;
//     }
//   }

//   // Get available counselors
//   async getAvailableCounselors(token) {
//     try {
//       const response = await fetch(`${this.baseURL}/counselors`, {
//         method: 'GET',
//         headers: this.getAuthHeaders(token)
//       });
      
//       return await this.handleResponse(response);
//     } catch (error) {
//       console.error('Get counselors error:', error);
//       throw error;
//     }
//   }

//   // Get available time slots for a counselor on a specific date
//   async getAvailableSlots(counselorId, date, token) {
//     try {
//       const response = await fetch(`${this.baseURL}/slots/${counselorId}/${date}`, {
//         method: 'GET',
//         headers: this.getAuthHeaders(token)
//       });
      
//       return await this.handleResponse(response);
//     } catch (error) {
//       console.error('Get available slots error:', error);
//       throw error;
//     }
//   }

//   // Cancel booking
//   async cancelBooking(bookingId, reason, token) {
//     try {
//       return await this.updateBookingStatus(bookingId, {
//         status: 'cancelled',
//         cancellationReason: reason
//       }, token);
//     } catch (error) {
//       console.error('Cancel booking error:', error);
//       throw error;
//     }
//   }

//   // Approve booking (counselor only)
//   async approveBooking(bookingId, meetingLink, token) {
//     try {
//       return await this.updateBookingStatus(bookingId, {
//         status: 'confirmed',
//         meetingLink: meetingLink
//       }, token);
//     } catch (error) {
//       console.error('Approve booking error:', error);
//       throw error;
//     }
//   }

//   // Complete booking session
//   async completeBooking(bookingId, token) {
//     try {
//       return await this.updateBookingStatus(bookingId, {
//         status: 'completed'
//       }, token);
//     } catch (error) {
//       console.error('Complete booking error:', error);
//       throw error;
//     }
//   }
// }

// // Export singleton instance
// export const bookingAPI = new BookingAPI();

// // Export individual methods for convenience
// export const {
//   createBooking,
//   getUserBookings,
//   updateBookingStatus,
//   getAvailableCounselors,
//   getAvailableSlots,
//   cancelBooking,
//   approveBooking,
//   completeBooking
// } = bookingAPI;


// frontend/src/api/bookingApi.js
const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

class BookingAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/bookings`;
  }

  // Get authorization headers
  getHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  // Create a new booking
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

  // Get user's bookings with optional filters
  async getUserBookings(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = queryParams.toString() ? 
        `${this.baseURL}?${queryParams}` : this.baseURL;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get bookings error:', error);
      throw error;
    }
  }

  // Get single booking by ID
  async getBookingById(bookingId) {
    try {
      const response = await fetch(`${this.baseURL}/${bookingId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get booking error:', error);
      throw error;
    }
  }

  // Update booking status
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

  // Quick approve booking (for counselors)
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

  // Quick cancel booking
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

  // Get available counselors
  async getAvailableCounselors(specialization = '') {
    try {
      const url = specialization ? 
        `${this.baseURL}/counselors?specialization=${encodeURIComponent(specialization)}` : 
        `${this.baseURL}/counselors`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get counselors error:', error);
      throw error;
    }
  }

  // Get available time slots for a counselor on a specific date
  async getAvailableSlots(counselorId, date) {
    try {
      const response = await fetch(`${this.baseURL}/slots/${counselorId}/${date}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get available slots error:', error);
      throw error;
    }
  }

  // Get booking statistics (admin only)
  async getBookingStats() {
    try {
      const response = await fetch(`${this.baseURL}/admin/stats`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get booking stats error:', error);
      throw error;
    }
  }

  // Search bookings (admin only)
  async searchBookings(searchParams) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${this.baseURL}/admin/search?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Search bookings error:', error);
      throw error;
    }
  }

  // Helper methods for date formatting
  formatDate(date) {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }

  // Helper method to get booking status color
  getStatusColor(status) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  // Helper method to get mode icon
  getModeIcon(mode) {
    const icons = {
      'online': '💻',
      'in-person': '🏢',
      'phone': '📞'
    };
    return icons[mode] || '📅';
  }
}

// Export singleton instance
const bookingAPI = new BookingAPI();
export default bookingAPI;
// Export individual methods for easier importing
export const {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  approveBooking,
  cancelBooking,
  getAvailableCounselors,
  getAvailableSlots,
  getBookingStats,
  searchBookings,
  formatDate,
  getStatusColor,
  getModeIcon
} = bookingAPI;