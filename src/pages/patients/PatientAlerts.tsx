import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, AlertTriangle, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { toCamelCase } from '../../lib/apiUtils';
import { Alert, AlertLevel, AlertType } from '../../types';
import { formatDateCST, formatTimeCST } from '../../lib/dateUtils';

const PatientAlerts: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getPatientById, addAlert, updateAlert, deleteAlert } = useData();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const patient = getPatientById(id || '');

  const loadAlerts = useCallback(async (patientId: string) => {
    try {
      const data = await api.getAlerts(patientId);
      setAlerts(toCamelCase<Alert[]>(data as Alert[]));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { if (id) loadAlerts(id); }, [id, loadAlerts]);

  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [formData, setFormData] = useState({
    level: 'medium' as AlertLevel,
    type: 'other' as AlertType,
    content: '',
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

    if (!formData.content.trim()) {
      showToast('error', '請填寫警示內容');
      return;
    }

    if (editingAlert) {
      updateAlert(editingAlert.id, formData);
      showToast('success', '警示已更新');
    } else {
      addAlert({ ...formData, patientId: patient.id });
      showToast('success', '警示已新增');
    }

    setFormData({ level: 'medium', type: 'other', content: '' });
    setShowForm(false);
    setEditingAlert(null);
  };

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setFormData({
      level: alert.level,
      type: alert.type,
      content: alert.content,
    });
    setShowForm(true);
  };

  const handleDelete = (alert: Alert) => {
    if (window.confirm('確定要刪除此警示嗎？')) {
      deleteAlert(alert.id);
      showToast('success', '警示已刪除');
    }
  };

  const handleToggleActive = (alert: Alert) => {
    updateAlert(alert.id, { isActive: !alert.isActive });
    showToast('success', alert.isActive ? '警示已停用' : '警示已啟用');
  };

  const getLevelColor = (level: AlertLevel) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getLevelText = (level: AlertLevel) => {
    switch (level) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
    }
  };

  const getTypeText = (type: AlertType) => {
    switch (type) {
      case 'allergy': return '過敏';
      case 'disease': return '疾病';
      case 'drug': return '藥物';
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
            <h1 className="text-2xl font-bold text-slate-900">特別警示</h1>
            <p className="text-slate-500 mt-1">{patient.name} - {patient.patientNumber}</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingAlert(null);
              setFormData({ level: 'medium', type: 'other', content: '' });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增警示
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingAlert ? '編輯警示' : '新增警示'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingAlert(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    警示等級
                  </label>
                  <select
                    value={formData.level}
                    onChange={e => setFormData(prev => ({ ...prev, level: e.target.value as AlertLevel }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  >
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    警示類型
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as AlertType }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  >
                    <option value="allergy">過敏</option>
                    <option value="disease">疾病</option>
                    <option value="drug">藥物</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  警示內容
                </label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={3}
                  placeholder="請描述警示內容..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAlert(null);
                  }}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingAlert ? '儲存變更' : '新增警示'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">暫無警示</h3>
            <p className="text-slate-500">點擊上方按鈕新增特別警示</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl border p-5 ${
                alert.isActive
                  ? alert.level === 'high'
                    ? 'border-red-300'
                    : alert.level === 'medium'
                    ? 'border-orange-300'
                    : 'border-yellow-300'
                  : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    alert.level === 'high'
                      ? 'bg-red-100 text-red-600'
                      : alert.level === 'medium'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(alert.level)}`}>
                        {getLevelText(alert.level)}風險
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        {getTypeText(alert.type)}
                      </span>
                      {!alert.isActive && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-500">
                          已停用
                        </span>
                      )}
                    </div>
                    <p className="text-slate-900">{alert.content}</p>
                    <p className="text-sm text-slate-500 mt-2">
                      建立時間：{formatDateCST(alert.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(alert)}
                    className={`p-2 rounded-lg transition-colors ${
                      alert.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-slate-400 hover:bg-slate-50'
                    }`}
                    title={alert.isActive ? '停用警示' : '啟用警示'}
                  >
                    {alert.isActive ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(alert)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(alert)}
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

export default PatientAlerts;
