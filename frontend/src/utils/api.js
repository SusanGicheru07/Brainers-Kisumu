// API configuration and helper functions
const API_BASE_URL = "http://localhost:8000";

// API client setup
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      credentials: "include", // Important: include cookies for session auth
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Auth methods
  async register(userData) {
    return this.request("/register/", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const response = await this.request("/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    // Store user info (session is handled by cookies)
    if (response.user) {
      localStorage.setItem("user", JSON.stringify(response.user));
      // We can store the session indicator but don't use it for auth
      if (response.token) {
        localStorage.setItem("sessionId", response.token);
      }
    }
    return response;
  }

  async logout() {
    await this.request("/logout/", { method: "POST" });
    localStorage.removeItem("sessionId");
    localStorage.removeItem("user");
  }

  async hospitalSignup(hospitalData) {
    return this.request("/hospital/signup/", {
      method: "POST",
      body: JSON.stringify(hospitalData),
    });
  }

  // Generic HTTP methods
  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  // Dashboard methods
  async getHospitalDashboardData() {
    return this.request("/api/dashboard/hospital/");
  }

  async getCountyDashboardData() {
    return this.request("/api/dashboard/county/");
  }

  async getWeeklyPatientVisits() {
    return this.request("/patients/api/weekly-patient-visits/");
  }

  // Staff access request
  async requestStaffAccess(requestData) {
    return this.request("/staff/request-access/", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
  }

  // Get hospitals list
  async getHospitals() {
    return this.request("/");
  }

  // Patient methods
  async getPatients() {
    return this.request("/patients/api/patients/");
  }

  async getPatient(patientId) {
    return this.request(`/patients/api/patients/${patientId}/`);
  }

  async createPatient(patientData) {
    return this.request("/patients/api/patients/", {
      method: "POST",
      body: JSON.stringify(patientData),
    });
  }

  async updatePatient(patientId, patientData) {
    return this.request(`/patients/api/patients/${patientId}/`, {
      method: "PUT",
      body: JSON.stringify(patientData),
    });
  }

  async partialUpdatePatient(patientId, patientData) {
    return this.request(`/patients/api/patients/${patientId}/`, {
      method: "PATCH",
      body: JSON.stringify(patientData),
    });
  }

  async deletePatient(patientId) {
    const response = await fetch(
      `${this.baseURL}/patients/api/patients/${patientId}/`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("authToken") && {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          }),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.message ||
          errorData.detail ||
          `HTTP ${response.status}: ${response.statusText}`
      );
      error.response = response;
      error.status = response.status;
      throw error;
    }

    // DELETE requests typically return 204 No Content, so no JSON parsing needed
    return response.status === 204 ? true : await response.json();
  }

  // Appointment methods
  async getAppointments() {
    return this.request("/patients/api/appointments/");
  }

  async getAppointment(appointmentId) {
    return this.request(`/patients/api/appointments/${appointmentId}/`);
  }

  async createAppointment(appointmentData) {
    return this.request("/patients/api/appointments/", {
      method: "POST",
      body: JSON.stringify(appointmentData),
    });
  }

  async updateAppointment(appointmentId, appointmentData) {
    return this.request(`/patients/api/appointments/${appointmentId}/`, {
      method: "PUT",
      body: JSON.stringify(appointmentData),
    });
  }

  async partialUpdateAppointment(appointmentId, appointmentData) {
    return this.request(`/patients/api/appointments/${appointmentId}/`, {
      method: "PATCH",
      body: JSON.stringify(appointmentData),
    });
  }

  async deleteAppointment(appointmentId) {
    const response = await fetch(
      `${this.baseURL}/patients/api/appointments/${appointmentId}/`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("authToken") && {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          }),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.message ||
          errorData.detail ||
          `HTTP ${response.status}: ${response.statusText}`
      );
      error.response = response;
      error.status = response.status;
      throw error;
    }

    // DELETE requests typically return 204 No Content, so no JSON parsing needed
    return response.status === 204 ? true : await response.json();
  }
}

// Create and export API client instance
export const apiClient = new ApiClient();

// Auth helper functions
export const isAuthenticated = () => {
  // For session auth, we check if user data exists (session is managed by cookies)
  return !!localStorage.getItem("user");
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const getUserType = () => {
  const user = getCurrentUser();
  return user?.user_type || null;
};

// Date formatting helper
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Number formatting helper
export const formatNumber = (number) => {
  return new Intl.NumberFormat().format(number);
};

export default apiClient;
