import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Heart, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Allergy, AllergyType, AllergySeverity } from '../../types';
import { formatDateCST, formatTimeCST } from '../../lib/dateUtils';

const PatientAllergies: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getPatientById, getAllergiesByPatient, addAllergy, updateAllergy, deleteAllergy } = useData();
  const { showToast } = useToast();

  const patient = getPatientById(id || '');
  const allergies = getAllergiesByPatient(id || '');

  const [showForm, setShowForm] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);
  const [formData, setFormData] = useState({
    allergen: '',
    type: 'drug' as AllergyType,
    severity: 'mild' as AllergySeverity,
    reaction: '',
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

    if (!formData.allergen.trim() || !formData.reaction.trim()) {
      showToast('error', '請填寫過敏原和反應症狀');
      return;
    }

    if (editingAllergy) {
      updateAllergy(editingAllergy.id, formData);
      showToast('success', '過敏記錄已更新');
    } else {
      addAllergy({ ...formData, patientId: patient.id });
      showToast('success', '過敏記錄已新增');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ allergen: '', type: 'drug', severity: 'mild', reaction: '' });
    setShowForm(false);
    setEditingAllergy(null);
  };

  const handleEdit = (allergy: Allergy) => {
    setEditingAllergy(allergy);
    setFormData({
      allergen: allergy.allergen,
      type: allergy.type,
      severity: allergy.severity,
      reaction: allergy.reaction,
    });
    setShowForm(true);
  };

  const handleDelete = (allergy: Allergy) => {
    if (window.confirm('確定要刪除此過敏記錄嗎？')) {
      deleteAllergy(allergy.id);
      showToast('success', '過敏記錄已刪除');
    }
  };

  const getSeverityColor = (severity: AllergySeverity) => {
    switch (severity) {
      case 'life-threatening': return 'bg-red-100 text-red-800 border-red-200';
      case 'severe': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mild': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getSeverityText = (severity: AllergySeverity) => {
    switch (severity) {
      case 'life-threatening': return '致命';
      case 'severe': return '重度';
      case 'moderate': return '中度';
      case 'mild': return '輕度';
    }
  };

  const getTypeText = (type: AllergyType) => {
    switch (type) {
      case 'drug': return '藥物';
      case 'food': return '食物';
      case 'environmental': return '環境';
      case 'other': return '其他';
    }
  };

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
            <h1 className="text-2xl font-bold text-slate-900">過敏記錄</h1>
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
            新增過敏記錄
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingAllergy ? '編輯過敏記錄' : '新增過敏記錄'}
              </h2>
              <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  過敏原名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.allergen}
                  onChange={e => setFormData(prev => ({ ...prev, allergen: e.target.value }))}
                  placeholder="例如：青黴素、蝦子、花粉"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    過敏類型
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as AllergyType }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  >
                    <option value="drug">藥物</option>
                    <option value="food">食物</option>
                    <option value="environmental">環境</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    過敏程度
                  </label>
                  <select
                    value={formData.severity}
                    onChange={e => setFormData(prev => ({ ...prev, severity: e.target.value as AllergySeverity }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  >
                    <option value="mild">輕度</option>
                    <option value="moderate">中度</option>
                    <option value="severe">重度</option>
                    <option value="life-threatening">致命</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  反應症狀 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.reaction}
                  onChange={e => setFormData(prev => ({ ...prev, reaction: e.target.value }))}
                  rows={2}
                  placeholder="描述過敏反應症狀..."
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
                  {editingAllergy ? '儲存變更' : '新增記錄'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allergies List */}
      <div className="space-y-4">
        {allergies.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">暫無過敏記錄</h3>
            <p className="text-slate-500">點擊上方按鈕新增過敏記錄</p>
          </div>
        ) : (
          allergies.map(allergy => (
            <div key={allergy.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    allergy.severity === 'life-threatening' || allergy.severity === 'severe'
                      ? 'bg-red-100 text-red-600'
                      : allergy.severity === 'moderate'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-slate-900">{allergy.allergen}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        {getTypeText(allergy.type)}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-2">{allergy.reaction}</p>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(allergy.severity)}`}>
                        {getSeverityText(allergy.severity)}
                      </span>
                      <span className="text-sm text-slate-500">
                        記錄時間：{formatDateCST(allergy.recordedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(allergy)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(allergy)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientAllergies;
