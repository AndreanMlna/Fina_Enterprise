import { httpClient } from '../httpClient';
import type { 
  LoginResponse, 
  RegisterPayload, 
  BackendHealthResponse, 
  SystemStatusResponse 
} from '../types';
import type { StaffMember, CreateStaffPayload } from '../../types';

export class AuthService {
  /**
   * Autentikasi Pengguna UMKM ke Backend Enterprise via PBKDF2 & JWT
   */
  async login(phoneNumber: string, pin: string): Promise<LoginResponse> {
    const data = await httpClient.post<LoginResponse>('/api/v1/auth/login', {
      phone_number: phoneNumber,
      pin,
    });
    httpClient.setAuthToken(data.access_token);
    sessionStorage.setItem('fina_auth_user', JSON.stringify(data.user));
    return data;
  }

  /**
   * Pendaftaran Akun Pengusaha UMKM Baru ke Basis Data PostgreSQL
   */
  async register(payload: RegisterPayload): Promise<LoginResponse> {
    const data = await httpClient.post<LoginResponse>('/api/v1/auth/register', payload);
    httpClient.setAuthToken(data.access_token);
    sessionStorage.setItem('fina_auth_user', JSON.stringify(data.user));
    return data;
  }

  /**
   * Verifikasi sesi login aktif & ambil profil terotentikasi
   */
  async getMe(): Promise<LoginResponse | null> {
    const token = httpClient.getAuthToken();
    if (!token) return null;
    return httpClient.get<LoginResponse | null>('/api/v1/auth/me', null);
  }

  /**
   * Pengecekan denyut nadi backend (Health Check Telemetry)
   */
  async checkHealth(): Promise<BackendHealthResponse> {
    const startTime = performance.now();
    try {
      const data = await httpClient.get<BackendHealthResponse>('/health');
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        ...data,
        latencyMs,
      };
    } catch {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        status: 'OFFLINE',
        service: 'FINA-ENTERPRISE Backend',
        version: 'Unknown',
        database: 'Disconnected',
        compliance: {
          double_entry_sak_emkm: 'STANDBY',
          uu_pdp_pii_masking: 'STANDBY',
        },
        latencyMs,
      };
    }
  }

  /**
   * Mengambil metadata spesifikasi arsitektur backend
   */
  async getSystemStatus(): Promise<SystemStatusResponse | null> {
    return httpClient.get<SystemStatusResponse | null>('/api/v1/system-status', null);
  }

  /**
   * Mengambil daftar staf karyawan toko (Owner & Manager Only)
   */
  async getStaffList(): Promise<StaffMember[]> {
    return httpClient.get<StaffMember[]>('/api/v1/auth/staff', []);
  }

  /**
   * Mendaftarkan staf karyawan baru ke naungan tenant Owner
   */
  async createStaff(payload: CreateStaffPayload): Promise<StaffMember> {
    return httpClient.post<StaffMember>('/api/v1/auth/staff', payload);
  }

  /**
   * Mengubah status aktif / non-aktif akun staf
   */
  async updateStaffStatus(userId: string, isActive: boolean): Promise<StaffMember> {
    return httpClient.patch<StaffMember>(`/api/v1/auth/staff/${userId}/status`, { is_active: isActive });
  }

  /**
   * Menghapus akun staf dari tenant toko
   */
  async deleteStaff(userId: string): Promise<{ success: boolean; message: string; user_id: string }> {
    return httpClient.delete<{ success: boolean; message: string; user_id: string }>(`/api/v1/auth/staff/${userId}`);
  }
}

export const authService = new AuthService();
