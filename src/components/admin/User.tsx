/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserCheck, Shield, Lock, Unlock, ShieldAlert, Loader2, Phone, Mail } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface UserBackend {
  id: number;
  email: string;
  name: string;
  phone: string | number | null;
  role: number; // 1 = USER, 2 = ADMIN
  is_locked: number; // 0 = Active, 1 = Locked
  avatar: string | null;
  created_at?: string;
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:3009/api';

export const UserManagement: React.FC = () => {
  const { toast, confirmModal } = useToast();
  const [users, setUsers] = useState<UserBackend[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (response.ok) {
        const result = await response.json();
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (user: UserBackend) => {
    const newRole = user.role === 2 ? 1 : 2; // Toggle ADMIN (2) <-> USER (1)
    const msg = user.role === 2 
      ? `Bạn có chắc chắn muốn hạ quyền ADMIN của ${user.name} xuống USER không?`
      : `Bạn có chắc chắn muốn nâng quyền USER của ${user.name} lên ADMIN không?`;

    const confirmed = await confirmModal(msg);
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}/admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      } else {
        const err = await response.json();
        toast.error(err.message || 'LỖI KHI THAY ĐỔI QUYỀN HẠN');
      }
    } catch (error) {
      console.error('Toggle role error:', error);
    }
  };

  const handleToggleLock = async (user: UserBackend) => {
    const newLockStatus = user.is_locked === 1 ? 0 : 1; // Toggle locked (1) <-> unlocked (0)
    const msg = user.is_locked === 1 
      ? `Bạn có chắc chắn muốn mở khóa tài khoản của ${user.name} không?`
      : `Bạn có chắc chắn muốn khóa tài khoản của ${user.name} không?`;

    const confirmed = await confirmModal(msg);
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}/admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_locked: newLockStatus })
      });

      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_locked: newLockStatus } : u));
      } else {
        const err = await response.json();
        toast.error(err.message || 'LỖI KHI THAY ĐỔI TRẠNG THÁI KHÓA');
      }
    } catch (error) {
      console.error('Toggle lock error:', error);
    }
  };

  const getRoleBadge = (role: number) => {
    if (role === 2) {
      return (
        <span className="inline-flex items-center gap-1 border border-crimson-900 bg-red-950/20 px-2 py-0.5 text-[8px] font-mono font-bold tracking-widest text-red-400 uppercase">
          <Shield className="h-2.5 w-2.5" /> ADMINISTRATOR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[8px] font-mono font-semibold tracking-widest text-zinc-400 uppercase">
        CLIENT SUBSCRIBER
      </span>
    );
  };

  const getStatusBadge = (isLocked: number) => {
    if (isLocked === 1) {
      return (
        <span className="inline-flex items-center gap-1 border border-amber-900 bg-amber-950/25 px-2 py-0.5 text-[8px] font-mono font-semibold tracking-widest text-amber-500 uppercase">
          BỊ KHÓA
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 border border-emerald-950 bg-emerald-950/20 px-2 py-0.5 text-[8px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
        HOẠT ĐỘNG
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="border-b border-zinc-900 pb-6">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-550 flex items-center gap-1">
          <ShieldAlert className="h-3.5 w-3.5" /> USER REGISTRY PORTS
        </span>
        <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight mt-1">
          QUẢN LÝ NGƯỜI DÙNG
        </h2>
      </div>

      {/* Users table */}
      <div className="border border-zinc-900 bg-zinc-950 p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 font-mono text-[10px] text-zinc-550 tracking-widest">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500 mb-2" />
            RESOLVING ACCOUNT DATABASES...
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center font-mono text-xs text-zinc-650">
            KHÔNG TÌM THẤY TÀI KHOẢN NGƯỜI DÙNG NÀO
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-mono text-xs text-zinc-450 border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] text-zinc-550 uppercase tracking-widest">
                  <th className="pb-3 font-semibold">MÃ KH</th>
                  <th className="pb-3 font-semibold">ẢNH ĐẠI DIỆN</th>
                  <th className="pb-3 font-semibold">THÔNG TIN KHÁCH HÀNG</th>
                  <th className="pb-3 font-semibold">LIÊN HỆ</th>
                  <th className="pb-3 font-semibold text-center">QUYỀN HẠN</th>
                  <th className="pb-3 font-semibold text-center">TRẠNG THÁI</th>
                  <th className="pb-3 font-semibold text-center">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-900/20 transition-colors">
                    {/* User ID */}
                    <td className="py-3.5 text-zinc-600 font-bold">#{user.id}</td>

                    {/* Avatar */}
                    <td className="py-3.5">
                      <div className="h-9 w-9 border border-zinc-900 bg-zinc-950 rounded-full flex items-center justify-center overflow-hidden p-0.5 flex-shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-full w-full object-cover rounded-full"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-[10px] text-zinc-600 font-bold uppercase">
                            {user.name.slice(0, 2)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name & Email */}
                    <td className="py-3.5">
                      <p className="text-white font-bold uppercase tracking-wider">{user.name}</p>
                      <p className="text-[9px] text-zinc-550 lowercase font-light mt-0.5">{user.email}</p>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-zinc-600" />
                        {user.phone || '—'}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 text-center">
                      {getRoleBadge(user.role)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 text-center">
                      {getStatusBadge(user.is_locked)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 text-center">
                      <div className="inline-flex gap-2">
                        {/* Toggle Role Button */}
                        <button
                          onClick={() => handleToggleRole(user)}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-zinc-900 bg-zinc-950/60 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer font-mono text-[9px] uppercase tracking-wider"
                          title="Đổi vai trò ADMIN/USER"
                        >
                          <UserCheck className="h-3 w-3" />
                          Đổi vai trò
                        </button>

                        {/* Toggle Lock Button */}
                        <button
                          onClick={() => handleToggleLock(user)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 border border-zinc-900 bg-zinc-950/60 transition-all cursor-pointer font-mono text-[9px] uppercase tracking-wider ${
                            user.is_locked === 1 
                              ? 'hover:border-emerald-950 text-zinc-400 hover:text-emerald-400' 
                              : 'hover:border-amber-950 text-zinc-450 hover:text-amber-500'
                          }`}
                          title={user.is_locked === 1 ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                        >
                          {user.is_locked === 1 ? (
                            <>
                              <Unlock className="h-3 w-3" />
                              Mở khóa
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" />
                              Khóa
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default UserManagement;
