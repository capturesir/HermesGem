import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Appointment, AppointmentStatus, AppointmentType } from '../../types';
import { getCSTDateString, toCSTDateString } from '../../lib/dateUtils';

// Extract YYYY-MM-DD from a Date object or date string (handles both Date objects from MySQL2 and date strings)
const getDateKey = (date: Date | string): string => {
  if (typeof date === 'string') {
    // If it's already YYYY-MM-DD, return as-is; if ISO string, convert
    return date.includes('T') ? toCSTDateString(date) : date;
  }
  // Date object — use CST offset to get correct calendar date
  const d = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
};

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const { patients, appointments, updateAppointment, deleteAppointment, getPatientById } = useData();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Filter appointments based on user role
  const filteredAppointments = appointments.filter(apt => {
    // If patient, only show their appointments
    if (user?.role === 'patient') {
      const patient = patients.find(p => p.name === user.name);
      if (!patient || apt.patientId !== patient.id) return false;
    }

    const matchesSearch =
      apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesDate = !dateFilter || getDateKey(apt.date) === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    const dateCompare = getDateKey(a.date).localeCompare(getDateKey(b.date));
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  const handleStatusChange = (apt: Appointment, newStatus: AppointmentStatus) => {
    updateAppointment(apt.id, { status: newStatus });
    showToast('success', '預約狀態已更新');
  };

  const handleDelete = (apt: Appointment) => {
    if (window.confirm('確定要刪除此預約嗎？')) {
      deleteAppointment(apt.id);
      showToast('success', '預約已刪除');
    }
  };

  const getStatusConfig = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: '待確認' };
      case 'checked-in':
        return { icon: UserCheck, color: 'bg-purple-100 text-purple-700', label: '已報到' };
      case 'completed':
        return { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: '已完成' };
      case 'cancelled':
        return { icon: XCircle, color: 'bg-red-100 text-red-700', label: '已取消' };
    }
  };

  const getTypeConfig = (type: AppointmentType) => {
    switch (type) {
      case 'first':
        return { color: 'bg-purple-100 text-purple-700', label: '初診' };
      case 'followup':
        return { color: 'bg-slate-100 text-slate-700', label: '複診' };
      case 'urgent':
        return { color: 'bg-red-100 text-red-700', label: '緊急' };
    }
  };

  const groupedAppointments = filteredAppointments.reduce((groups, apt) => {
    const date = getDateKey(apt.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(apt);
    return groups;
  }, {} as Record<string, Appointment[]>);

  const todayCount = appointments.filter(a => getDateKey(a.date) === getCSTDateString()).length;
  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">預約管理</h1>
          <p className="text-slate-500 mt-1">
            今日 {todayCount} 個預約 | {pendingCount} 個待確認
          </p>
        </div>
        <Link
          to="/appointments/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增預約
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋病人姓名或備註..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as AppointmentStatus | 'all')}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">所有狀態</option>
            <option value="pending">待確認</option>
            <option value="checked-in">已報到</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      {/* Appointments List by Date */}
      <div className="space-y-6">
        {Object.keys(groupedAppointments).length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">沒有找到預約</h3>
            <p className="text-slate-500">點擊上方按鈕新增預約</p>
          </div>
        ) : (
          Object.entries(groupedAppointments).map(([date, apts]) => {
            const isToday = date === getCSTDateString();
            const isPast = date < getCSTDateString();

            return (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    isToday ? 'bg-blue-600 text-white' : isPast ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {isToday ? '今日' : isPast ? '已過期' : ''} {date}
                  </div>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-sm text-slate-500">{apts.length} 個預約</span>
                </div>

                <div className="space-y-3">
                  {apts.map(apt => {
                    const statusConfig = getStatusConfig(apt.status);
                    const typeConfig = getTypeConfig(apt.type);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={apt.id}
                        className={`bg-white rounded-xl border p-4 transition-all ${
                          apt.status === 'cancelled'
                            ? 'border-slate-200 opacity-60'
                            : apt.status === 'completed'
                            ? 'border-green-200'
                            : apt.type === 'urgent'
                            ? 'border-red-200 bg-red-50/30'
                            : 'border-slate-200 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-lg font-bold text-slate-900">{apt.time}</p>
                            </div>
                            <div className="w-px h-12 bg-slate-200" />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900">{apt.patientName}</h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig.color}`}>
                                  {typeConfig.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                                  {statusConfig.label}
                                </span>
                              </div>
                              {apt.doctorName && (
                                <p className="text-sm text-slate-500">醫生：{apt.doctorName}</p>
                              )}
                              {apt.notes && (
                                <p className="text-sm text-slate-600 mt-1">{apt.notes}</p>
                              )}
                            </div>
                          </div>

                          {user?.role !== 'patient' && (
                            <div className="flex items-center gap-2">
                              {apt.status === 'pending' && (
                                <button
                                  onClick={() => handleStatusChange(apt, 'checked-in')}
                                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  確認並報到
                                </button>
                              )}
                              {apt.status === 'checked-in' && (
                                <button
                                  onClick={() => handleStatusChange(apt, 'completed')}
                                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  完成
                                </button>
                              )}
                              {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                                <button
                                  onClick={() => handleStatusChange(apt, 'cancelled')}
                                  className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  取消
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(apt)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              {apt.patientId && (
                                <Link
                                  to={`/patients/${apt.patientId}`}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Appointments;
