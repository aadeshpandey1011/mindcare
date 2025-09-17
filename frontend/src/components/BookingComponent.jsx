// frontend/src/components/BookingComponent.jsx
// frontend/src/components/BookingComponent.jsx
// import React, { useState, useEffect } from 'react';
// import bookingAPI from '../api/bookingApi';

// const BookingComponent = ({ onBookingCreated }) => {
//   const [step, setStep] = useState(1);
//   const [formData, setFormData] = useState({
//     counselorId: '',
//     date: '',
//     timeSlot: '',
//     mode: 'online',
//     reason: '',
//     notes: ''
//   });
//   const [counselors, setCounselors] = useState([]);
//   const [availableSlots, setAvailableSlots] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});

//   // Load counselors on mount
//   useEffect(() => {
//     loadCounselors();
//   }, []);

//   // Load available slots when counselor or date changes
//   useEffect(() => {
//     if (formData.counselorId && formData.date) {
//       loadAvailableSlots();
//     }
//   }, [formData.counselorId, formData.date]);

//   const loadCounselors = async () => {
//     try {
//       setLoading(true);
//       const response = await bookingAPI.getAvailableCounselors();
//       setCounselors(response.data || []);
//     } catch (error) {
//       console.error('Error loading counselors:', error);
//       setErrors({ general: 'Failed to load counselors. Please refresh the page.' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadAvailableSlots = async () => {
//     try {
//       setLoading(true);
//       const response = await bookingAPI.getAvailableSlots(formData.counselorId, formData.date);
//       setAvailableSlots(response.data.availableSlots || []);
//     } catch (error) {
//       console.error('Error loading slots:', error);
//       setAvailableSlots([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));

//     // Clear errors when user starts typing
//     if (errors[field]) {
//       setErrors(prev => ({ ...prev, [field]: '' }));
//     }
//   };

//   const validateStep = (stepNumber) => {
//     const newErrors = {};

//     switch (stepNumber) {
//       case 1:
//         if (!formData.counselorId) newErrors.counselorId = 'Please select a counselor';
//         break;
//       case 2:
//         if (!formData.date) newErrors.date = 'Please select a date';
//         if (!formData.timeSlot) newErrors.timeSlot = 'Please select a time slot';
//         break;
//       case 3:
//         if (!formData.mode) newErrors.mode = 'Please select a session mode';
//         if (!formData.reason.trim()) newErrors.reason = 'Please provide a reason for booking';
//         if (formData.reason.trim().length > 200) newErrors.reason = 'Reason must be less than 200 characters';
//         if (formData.notes.length > 500) newErrors.notes = 'Notes must be less than 500 characters';
//         break;
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const nextStep = () => {
//     if (validateStep(step)) {
//       setStep(prev => Math.min(prev + 1, 4));
//     }
//   };

//   const prevStep = () => {
//     setStep(prev => Math.max(prev - 1, 1));
//   };

//   const handleSubmit = async () => {
//     if (!validateStep(3)) return;

//     try {
//       setLoading(true);
//       const response = await bookingAPI.createBooking(formData);

//       if (response.success) {
//         setStep(4); // Success step
//         if (onBookingCreated) {
//           onBookingCreated(response.data);
//         }
//       }
//     } catch (error) {
//       console.error('Error creating booking:', error);
//       setErrors({ general: error.message || 'Failed to create booking. Please try again.' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       counselorId: '',
//       date: '',
//       timeSlot: '',
//       mode: 'online',
//       reason: '',
//       notes: ''
//     });
//     setStep(1);
//     setErrors({});
//     setAvailableSlots([]);
//   };

//   // Get minimum date (tomorrow)
//   const getMinDate = () => {
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     return tomorrow.toISOString().split('T')[0];
//   };

//   // Get maximum date (30 days from now)
//   const getMaxDate = () => {
//     const maxDate = new Date();
//     maxDate.setDate(maxDate.getDate() + 30);
//     return maxDate.toISOString().split('T')[0];
//   };

//   const renderStepIndicator = () => (
//     <div className="flex items-center justify-between mb-8">
//       {[1, 2, 3, 4].map((stepNumber) => (
//         <React.Fragment key={stepNumber}>
//           <div
//             className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
//               step >= stepNumber ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 text-gray-300'
//             }`}
//           >
//             {stepNumber < step ? '✓' : stepNumber}
//           </div>
//           {stepNumber < 4 && (
//             <div
//               className={`flex-1 h-1 mx-4 transition-colors ${
//                 step > stepNumber ? 'bg-blue-500' : 'bg-gray-200'
//               }`}
//             />
//           )}
//         </React.Fragment>
//       ))}
//     </div>
//   );

//   // --- renderStep1, renderStep2, renderStep3, renderStep4 ---
//   // (Your original code is already correct, so I won’t repeat them here)

//   return (
//     <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
//       <div className="mb-6">
//         <h2 className="text-2xl font-bold text-gray-900 text-center">Book a Counseling Session</h2>
//         <p className="text-gray-600 text-center mt-2">Schedule your mental health support session</p>
//       </div>

//       {renderStepIndicator()}

//       {errors.general && (
//         <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
//           <p className="text-red-800">{errors.general}</p>
//         </div>
//       )}

//       <div className="min-h-[400px]">
//         {step === 1 && renderStep1()}
//         {step === 2 && renderStep2()}
//         {step === 3 && renderStep3()}
//         {step === 4 && renderStep4()}
//       </div>

//       {step < 4 && (
//         <div className="flex justify-between mt-8">
//           <button
//             onClick={prevStep}
//             disabled={step === 1}
//             className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             Previous
//           </button>

//           {step < 3 ? (
//             <button
//               onClick={nextStep}
//               disabled={loading}
//               className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               {loading ? 'Loading...' : 'Next'}
//             </button>
//           ) : (
//             <button
//               onClick={handleSubmit}
//               disabled={loading}
//               className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               {loading ? 'Submitting...' : 'Submit Booking'}
//             </button>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default BookingComponent;


import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Video, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// import bookingAPI from '../api/bookingApi';

import bookingAPI from '../api/bookingApi';

const BookingComponent = () => {
  const { user, token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [counselors, setCounselors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    counselorId: '',
    date: '',
    timeSlot: '',
    mode: 'online',
    reason: '',
    notes: ''
  });

  // Load counselors on mount
  useEffect(() => {
    fetchCounselors();
  }, []);

  // Load available slots when counselor and date are selected
  useEffect(() => {
    if (formData.counselorId && formData.date) {
      fetchAvailableSlots(formData.counselorId, formData.date);
    }
  }, [formData.counselorId, formData.date]);

  const fetchCounselors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/bookings/counselors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCounselors(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch counselors:', error);
    }
  };

  const fetchAvailableSlots = async (counselorId, date) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/bookings/slots/${counselorId}/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAvailableSlots(data.data.availableSlots);
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      setAvailableSlots([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/v1/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setBookingSuccess(true);
        setStep(4);
      } else {
        alert(data.message || 'Booking failed. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setFormData({
      counselorId: '',
      date: '',
      timeSlot: '',
      mode: 'online',
      reason: '',
      notes: ''
    });
    setStep(1);
    setBookingSuccess(false);
    setAvailableSlots([]);
  };

  const renderStepIndicator = () => (
    <div className="flex justify-between items-center mb-8">
      {[1, 2, 3, 4].map((stepNum) => (
        <div key={stepNum} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
            stepNum <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {stepNum === 4 && bookingSuccess ? <CheckCircle className="w-5 h-5" /> : stepNum}
          </div>
          {stepNum < 4 && (
            <div className={`flex-1 h-1 mx-4 ${stepNum < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Counselor</h2>
      <div className="grid gap-4">
        {counselors.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No counselors available at the moment.</p>
          </div>
        ) : (
          counselors.map((counselor) => (
            <div
              key={counselor._id}
              onClick={() => handleInputChange('counselorId', counselor._id)}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                formData.counselorId === counselor._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{counselor.fullName}</h3>
                  <p className="text-sm text-gray-600">{counselor.specialization || 'General Counseling'}</p>
                  <p className="text-xs text-gray-500">{counselor.email}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <button
        onClick={() => setStep(2)}
        disabled={!formData.counselorId}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
      >
        Next: Select Date & Time
      </button>
    </div>
  );

  const renderStep2 = () => {
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateString = maxDate.toISOString().split('T')[0];

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Date & Time</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Select Date
            </label>
            <input
              type="date"
              min={today}
              max={maxDateString}
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {formData.date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Available Time Slots
              </label>
              {availableSlots.length === 0 ? (
                <p className="text-gray-600 p-4 bg-gray-50 rounded-lg">
                  No slots available for this date. Please select another date.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => handleInputChange('timeSlot', slot)}
                      className={`p-3 text-center border rounded-lg transition-all ${
                        formData.timeSlot === slot
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setStep(1)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => setStep(3)}
            disabled={!formData.date || !formData.timeSlot}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            Next: Session Details
          </button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Session Details</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Mode</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'online', label: 'Online', icon: Video },
              { value: 'phone', label: 'Phone', icon: Phone },
              { value: 'in-person', label: 'In-Person', icon: MapPin }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleInputChange('mode', value)}
                className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                  formData.mode === value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Booking <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            placeholder="Please briefly describe what you'd like to discuss..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.reason.length}/200 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any additional information you'd like the counselor to know..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/500 characters</p>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => setStep(2)}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep(3.5)} // Go to confirmation step
          disabled={!formData.reason.trim()}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          Review Booking
        </button>
      </div>
    </div>
  );

  const renderConfirmation = () => {
    const selectedCounselor = counselors.find(c => c._id === formData.counselorId);
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirm Your Booking</h2>
        
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Counselor:</span>
            <span className="text-gray-900">{selectedCounselor?.fullName}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Date:</span>
            <span className="text-gray-900">{new Date(formData.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Time:</span>
            <span className="text-gray-900">{formData.timeSlot}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Mode:</span>
            <span className="text-gray-900 capitalize flex items-center">
              {formData.mode === 'online' && <Video className="w-4 h-4 mr-2" />}
              {formData.mode === 'phone' && <Phone className="w-4 h-4 mr-2" />}
              {formData.mode === 'in-person' && <MapPin className="w-4 h-4 mr-2" />}
              {formData.mode}
            </span>
          </div>
          
          <div className="border-t pt-4">
            <span className="font-medium text-gray-700 block mb-2">Reason:</span>
            <p className="text-gray-900 text-sm">{formData.reason}</p>
          </div>
          
          {formData.notes && (
            <div>
              <span className="font-medium text-gray-700 block mb-2">Additional Notes:</span>
              <p className="text-gray-900 text-sm">{formData.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Please Note:</p>
              <ul className="space-y-1 text-xs">
                <li>• Your booking request will be sent to the counselor for approval</li>
                <li>• You will receive email notifications about your booking status</li>
                <li>• All sessions are completely confidential</li>
                <li>• You can cancel your booking up to 2 hours before the session</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setStep(3)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Back to Edit
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Request Submitted!</h2>
        <p className="text-gray-600 mb-4">
          Your counseling session request has been sent successfully. 
        </p>
        <div className="bg-green-50 p-4 rounded-lg text-left">
          <h3 className="font-medium text-green-800 mb-2">What happens next?</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Your counselor will review and respond to your request within 24 hours</li>
            <li>• You'll receive email notifications about any status updates</li>
            <li>• If approved, you'll get session details and meeting links</li>
            <li>• Check your dashboard to track all your bookings</li>
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => window.location.href = '/NewHome'}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Go to Home
        </button>
        <button
          onClick={resetBooking}
          className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Book Another Session
        </button>
      </div>

      <div className="text-sm text-gray-500">
        Need immediate support? Call our crisis helpline: <strong>1-800-XXX-XXXX</strong>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Book a Counseling Session</h1>
          <p className="text-gray-600">Schedule a confidential session with our qualified counselors</p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="min-h-[400px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 3.5 && renderConfirmation()}
          {step === 4 && renderSuccess()}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          All bookings are confidential and private. Your information is secure with us.
        </div>
      </div>
    </div>
  );
};

export default BookingComponent;