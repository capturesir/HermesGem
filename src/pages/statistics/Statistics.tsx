import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, Users, UserCheck, TrendingUp, Activity, Download } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { getCSTDateString } from '../../lib/dateUtils';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Statistics() {
  const { patients, appointments } = useData();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: getCSTDateString().slice(0, 7) + '-01',
    endDate: getCSTDateString()
  });
  const [selectedPatient, setSelectedPatient] = useState<string>('');

  // Calculate statistics
  const todayAppointments = appointments.filter(a => a.date === getCSTDateString());
  const completedToday = todayAppointments.filter(a => a.status === 'completed').length;
  const waitingCount = todayAppointments.filter(a => a.status === 'checked-in').length;

  // Filter appointments by date range
  const filteredAppointments = appointments.filter(a => {
    const appointmentDate = new Date(a.date);
    return appointmentDate >= new Date(dateRange.startDate) && appointmentDate <= new Date(dateRange.endDate);
  });

  // Calculate stats by status
  const statusStats = [
    { name: '已預約', value: filteredAppointments.filter(a => a.status === 'pending').length },
    { name: '已報到', value: filteredAppointments.filter(a => a.status === 'checked-in').length },
    { name: '已完成', value: filteredAppointments.filter(a => a.status === 'completed').length },
    { name: '已取消', value: filteredAppointments.filter(a => a.status === 'cancelled').length },
  ];

  // Patient consultation stats
  const patientConsultations = filteredAppointments.filter(a => a.status === 'completed').length;

  // Monthly appointment trends (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthAppointments = appointments.filter(a => {
      const aDate = new Date(a.date);
      return aDate.getMonth() === month && aDate.getFullYear() === year;
    });
    monthlyData.push({
      month: `${year}/${month + 1}`,
      total: monthAppointments.length,
      completed: monthAppointments.filter(a => a.status === 'completed').length
    });
  }

  // Patient filter
  const filteredPatientConsultations = selectedPatient
    ? filteredAppointments.filter(a => a.patientId === selectedPatient && a.status === 'completed')
    : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">數據統計</h1>
          <p className="text-gray-500 mt-1">查看機構運營數據與分析</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">今日預約</p>
                <p className="text-3xl font-bold text-gray-900">{todayAppointments.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">已完成</p>
                <p className="text-3xl font-bold text-green-600">{completedToday}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">候診人數</p>
                <p className="text-3xl font-bold text-orange-600">{waitingCount}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">總病人数</p>
                <p className="text-3xl font-bold text-purple-600">{patients.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>篩選條件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">開始日期</label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">結束日期</label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">選擇病人</label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="全部病人" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部病人</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.patientNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>每月預約趨勢</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="總預約" fill="#2563EB" />
                  <Bar dataKey="completed" name="已完成" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>預約狀態分佈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Consultation Details */}
      {selectedPatient && (
        <Card>
          <CardHeader>
            <CardTitle>
              {patients.find(p => p.id === selectedPatient)?.name} 的就診記錄
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">{filteredPatientConsultations.length}</p>
                  <p className="text-sm text-gray-500">指定期間內就診次數</p>
                </div>
              </div>
              {filteredPatientConsultations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">日期</th>
                        <th className="text-left py-3 px-4">時間</th>
                        <th className="text-left py-3 px-4">醫生</th>
                        <th className="text-left py-3 px-4">類型</th>
                        <th className="text-left py-3 px-4">備註</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatientConsultations.map((apt) => (
                        <tr key={apt.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{apt.date}</td>
                          <td className="py-3 px-4">{apt.time || '-'}</td>
                          <td className="py-3 px-4">{apt.doctorName || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              apt.type === 'first' ? 'bg-blue-100 text-blue-800' :
                              apt.type === 'followup' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {apt.type === 'first' ? '初診' : apt.type === 'followup' ? '複診' : '急診'}
                            </span>
                          </td>
                          <td className="py-3 px-4">{apt.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">暫無就診記錄</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ICD-10 Disease Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>ICD-10 疾病分類統計</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            請連接後端 API 查看詳細的疾病分類統計數據
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
