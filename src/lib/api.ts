import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials: { phone?: string; email?: string; password?: string }) =>
    api.post('/auth/login', credentials),
  
  requestOTP: (phone: string) =>
    api.post('/auth/request-otp', { phone }),
  
  verifyOTP: (phone: string, code: string) =>
    api.post('/auth/verify-otp', { phone, code }),
  
  register: (data: any) =>
    api.post('/auth/register', data),
};

// Student API
export const studentApi = {
  getById: (id: number) =>
    api.get(`/students/${id}`),
  
  getByParent: (parentId: number) =>
    api.get(`/students/parent/${parentId}`),
  
  getByClass: (classId: number) =>
    api.get(`/students/class/${classId}`),
  
  update: (id: number, data: any) =>
    api.put(`/students/${id}`, data),
};

// Progress API
export const progressApi = {
  create: (data: any) =>
    api.post('/progress', data),
  
  getByStudent: (studentId: number, params?: any) =>
    api.get(`/progress/student/${studentId}`, { params }),
  
  update: (id: number, data: any) =>
    api.put(`/progress/${id}`, data),
};

// Class API
export const classApi = {
  getAll: () =>
    api.get('/classes'),
  
  getPublic: () =>
    api.get('/classes/public'),
  
  getById: (id: number) =>
    api.get(`/classes/${id}`),
  
  create: (data: any) =>
    api.post('/classes', data),
  
  update: (id: number, data: any) =>
    api.put(`/classes/${id}`, data),
  
  generateCode: (id: number) =>
    api.post(`/classes/${id}/generate-code`),
};

// Registration API
export const registrationApi = {
  create: (data: any) =>
    api.post('/registrations', data),
  
  getAll: () =>
    api.get('/registrations'),
  
  approve: (id: number) =>
    api.post(`/registrations/${id}/approve`),
  
  reject: (id: number) =>
    api.post(`/registrations/${id}/reject`),

  submitRecovery: (data: any) =>
    api.post('/registrations/recovery', data),

  addChildAsParent: (data: { childFirstName: string; classId: number }) =>
    api.post('/registrations/add-child-authenticated', data),

  submitHalaqahChange: (data: { existingStudentId: number; newClassId: number }) =>
    api.post('/registrations/halaqah-change-authenticated', data),

  getMyRequests: () =>
    api.get('/registrations/my-requests'),
};

// Ranking API
export const rankingApi = {
  getGlobal: (period: 'monthly' | 'total' = 'monthly', classType?: 'hifz' | 'talqin') =>
    api.get('/rankings/global', { params: { period, ...(classType ? { classType } : {}) } }),
  
  getByClass: (classId: number, period: 'monthly' | 'total' = 'monthly') =>
    api.get(`/rankings/class/${classId}`, { params: { period } }),
};

// Quran Data API
export const quranApi = {
  getSurahs: () =>
    api.get('/quran/surahs'),
  
  getHizbs: () =>
    api.get('/quran/hizbs'),
  
  getVerses: (surahId: number) =>
    api.get(`/quran/surahs/${surahId}/verses`),
  
  getDailyVerse: () =>
    api.get('/quran/daily-verse'),
};

// Admin Stats API
export const adminStatsApi = {
  getOverview: () =>
    api.get('/admin/stats/overview'),
};

// Admin CRUD API
export const adminApi = {
  // Users
  getUsers: () =>
    api.get('/admin/users'),
  updateUser: (id: number, data: any) =>
    api.put(`/admin/users/${id}`, data),
  suspendUser: (id: number, suspend: boolean, reason?: string) =>
    api.post(`/admin/users/${id}/suspend`, { suspend, reason }),
  deleteUser: (id: number) =>
    api.delete(`/admin/users/${id}`),
  createTeacher: (data: { name: string; email: string; password: string }) =>
    api.post('/admin/users/teacher', data),
  
  // Students
  getStudents: () =>
    api.get('/admin/students'),
  updateStudent: (id: number, data: any) =>
    api.put(`/admin/students/${id}`, data),
  deleteStudent: (id: number) =>
    api.delete(`/admin/students/${id}`),
  
  // Classes
  updateClass: (id: number, data: any) =>
    api.put(`/admin/classes/${id}`, data),
  deleteClass: (id: number) =>
    api.delete(`/admin/classes/${id}`),

  // Recovery Requests
  getRecoveryRequests: () =>
    api.get('/admin/recovery-requests'),
  approveRecovery: (id: number, adminNotes?: string) =>
    api.post(`/admin/recovery-requests/${id}/approve`, { adminNotes }),
  suspendViaRecovery: (id: number, adminNotes?: string) =>
    api.post(`/admin/recovery-requests/${id}/suspend`, { adminNotes }),
  rejectRecovery: (id: number, adminNotes?: string) =>
    api.post(`/admin/recovery-requests/${id}/reject`, { adminNotes }),
};

// Talqin API
export const talqinApi = {
  // Weekly Assignments
  getClassAssignments: (classId: number) =>
    api.get(`/talqin/assignments/class/${classId}`),
  
  getStudentAssignments: (studentId: number) =>
    api.get(`/talqin/assignments/student/${studentId}`),
  
  createAssignment: (data: any) =>
    api.post('/talqin/assignments', data),
  
  createBulkAssignments: (data: any) =>
    api.post('/talqin/assignments/bulk', data),
  
  updateAssignmentStatus: (id: number, status: string) =>
    api.patch(`/talqin/assignments/${id}/status`, { status }),

  acknowledgeAssignment: (id: number) =>
    api.patch(`/talqin/assignments/${id}/acknowledge`),
  
  // Talqin Progress
  createProgress: (data: any) =>
    api.post('/talqin/progress', data),
  
  getStudentProgress: (studentId: number, limit?: number) =>
    api.get(`/talqin/progress/student/${studentId}`, { params: { limit } }),
  
  getClassReport: (classId: number, startDate: string, endDate: string) =>
    api.get(`/talqin/report/class/${classId}`, { params: { startDate, endDate } }),
};

// Messages API
export const messageApi = {
  sendMessage: (data: { subject: string; message: string; replyEmail?: string; messageType?: string }) =>
    api.post('/messages', data),
  
  sendPublicMessage: (data: { senderName: string; subject: string; message: string; replyEmail?: string; messageType?: string }) =>
    api.post('/messages/public', data),
  
  getAllMessages: () =>
    api.get('/messages/all'),
  
  markAsRead: (id: number) =>
    api.patch(`/messages/${id}/read`),
  
  deleteMessage: (id: number) =>
    api.delete(`/messages/${id}`),
  
  getUnreadCount: () =>
    api.get('/messages/unread-count'),
};
