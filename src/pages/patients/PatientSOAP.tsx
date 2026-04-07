import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Stethoscope, X, User } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { toCamelCase } from '../../lib/apiUtils';
import { SOAPNote } from '../../types';
import { getCSTDateString } from '../../lib/dateUtils';

const PatientSOAP: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getPatientById, addSOAPNote, updateSOAPNote, deleteSOAPNote } = useData();
  const { showToast } = useToast();

  const [soapNotes, setSoapNotes] = useState<SOAPNote[]>([]);
  const patient = getPatientById(id || '');

  const loadSOAPNotes = useCallback(async (patientId: string) => {
    try {
      const data = await api.getSOAPNotes(patientId);
      setSoapNotes(toCamelCase<SOAPNote[]>(data as SOAPNote[]));
    } catch (e) {
      console.error('Failed to load SOAP notes:', e);
    }
  }, []);

  useEffect(() => {
    if (id) loadSOAPNotes(id);
  }, [id, loadSOAPNotes]);

  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<SOAPNote | null>(null);
  const [formData, setFormData] = useState({
    visitDate: getCSTDateString(),
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
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

    if (!formData.subjective.trim() || !formData.assessment.trim()) {
      showToast('error', '請填寫主觀症狀和評估');
      return;
    }

    if (editingNote) {
      updateSOAPNote(editingNote.id, formData);
      showToast('success', '就診記錄已更新');
    } else {
      addSOAPNote({
        ...formData,
        patientId: patient.id,
        doctorId: user?.id || '',
        doctorName: user?.name || '',
      });
      showToast('success', '就診記錄已新增');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      visitDate: getCSTDateString(),
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      notes: '',
    });
    setShowForm(false);
    setEditingNote(null);
  };

  const handleEdit = (note: SOAPNote) => {
    setEditingNote(note);
    setFormData({
      visitDate: note.visitDate,
      subjective: note.subjective,
      objective: note.objective,
      assessment: note.assessment,
      plan: note.plan,
      notes: note.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = (note: SOAPNote) => {
    if (window.confirm('確定要刪除此就診記錄嗎？')) {
      deleteSOAPNote(note.id);
      showToast('success', '就診記錄已刪除');
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
            <h1 className="text-2xl font-bold text-slate-900">SOAP 就診記錄</h1>
            <p className="text-slate-500 mt-1">{patient.name} - {patient.patientNumber}</p>
          </div>
          {user?.role !== 'patient' && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新增就診記錄
            </button>
          )}
        </div>
      </div>

      {/* SOAP Explanation */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">SOAP 格式說明</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-800">
          <div><span className="font-semibold">S</span> - 主觀症狀（病人主訴）</div>
          <div><span className="font-semibold">O</span> - 客觀發現（檢查結果）</div>
          <div><span className="font-semibold">A</span> - 評估（診斷意見）</div>
          <div><span className="font-semibold">P</span> - 處置計劃（治療方案）</div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingNote ? '編輯就診記錄' : '新增就診記錄'}
              </h2>
              <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  就診日期
                </label>
                <input
                  type="date"
                  value={formData.visitDate}
                  onChange={e => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  S - 主觀症狀 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.subjective}
                  onChange={e => setFormData(prev => ({ ...prev, subjective: e.target.value }))}
                  rows={3}
                  placeholder="病人描述的症狀、不適、感受..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  O - 客觀發現
                </label>
                <textarea
                  value={formData.objective}
                  onChange={e => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                  rows={3}
                  placeholder="醫生檢查結果、測量數據..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  A - 評估 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.assessment}
                  onChange={e => setFormData(prev => ({ ...prev, assessment: e.target.value }))}
                  rows={3}
                  placeholder="診斷意見、病情評估..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  P - 處置計劃
                </label>
                <textarea
                  value={formData.plan}
                  onChange={e => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                  rows={3}
                  placeholder="治療方案、用藥建議..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  備註
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
                  {editingNote ? '儲存變更' : '新增記錄'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {soapNotes.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Stethoscope className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">暫無就診記錄</h3>
            <p className="text-slate-500">點擊上方按鈕新增就診記錄</p>
          </div>
        ) : (
          soapNotes.map(note => (
            <div key={note.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{note.visitDate}</p>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {note.doctorName}
                  </p>
                </div>
                {user?.role !== 'patient' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(note)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <h4 className="font-semibold text-yellow-900 mb-2">S - 主觀症狀</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{note.subjective}</p>
                </div>

                {note.objective && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-2">O - 客觀發現</h4>
                    <p className="text-slate-700 whitespace-pre-wrap">{note.objective}</p>
                  </div>
                )}

                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <h4 className="font-semibold text-green-900 mb-2">A - 評估</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{note.assessment}</p>
                </div>

                {note.plan && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <h4 className="font-semibold text-purple-900 mb-2">P - 處置計劃</h4>
                    <p className="text-slate-700 whitespace-pre-wrap">{note.plan}</p>
                  </div>
                )}

                {note.notes && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">備註：</span>{note.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientSOAP;
