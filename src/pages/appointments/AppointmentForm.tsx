import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Search, Calendar as CalendarIcon } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { AppointmentType } from '../../types';
import { getCSTDateString } from '../../lib/dateUtils';

const AppointmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { patients, getPatientById, getPatientByNumber, addAppointment, refreshAppointments } = useData();
  const { showToast } = useToast();

  // 直接從 API 抓醫生列表，不再依賴 AuthContext（避免空閒後 users 為空的問題）
  const [doctors, setDoctors] = useState<any[]>([]);
  useEffect(() => {
    api.getUsers().then((data: any) => {
      if (Array.isArray(data)) {
        setDoctors(data.filter((u: any) => u.role === 'doctor'));
      }
    }).catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    patientNumber: '',
    patientId: '',
    patientName: '',
    date: getCSTDateString(),
    time: '09:00',
    doctorId: '',
    doctorName: '',
    type: 'followup' as AppointmentType,
    notes: '',
  });

  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredPatients = patients.filter(p =>
    p.name.includes(patientSearch) ||
    p.patientNumber.includes(patientSearch)
  ).slice(0, 5);

  const handlePatientSelect = (patient: typeof patients[0]) => {
    setFormData(prev => ({
      ...prev,
      patientNumber: patient.patientNumber,
      patientId: patient.id,
      patientName: patient.name,
    }));
    setPatientSearch('');
    setShowPatientDropdown(false);
    if (errors.patientNumber) {
      setErrors(prev => ({ ...prev, patientNumber: '' }));
    }
  };

  const handlePatientNumberBlur = () => {
    if (formData.patientNumber) {
      const patient = getPatientByNumber(formData.patientNumber);
      if (patient) {
        setFormData(prev => ({
          ...prev,
          patientId: patient.id,
          patientName: patient.name,
        }));
      }
    }
  };

  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors.find(u => u.id === doctorId);
    setFormData(prev => ({
      ...prev,
      doctorId,
      doctorName: doctor?.name || '',
    }));
  };

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

    if (!formData.patientNumber.trim()) {
      newErrors.patientNumber = '請輸入或選擇病人';
    }

    if (!formData.date) {
      newErrors.date = '請選擇診症日期';
    }

    if (!formData.time) {
      newErrors.time = '請選擇診症時段';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await addAppointment({
        ...formData,
        patientId: formData.patientId,
        patientName: formData.patientName,
      });
      await refreshAppointments();
      showToast('success', '預約已成功建立');
      navigate('/appointments');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '新增預約失敗，請稍後再試';
      showToast('error', message);
    }
  };

  // Generate time slots
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/appointments"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回預約列表
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">新增預約</h1>
        <p className="text-slate-500 mt-1">建立新的預約記錄</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              病人 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={patientSearch || formData.patientName || ''}
                  onChange={e => {
                    setPatientSearch(e.target.value);
                    setShowPatientDropdown(true);
                    setFormData(prev => ({ ...prev, patientName: '' }));
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  placeholder="搜尋病人姓名或編號..."
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none transition-all ${
                    errors.patientNumber
                      ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
              </div>

              {/* Patient Dropdown */}
              {showPatientDropdown && filteredPatients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredPatients.map(patient => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handlePatientSelect(patient)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{patient.name}</p>
                        <p className="text-sm text-slate-500">{patient.patientNumber}</p>
                      </div>
                      {patient.phone && (
                        <p className="text-sm text-slate-400">{patient.phone}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {formData.patientName && (
              <div className="mt-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900">{formData.patientName}</p>
                  <p className="text-sm text-green-700">編號：{formData.patientNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, patientId: '', patientName: '', patientNumber: '' }))}
                  className="text-green-600 hover:text-green-800"
                >
                  清除
                </button>
              </div>
            )}

            {errors.patientNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.patientNumber}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                診症日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={getCSTDateString()}
                className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all ${
                  errors.date
                    ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                診症時段 <span className="text-red-500">*</span>
              </label>
              <select
                name="time"
                value={formData.time}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all ${
                  errors.time
                    ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                }`}
              >
                <option value="">請選擇時段</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time}</p>
              )}
            </div>
          </div>

          {/* Doctor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              主治醫生
            </label>
            <select
              name="doctorId"
              value={formData.doctorId}
              onChange={e => handleDoctorChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            >
              <option value="">不指定</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
              ))}
            </select>
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              預約類型
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'first', label: '初診', desc: '首次就診' },
                { value: 'followup', label: '複診', desc: '定期回診' },
                { value: 'urgent', label: '緊急', desc: '急需就診' },
              ].map(type => (
                <label
                  key={type.value}
                  className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div>
                    <p className={`font-medium ${
                      formData.type === type.value ? 'text-blue-900' : 'text-slate-900'
                    }`}>{type.label}</p>
                    <p className={`text-xs ${
                      formData.type === type.value ? 'text-blue-700' : 'text-slate-500'
                    }`}>{type.desc}</p>
                  </div>
                  {formData.type === type.value && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              備註
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="預約相關說明或注意事項..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Link
              to="/appointments"
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              建立預約
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
