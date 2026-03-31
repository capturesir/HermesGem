import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole, Gender } from '../../types';

const UserForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, users, register, updateUser } = useAuth();
  const { showToast } = useToast();

  const isEditing = !!id;
  const existingUser = isEditing ? users.find(u => u.id === id) : null;

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'patient' as UserRole,
    title: '',
    bio: '',
    gender: 'unspecified' as Gender,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingUser) {
      setFormData({
        username: existingUser.username,
        password: existingUser.password,
        name: existingUser.name,
        role: existingUser.role,
        title: existingUser.title || '',
        bio: existingUser.bio || '',
        gender: existingUser.gender,
      });
    }
  }, [existingUser]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = '請輸入帳號';
    } else if (!isEditing) {
      const exists = users.some(u => u.username === formData.username);
      if (exists) newErrors.username = '此帳號已被使用';
    }

    if (!isEditing && !formData.password) {
      newErrors.password = '請輸入密碼';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = '密碼至少需要6個字符';
    }

    if (!formData.name.trim()) {
      newErrors.name = '請輸入姓名';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    let success: boolean;
    if (isEditing && id) {
      success = updateUser(id, formData);
      if (success) {
        showToast('success', '用戶資料已更新');
        navigate('/users');
      } else {
        showToast('error', '更新失敗');
      }
    } else {
      success = register(formData);
      if (success) {
        showToast('success', '用戶已成功創建');
        navigate('/users');
      } else {
        showToast('error', '創建失敗');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/users"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回用戶列表
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEditing ? '編輯用戶' : '新增用戶'}
        </h1>
        <p className="text-slate-500 mt-1">
          {isEditing ? '修改用戶資料' : '建立新的使用者帳戶'}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              帳號 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all ${
                errors.username
                  ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-500'
                  : 'border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
              } ${isEditing ? 'bg-slate-100 cursor-not-allowed' : ''}`}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              密碼 {isEditing ? '' : <span className="text-red-500">*</span>}
              {isEditing && <span className="text-slate-400 font-normal ml-1">(留空則保持不變)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 pr-10 border rounded-lg outline-none transition-all ${
                  errors.password
                    ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all ${
                errors.name
                  ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-500'
                  : 'border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              角色 <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            >
              <option value="admin">管理員</option>
              <option value="staff">職員</option>
              <option value="doctor">醫生</option>
              <option value="nurse">護士</option>
              <option value="patient">病人</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              性別
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            >
              <option value="unspecified">未指定</option>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              職位
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="例如：內科主任、護理師"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              簡介
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              placeholder="簡短的個人描述..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
            />
            <p className="mt-1 text-xs text-slate-400 text-right">
              {formData.bio.length}/500
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Link
              to="/users"
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isEditing ? '儲存變更' : '創建用戶'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
