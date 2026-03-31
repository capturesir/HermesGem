import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, FolderOpen, FileText, Image, File, Upload, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Document, DocumentCategory } from '../../types';

const PatientDocuments: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getPatientById, getDocumentsByPatient, getDocumentsByCategory, addDocument, deleteDocument } = useData();
  const { showToast } = useToast();

  const patient = getPatientById(id || '');
  const documents = getDocumentsByPatient(id || '');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'other' as DocumentCategory,
    name: '',
    fileType: 'pdf',
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

  const categories: { value: DocumentCategory | 'all'; label: string; icon: any }[] = [
    { value: 'all', label: '全部', icon: FolderOpen },
    { value: 'lab', label: '檢驗報告', icon: FileText },
    { value: 'imaging', label: '影像資料', icon: Image },
    { value: 'surgery', label: '手術記錄', icon: File },
    { value: 'other', label: '其他文件', icon: FileText },
  ];

  const filteredDocuments = selectedCategory === 'all'
    ? documents
    : getDocumentsByCategory(patient.id, selectedCategory);

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return <FileText className="w-8 h-8 text-red-500" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) return <Image className="w-8 h-8 text-green-500" />;
    return <File className="w-8 h-8 text-slate-500" />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('error', '請填寫文件名稱');
      return;
    }

    addDocument({
      patientId: patient.id,
      category: formData.category,
      name: formData.name,
      fileType: formData.fileType,
      fileUrl: '', // In a real app, this would be the uploaded file URL
      uploadedBy: user?.name || '',
    });

    showToast('success', '文件已新增');
    setShowForm(false);
    setFormData({ category: 'other', name: '', fileType: 'pdf' });
  };

  const handleDelete = (doc: Document) => {
    if (window.confirm('確定要刪除此文件嗎？')) {
      deleteDocument(doc.id);
      showToast('success', '文件已刪除');
    }
  };

  const getCategoryText = (category: DocumentCategory) => {
    switch (category) {
      case 'lab': return '檢驗報告';
      case 'imaging': return '影像資料';
      case 'surgery': return '手術記錄';
      case 'other': return '其他';
    }
  };

  const getCategoryColor = (category: DocumentCategory) => {
    switch (category) {
      case 'lab': return 'bg-purple-100 text-purple-700';
      case 'imaging': return 'bg-blue-100 text-blue-700';
      case 'surgery': return 'bg-red-100 text-red-700';
      case 'other': return 'bg-slate-100 text-slate-700';
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
            <h1 className="text-2xl font-bold text-slate-900">病人文件庫</h1>
            <p className="text-slate-500 mt-1">{patient.name} - {patient.patientNumber}</p>
          </div>
          {user?.role !== 'patient' && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新增文件
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            const count = cat.value === 'all'
              ? documents.length
              : getDocumentsByCategory(patient.id, cat.value).length;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  selectedCategory === cat.value ? 'bg-blue-200' : 'bg-slate-200'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">新增文件</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  文件類別
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as DocumentCategory }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                >
                  <option value="lab">檢驗報告</option>
                  <option value="imaging">影像資料</option>
                  <option value="surgery">手術記錄</option>
                  <option value="other">其他文件</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  文件名稱
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="請輸入文件名稱"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  檔案類型
                </label>
                <select
                  value={formData.fileType}
                  onChange={e => setFormData(prev => ({ ...prev, fileType: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                >
                  <option value="pdf">PDF</option>
                  <option value="jpg">JPG 圖片</option>
                  <option value="png">PNG 圖片</option>
                  <option value="docx">Word 文件</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">
                  拖放檔案到這裡上傳<br />
                  <span className="text-xs">支援 PDF, JPG, PNG, DOCX</span>
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  新增文件
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">暫無文件</h3>
          <p className="text-slate-500">點擊上方按鈕上傳文件</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4">
              <div className="flex-shrink-0">
                {getFileIcon(doc.fileType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(doc.category)}`}>
                    {getCategoryText(doc.category)}
                  </span>
                  <span className="text-xs text-slate-500 uppercase">{doc.fileType}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  上傳者：{doc.uploadedBy} | {new Date(doc.uploadedAt).toLocaleDateString('zh-TW')}
                </p>
              </div>
              {user?.role !== 'patient' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientDocuments;
