import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, LayoutDashboard, Users, UserCircle, Calendar,
  Settings, LogOut, ChevronDown, Stethoscope, Heart, FileText,
  AlertCircle, Activity, Pill, FolderOpen, Shield, BarChart3,
  Search, Printer
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigation = () => {
    const baseNav = [
      { name: '主頁', href: '/dashboard', icon: LayoutDashboard },
    ];

    const roleNav: Record<string, { name: string; href: string; icon: any }[]> = {
      admin: [
        { name: '用戶管理', href: '/users', icon: Users },
        { name: '病人列表', href: '/patients', icon: Stethoscope },
        { name: '預約管理', href: '/appointments', icon: Calendar },
        { name: '數據統計', href: '/statistics', icon: BarChart3 },
        { name: '查找工具', href: '/lookup', icon: Search },
        { name: '藥物標籤', href: '/print', icon: Printer },
        { name: '系統設定', href: '/settings', icon: Settings },
      ],
      staff: [
        { name: '病人列表', href: '/patients', icon: Stethoscope },
        { name: '預約管理', href: '/appointments', icon: Calendar },
        { name: '數據統計', href: '/statistics', icon: BarChart3 },
        { name: '藥物標籤', href: '/print', icon: Printer },
      ],
      doctor: [
        { name: '病人列表', href: '/patients', icon: Stethoscope },
        { name: '預約管理', href: '/appointments', icon: Calendar },
        { name: '數據統計', href: '/statistics', icon: BarChart3 },
        { name: '查找工具', href: '/lookup', icon: Search },
        { name: '藥物標籤', href: '/print', icon: Printer },
      ],
      nurse: [
        { name: '病人列表', href: '/patients', icon: Stethoscope },
        { name: '預約管理', href: '/appointments', icon: Calendar },
        { name: '數據統計', href: '/statistics', icon: BarChart3 },
        { name: '藥物標籤', href: '/print', icon: Printer },
      ],
      patient: [
        { name: '我的病歷', href: '/patients', icon: FileText },
        { name: '我的預約', href: '/appointments', icon: Calendar },
        { name: '數據統計', href: '/statistics', icon: BarChart3 },
        { name: '藥物標籤', href: '/print', icon: Printer },
      ],
    };

    return [...baseNav, ...(roleNav[user?.role || 'patient'] || [])];
  };

  const navigation = getNavigation();

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
      staff: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
      doctor: { bg: 'bg-blue-100', text: 'text-blue-700' },
      nurse: { bg: 'bg-pink-100', text: 'text-pink-700' },
      patient: { bg: 'bg-green-100', text: 'text-green-700' },
    };
    return badges[role] || badges.patient;
  };

  const getRoleName = (role: string) => {
    const names: Record<string, string> = {
      admin: '管理員',
      staff: '職員',
      doctor: '醫生',
      nurse: '護士',
      patient: '病人',
    };
    return names[role] || role;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-2 ml-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <span className="font-semibold text-slate-900 hidden sm:block">EMR 系統</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                    <p className={`text-xs ${getRoleBadge(user?.role || 'patient').text}`}>
                      {getRoleName(user?.role || 'patient')}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserCircle className="w-4 h-4" />
                      個人設定
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      登出
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out z-20 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="mt-6 px-4 space-y-1">
          {navigation.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Quick Stats for Admin */}
        {user?.role === 'admin' && (
          <div className="absolute bottom-4 left-4 right-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-500 uppercase mb-2">快速資訊</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">系統狀態</span>
                <span className="text-green-600 font-medium">正常</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="pt-16 lg:pl-64">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
