import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Activity, X, Thermometer, Droplets, Wind, Heart, Scale, Ruler } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { VitalSign } from '../../types';

const PatientVitals: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getPatientById, getVitalSignsByPatient, addVitalSign, updateVitalSign, deleteVitalSign } = useData();
  const { showToast } = useToast();

  const patient = getPatientById(id || '');
  const vitalSigns = getVitalSignsByPatient(id || '');

  const [showForm, setShowForm] = useState(false);
  const [editingVitals, setEditingVitals] = useState<VitalSign | null>(null);
  const [formData, setFormData] = useState({
    temperature: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    notes: '',
  });

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900">找不到此病人</h2>
        <Link to="/patients" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          返回病人列表
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      bloodPressureSystolic: formData.bloodPressureSystolic ? parseInt(formData.bloodPressureSystolic) : undefined,
      bloodPressureDiastolic: formData.bloodPressureDiastolic ? parseInt(formData.bloodPressureDiastolic) : undefined,
      heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
      respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined,
      oxygenSaturation: formData.oxygenSaturation ? parseInt(formData.oxygenSaturation) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      notes: formData.notes || undefined,
    };

    if (editingVitals) {
      updateVitalSign(editingVitals.id, data);
      showToast('success', '記錄已更新');
    } else {
      addVitalSign({
        ...data,
        patientId: patient.id,
        recordedBy: user?.name || '',
      });
      showToast('success', '記錄已新增');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      temperature: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
      notes: '',
    });
    setShowForm(false);
    setEditingVitals(null);
  };

  const handleEdit = (vitals: VitalSign) => {
    setEditingVitals(vitals);
    setFormData({
      temperature: vitals.temperature?.toString() || '',
      bloodPressureSystolic: vitals.bloodPressureSystolic?.toString() || '',
      bloodPressureDiastolic: vitals.bloodPressureDiastolic?.toString() || '',
      heartRate: vitals.heartRate?.toString() || '',
      respiratoryRate: vitals.respiratoryRate?.toString() || '',
      oxygenSaturation: vitals.oxygenSaturation?.toString() || '',
      weight: vitals.weight?.toString() || '',
      height: vitals.height?.toString() || '',
      notes: vitals.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = (vitals: VitalSign) => {
    if (window.confirm('確定要刪除此記錄嗎？')) {
      deleteVitalSign(vitals.id);
      showToast('success', '記錄已刪除');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const VitalCard = ({ icon: Icon, label, value, unit, color }: any) => (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-semibold text-slate-900">
          {value !== undefined && value !== null ? `${value} ${unit}` : '-'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/patients/${patient.id}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回病人資料
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">生命體徵</h1>
            <p className="text-slate-500 mt-1">{patient.name} - {patient.patientNumber}</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增記錄
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingVitals ? '編輯記錄' : '新增生命體徵'}
              </h2>
              <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    體溫 (℃)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    placeholder="36.5"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    血壓 (mmHg)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="bloodPressureSystolic"
                      value={formData.bloodPressureSystolic}
                      onChange={handleChange}
                      placeholder="收縮壓"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                    />
                    <span className="self-center text-slate-400">/</span>
                    <input
                      type="number"
                      name="bloodPressureDiastolic"
                      value={formData.bloodPressureDiastolic}
                      onChange={handleChange}
                      placeholder="舒張壓"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    心率 (bpm)
                  </label>
                  <input
                    type="number"
                    name="heartRate"
                    value={formData.heartRate}
                    onChange={handleChange}
                    placeholder="72"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    呼吸率 (次/分)
                  </label>
                  <input
                    type="number"
                    name="respiratoryRate"
                    value={formData.respiratoryRate}
                    onChange={handleChange}
                    placeholder="16"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    血氧 (%)
                  </label>
                  <input
                    type="number"
                    name="oxygenSaturation"
                    value={formData.oxygenSaturation}
                    onChange={handleChange}
                    placeholder="98"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    體重 (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="70"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  身高 (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="170"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  備註
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="額外說明..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingVitals ? '儲存變更' : '新增記錄'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Records List */}
      <div className="space-y-4">
        {vitalSigns.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Activity className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">暫無記錄</h3>
            <p className="text-slate-500">點擊上方按鈕新增生命體徵記錄</p>
          </div>
        ) : (
          vitalSigns.map(vitals => (
            <div key={vitals.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-500">
                    {new Date(vitals.recordedAt).toLocaleDateString('zh-TW')} {new Date(vitals.recordedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">記錄者：{vitals.recordedBy}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(vitals)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(vitals)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <VitalCard
                  icon={Thermometer}
                  label="體溫"
                  value={vitals.temperature}
                  unit="℃"
                  color="bg-orange-100 text-orange-600"
                />
                <VitalCard
                  icon={Droplets}
                  label="血壓"
                  value={vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic
                    ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}`
                    : undefined}
                  unit="mmHg"
                  color="bg-red-100 text-red-600"
                />
                <VitalCard
                  icon={Heart}
                  label="心率"
                  value={vitals.heartRate}
                  unit="bpm"
                  color="bg-pink-100 text-pink-600"
                />
                <VitalCard
                  icon={Wind}
                  label="呼吸率"
                  value={vitals.respiratoryRate}
                  unit="次/分"
                  color="bg-blue-100 text-blue-600"
                />
                <VitalCard
                  icon={Droplets}
                  label="血氧"
                  value={vitals.oxygenSaturation}
                  unit="%"
                  color="bg-cyan-100 text-cyan-600"
                />
                <VitalCard
                  icon={Scale}
                  label="體重"
                  value={vitals.weight}
                  unit="kg"
                  color="bg-green-100 text-green-600"
                />
                <VitalCard
                  icon={Ruler}
                  label="身高"
                  value={vitals.height}
                  unit="cm"
                  color="bg-purple-100 text-purple-600"
                />
              </div>

              {vitals.notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">備註：</span>{vitals.notes}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientVitals;
