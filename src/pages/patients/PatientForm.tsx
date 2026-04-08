import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

const PatientForm: React.FC = () => {
  const navigate = useNavigate();
  const { addPatient, patients, refreshPatients } = useData();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    patientNumber: '',
    name: '',
    gender: '',
    birthDate: '',
    idCard: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    insuranceType: '',
    insuranceNumber: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const generatePatientNumber = () => {
    const year = new Date().getFullYear();
    const count = patients.length + 1;
    return `P${year}${count.toString().padStart(4, '0')}`;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientNumber.trim()) {
      newErrors.patientNumber = '請輸入病人編號';
    } else {
      const exists = patients.some(p => p.patientNumber === formData.patientNumber);
      if (exists) newErrors.patientNumber = '此編號已被使用';
    }

    if (!formData.name.trim()) {
      newErrors.name = '請輸入姓名';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const patient = await addPatient(formData);
      await refreshPatients();
      showToast('success', `病人「${formData.name}」已成功建立`);
      navigate(`/patients/${patient.id}`);
    } catch (error) {
      showToast('error', '建立病人失敗，請稍後再試');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回病人列表
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">新增病人</h1>
        <p className="text-slate-500 mt-1">建立新的病人檔案</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Fields */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">必填欄位</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                病人編號 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="patientNumber"
                  value={formData.patientNumber}
                  onChange={handleChange}
                  placeholder="P001"
                  className={`flex-1 px-4 py-2.5 border rounded-lg outline-none transition-all ${
                    errors.patientNumber
                      ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, patientNumber: generatePatientNumber() }))}
                  className="px-4 py-2.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  自動產生
                </button>
              </div>
              {errors.patientNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.patientNumber}</p>
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
                placeholder="請輸入姓名"
                className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all ${
                  errors.name
                    ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-2">基本資訊（選填）</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="">請選擇</option>
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="other">其他</option>
              </select>
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                出生日期
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              />
            </div>

            {/* ID Card */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                身份證號
              </label>
              <input
                type="text"
                name="idCard"
                value={formData.idCard}
                onChange={handleChange}
                placeholder="A123456789"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                電話
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0912-345-678"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                電子郵件
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              地址
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="請輸入完整地址"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Emergency Contact */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-2">緊急聯絡人（選填）</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                緊急聯絡人
              </label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="聯絡人姓名"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Emergency Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                緊急聯絡電話
              </label>
              <input
                type="tel"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleChange}
                placeholder="聯絡電話"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Insurance */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-2">保險資訊（選填）</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Insurance Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                保險類型
              </label>
              <select
                name="insuranceType"
                value={formData.insuranceType}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              >
                <option value="">請選擇</option>
                <option value="全民健保">全民健保</option>
                <option value="勞保">勞保</option>
                <option value="農保">農保</option>
                <option value="自費">自費</option>
                <option value="其他">其他</option>
              </select>
            </div>

            {/* Insurance Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                保險號碼
              </label>
              <input
                type="text"
                name="insuranceNumber"
                value={formData.insuranceNumber}
                onChange={handleChange}
                placeholder="保險卡號"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Link
              to="/patients"
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              建立病人檔案
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
