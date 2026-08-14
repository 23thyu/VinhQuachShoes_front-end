/**
 * Utility để lấy Authorization header có chứa JWT token của admin.
 * Token được lưu trong localStorage (ghi nhớ đăng nhập) hoặc sessionStorage.
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('jordan_token') || sessionStorage.getItem('jordan_token');
}

/**
 * Trả về headers chuẩn cho các API call cần xác thực (Admin).
 * Bao gồm Content-Type và Authorization Bearer token.
 */
export function getAdminHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-access-token'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Trả về headers xác thực cho multipart/form-data requests (không set Content-Type,
 * để browser tự set boundary).
 */
export function getAdminAuthOnlyHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-access-token'] = `Bearer ${token}`;
  }
  return headers;
}
