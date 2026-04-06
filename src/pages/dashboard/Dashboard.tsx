import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Stethoscope, Calendar, Activity, AlertTriangle,
  Clock, ArrowRight, TrendingUp, FileText, Pill
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getCSTDateString } from '../../lib/dateUtils';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { patients, appointments, alerts, vitalSigns, soapNotes, prescriptions } = useData();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早安';
    if (hour < 18) return '午安';
    return '晚安';
  };

  const todayAppointments = appointments.filter(a => a.date === getCSTDateString());
  const activeAlerts = alerts.filter(a => a.isActive);
  const todayCompleted = todayAppointments.filter(a => a.status === 'completed').length;

  const stats = [
    {
      name: '病人總數',
      value: patients.length,
      icon: Stethoscope,
      color: 'bg-blue-500',
      href: '/patients',
      role: ['admin', 'doctor', 'nurse', 'staff'],
    },
    {
      name: '今日預約',
      value: todayAppointments.length,
      icon: Calendar,
      color: 'bg-green-500',
      href: '/appointments',
      role: ['admin', 'doctor', 'nurse', 'staff', 'patient'],
    },
    {
      name: '活躍警示',
      value: activeAlerts.length,
      icon: AlertTriangle,
      color: 'bg-red-500',
      href: '/patients',
      role: ['admin', 'doctor', 'nurse'],
    },
    {
      name: '體徵記錄',
      value: vitalSigns.length,
      icon: Activity,
      color: 'bg-purple-500',
      href: '/patients',
      role: ['admin', 'doctor', 'nurse'],
    },
  ];

  const patientAppointments = user?.role === 'patient'
    ? appointments.filter(a => {
        const patient = patients.find(p => p.name === user.name);
        return patient && a.patientId === patient.id;
      })
    : todayAppointments;

  const recentNotes = soapNotes.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {getGreeting()}，{user?.name}
        </h1>
        <p className="text-slate-500 mt-1">
          歡迎回到電子病歷系統
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => {
          if (stat.role && !stat.role.includes(user?.role || '')) return null;
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                查看詳情
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-slate-900">今日預約</h2>
            </div>
            <div className="text-sm text-slate-500">
              {todayCompleted} / {todayAppointments.length} 完成
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {patientAppointments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>今日沒有預約</p>
              </div>
            ) : (
              patientAppointments.slice(0, 5).map(apt => (
                <div key={apt.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {apt.patientName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{apt.patientName}</p>
                        <p className="text-sm text-slate-500">{apt.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          apt.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : apt.status === 'checked-in'
                            ? 'bg-blue-100 text-blue-700'
                            : apt.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {apt.status === 'completed' ? '已完成'
                          : apt.status === 'checked-in' ? '已報到'
                          : apt.status === 'cancelled' ? '已取消'
                          : '待確認'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          apt.type === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : apt.type === 'first'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {apt.type === 'urgent' ? '緊急'
                          : apt.type === 'first' ? '初診'
                          : '複診'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {(user?.role !== 'patient') && (
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50">
              <Link to="/appointments" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1">
                查看所有預約
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Recent SOAP Notes */}
        {user?.role !== 'patient' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-slate-900">最近就診記錄</h2>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {recentNotes.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>暫無就診記錄</p>
                </div>
              ) : (
                recentNotes.map(note => {
                  const patient = patients.find(p => p.id === note.patientId);
                  return (
                    <div key={note.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{patient?.name || '未知病人'}</p>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{note.assessment}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">{note.visitDate}</p>
                          <p className="text-xs text-slate-400 mt-1">{note.doctorName}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50">
              <Link to="/patients" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1">
                查看所有病人
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Patient's own data */}
        {user?.role === 'patient' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-slate-900">最近生命體徵</h2>
              </div>
            </div>
            <div className="p-4">
              {vitalSigns.filter(v => {
                const patient = patients.find(p => p.name === user.name);
                return patient && v.patientId === patient.id;
              }).length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>暫無體徵記錄</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {vitalSigns
                    .filter(v => {
                      const patient = patients.find(p => p.name === user.name);
                      return patient && v.patientId === patient.id;
                    })
                    .slice(0, 4)
                    .map(v => (
                      <div key={v.id} className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">{v.recordedAt.split('T')[0]}</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {v.bloodPressureSystolic}/{v.bloodPressureDiastolic}
                        </p>
                        <p className="text-xs text-slate-500">血壓 (mmHg)</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">快速操作</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {user?.role !== 'patient' && (
              <>
                <Link
                  to="/patients/new"
                  className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Users className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">新增病人</span>
                </Link>
                <Link
                  to="/appointments/new"
                  className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Calendar className="w-6 h-6 text-green-600" />
                  <span className="text-sm font-medium text-green-700">新增預約</span>
                </Link>
              </>
            )}
            <Link
              to="/profile"
              className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Users className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">個人設定</span>
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/users"
                className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <Users className="w-6 h-6 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">用戶管理</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
