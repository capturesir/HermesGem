// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    // P2-3: try encoded '_s' first, fall back to legacy 'emr_token'
    const encoded = localStorage.getItem('_s');
    if (encoded) {
      try { this.token = atob(encoded); } catch { this.token = localStorage.getItem('emr_token'); }
    } else {
      this.token = localStorage.getItem('emr_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    // Store legacy + encoded for back-compat
    localStorage.setItem('emr_token', token);
    localStorage.setItem('_s', btoa(token));
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('emr_token');
    localStorage.removeItem('_s');
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.token || localStorage.getItem('emr_token');

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '請求失敗' }));
        throw new Error(error.error || '請求失敗');
      }

      // Handle file downloads
      if (response.headers.get('content-type')?.includes('application/pdf') ||
          response.headers.get('content-type')?.includes('application/octet-stream')) {
        return response.blob() as unknown as T;
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username: string, password: string) {
    const response = await this.request<{
      token: string;
      user: unknown;
    }>('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    this.setToken(response.token);
    return response;
  }

  async getMe() {
    return this.request<unknown>('/auth/me');
  }

  async updateProfile(data: unknown) {
    return this.request<unknown>('/auth/profile', {
      method: 'PUT',
      body: data,
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    });
  }

  logout() {
    this.clearToken();
  }

  // Users endpoints
  async getUsers() {
    return this.request<unknown[]>('/users');
  }

  async getUser(id: string) {
    return this.request<unknown>(`/users/${id}`);
  }

  async createUser(data: unknown) {
    return this.request<unknown>('/users', {
      method: 'POST',
      body: data,
    });
  }

  async updateUser(id: string, data: unknown) {
    return this.request<unknown>(`/users/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Patients endpoints
  async getPatients(params?: { search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<{ patients: unknown[]; pagination: unknown }>(
      `/patients${query ? `?${query}` : ''}`
    );
  }

  async getPatient(id: string) {
    return this.request<unknown>(`/patients/${id}`);
  }

  async getPatientByNumber(patientNumber: string) {
    return this.request<unknown>(`/patients/number/${patientNumber}`);
  }

  async createPatient(data: unknown) {
    return this.request<unknown>('/patients', {
      method: 'POST',
      body: data,
    });
  }

  async updatePatient(id: string, data: unknown) {
    return this.request<unknown>(`/patients/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deletePatient(id: string) {
    return this.request<{ message: string }>(`/patients/${id}`, {
      method: 'DELETE',
    });
  }

  // Alerts endpoints
  async getAlerts(patientId: string) {
    return this.request<unknown[]>(`/patients/${patientId}/alerts`);
  }

  async createAlert(patientId: string, data: unknown) {
    return this.request<unknown>(`/patients/${patientId}/alerts`, {
      method: 'POST',
      body: data,
    });
  }

  async updateAlert(id: string, data: unknown) {
    return this.request<unknown>(`/patients/alerts/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteAlert(id: string) {
    return this.request<{ message: string }>(`/patients/alerts/${id}`, {
      method: 'DELETE',
    });
  }

  // Vitals endpoints
  async getVitals(patientId: string) {
    return this.request<unknown[]>(`/patients/${patientId}/vitals`);
  }

  async createVitalSign(patientId: string, data: unknown) {
    return this.request<unknown>(`/patients/${patientId}/vitals`, {
      method: 'POST',
      body: data,
    });
  }

  async updateVitalSign(id: string, data: unknown) {
    return this.request<unknown>(`/patients/vitals/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteVitalSign(id: string) {
    return this.request<{ message: string }>(`/patients/vitals/${id}`, {
      method: 'DELETE',
    });
  }

  // Allergies endpoints
  async getAllergies(patientId: string) {
    return this.request<unknown[]>(`/patients/${patientId}/allergies`);
  }

  async createAllergy(patientId: string, data: unknown) {
    return this.request<unknown>(`/patients/${patientId}/allergies`, {
      method: 'POST',
      body: data,
    });
  }

  async updateAllergy(id: string, data: unknown) {
    return this.request<unknown>(`/patients/allergies/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteAllergy(id: string) {
    return this.request<{ message: string }>(`/patients/allergies/${id}`, {
      method: 'DELETE',
    });
  }

  // SOAP endpoints
  async getSOAPNotes(patientId: string) {
    return this.request<unknown[]>(`/patients/${patientId}/soap`);
  }

  async createSOAPNote(patientId: string, data: unknown) {
    return this.request<unknown>(`/patients/${patientId}/soap`, {
      method: 'POST',
      body: data,
    });
  }

  async updateSOAPNote(id: string, data: unknown) {
    return this.request<unknown>(`/patients/soap/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteSOAPNote(id: string) {
    return this.request<{ message: string }>(`/patients/soap/${id}`, {
      method: 'DELETE',
    });
  }

  // Prescription endpoints
  async getPrescriptions(patientId: string) {
    return this.request<unknown[]>(`/patients/${patientId}/prescriptions`);
  }

  async createPrescription(patientId: string, data: unknown) {
    return this.request<unknown>(`/patients/${patientId}/prescriptions`, {
      method: 'POST',
      body: data,
    });
  }

  async updatePrescription(id: string, data: unknown) {
    return this.request<unknown>(`/patients/prescriptions/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deletePrescription(id: string) {
    return this.request<{ message: string }>(`/patients/prescriptions/${id}`, {
      method: 'DELETE',
    });
  }

  // Document endpoints
  async getDocuments(patientId: string, category?: string) {
    const query = category ? `?category=${category}` : '';
    return this.request<unknown[]>(`/patients/${patientId}/documents${query}`);
  }

  async uploadDocument(patientId: string, formData: FormData) {
    return this.request<unknown>(`/patients/${patientId}/documents`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async deleteDocument(id: string) {
    return this.request<{ message: string }>(`/patients/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointment endpoints
  async getAppointments(params?: {
    date?: string;
    status?: string;
    doctor_id?: string;
    patient_id?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, value.toString());
    });

    const query = searchParams.toString();
    return this.request<{ appointments: unknown[]; pagination: unknown }>(
      `/appointments${query ? `?${query}` : ''}`
    );
  }

  async getAppointment(id: string) {
    return this.request<unknown>(`/appointments/${id}`);
  }

  async createAppointment(data: unknown) {
    return this.request<unknown>('/appointments', {
      method: 'POST',
      body: data,
    });
  }

  async updateAppointment(id: string, data: unknown) {
    return this.request<unknown>(`/appointments/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async checkInAppointment(id: string) {
    return this.request<unknown>(`/appointments/${id}/check-in`, {
      method: 'PUT',
    });
  }

  async completeAppointment(id: string, data: unknown) {
    return this.request<unknown>(`/appointments/${id}/complete`, {
      method: 'PUT',
      body: data,
    });
  }

  async cancelAppointment(id: string, data: { reason: string; document_url?: string }) {
    return this.request<unknown>(`/appointments/${id}/cancel`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteAppointment(id: string) {
    return this.request<{ message: string }>(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  async getWaitingList() {
    return this.request<unknown[]>('/appointments/waiting');
  }

  // Lookup endpoints
  async searchICD10(query: string) {
    return this.request<unknown[]>(`/lookup/icd10/search?q=${encodeURIComponent(query)}`);
  }

  async getAllICD10() {
    return this.request<unknown[]>('/lookup/icd10');
  }

  async searchMedications(query: string) {
    return this.request<unknown[]>(`/lookup/medications/search?q=${encodeURIComponent(query)}`);
  }

  async getAllMedications() {
    return this.request<unknown[]>('/lookup/medications');
  }

  // Statistics endpoints
  async getOverview() {
    return this.request<unknown>('/statistics/overview');
  }

  async getAppointmentStats(params?: {
    startDate?: string;
    endDate?: string;
    patientId?: string;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, value);
    });

    const query = searchParams.toString();
    return this.request<unknown>(`/statistics/appointments${query ? `?${query}` : ''}`);
  }

  async getPatientConsultations(params: {
    patientId: string;
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = new URLSearchParams({ patientId: params.patientId });
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);

    return this.request<unknown>(`/statistics/consultations?${searchParams.toString()}`);
  }

  async getICD10Stats(params?: { startDate?: string; endDate?: string }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, value);
    });

    const query = searchParams.toString();
    return this.request<unknown>(`/statistics/icd10${query ? `?${query}` : ''}`);
  }

  // Settings endpoints
  async getSettings() {
    return this.request<unknown>('/settings');
  }

  async updateSettings(data: unknown) {
    return this.request<unknown>('/settings', {
      method: 'PUT',
      body: data,
    });
  }

  async getAuditLogs(params?: {
    user_id?: string;
    action?: string;
    module?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, value.toString());
    });

    const query = searchParams.toString();
    return this.request<unknown>(`/settings/audit-logs${query ? `?${query}` : ''}`);
  }
}

export const api = new ApiService();
export default api;
