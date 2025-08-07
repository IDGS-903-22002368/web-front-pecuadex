export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  fullName: string;
  password: string;
  roles?: string[];
}

export interface AuthResponse {
  token?: string;
  isSuccess: boolean;
  message: string;
  refreshToken?: string;
}

export interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  phoneNumber?: string;
  phoneNumberConfirmed: boolean;
  accessFailedCount: number;
}
