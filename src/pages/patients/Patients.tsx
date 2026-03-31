import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, ChevronRight, AlertTriangle, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

const Patients: React.FC = () => {
  const { user } = useAuth();
  const { patients, getAlertsByPatient } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');

  const filteredPatients = patients.filter(patient => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm);
    const matchesGender = genderFilter === 'all' || patient.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return '-';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {user?.role === 'patient' ? '我的病歷' : '病人列表'}
          </h1>
          <p className="text-slate-500 mt-1">
            {user?.role === 'patient' ? '查看您的醫療記錄' : `共 ${patients.length} 位病人`}
          </p>
        </div>
        {user?.role !== 'patient' && (
          <Link
            to="/patients/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增病人
          </Link>
        )}
      </div>

      {/* Filters */}
      {user?.role !== 'patient' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜尋姓名、編號或電話..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <select
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">所有性別</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        </div>
      )}

      {/* Patient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map(patient => {
          const alerts = getAlertsByPatient(patient.id);
          const activeAlerts = alerts.filter(a => a.isActive);
          const hasHighAlert = activeAlerts.some(a => a.level === 'high');

          return (
            <Link
              key={patient.id}
              to={`/patients/${patient.id}`}
              className={`bg-white rounded-xl border p-5 hover:shadow-md hover:border-blue-200 transition-all group ${
                hasHighAlert ? 'border-red-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                    patient.gender === 'male' ? 'bg-blue-500' : patient.gender === 'female' ? 'bg-pink-500' : 'bg-slate-500'
                  }`}>
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                    <p className="text-sm text-slate-500">{patient.patientNumber}</p>
                  </div>
                </div>
                {hasHighAlert && (
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">年齡</span>
                  <span className="text-slate-900">{calculateAge(patient.birthDate)} 歲</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">性別</span>
                  <span className="text-slate-900">
                    {patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '-'}
                  </span>
                </div>
                {patient.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">電話</span>
                    <span className="text-slate-900">{patient.phone}</span>
                  </div>
                )}
              </div>

              {activeAlerts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2">
                    {activeAlerts.slice(0, 2).map(alert => (
                      <span
                        key={alert.id}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          alert.level === 'high'
                            ? 'bg-red-100 text-red-700'
                            : alert.level === 'medium'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {alert.type === 'allergy' ? '過敏' : alert.type === 'disease' ? '疾病' : '警示'}
                      </span>
                    ))}
                    {activeAlerts.length > 2 && (
                      <span className="px-2 py-1 text-xs text-slate-500">
                        +{activeAlerts.length - 2} 更多
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-end text-blue-600 group-hover:text-blue-700">
                <span className="text-sm font-medium">查看詳情</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {filteredPatients.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Stethoscope className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">找不到病人</h3>
          <p className="text-slate-500 mb-4">
            {searchTerm ? '請嘗試其他搜尋關鍵字' : '點擊下方按鈕新增第一位病人'}
          </p>
          {user?.role !== 'patient' && (
            <Link
              to="/patients/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新增病人
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Patients;
