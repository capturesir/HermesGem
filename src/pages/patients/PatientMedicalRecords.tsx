import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit, Trash2, Stethoscope, Pill, X, User,
  Calendar, Search, Filter, Activity, FileText, CheckCircle2,
  ChevronDown, ChevronRight, Save, RotateCcw
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SOAPNote, Prescription, PrescriptionStatus, Medication, MedicationRoute } from '../../types';

interface RecordItem {
  id: string;
  type: 'soap' | 'prescription';
  date: string;
  doctorName: string;
  data: SOAPNote | Prescription;
}

const PatientMedicalRecords: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getPatientById, getSOAPNotesByPatient, getPrescriptionsByPatient, addSOAPNote, updateSOAPNote, deleteSOAPNote, addPrescription, updatePrescription, deletePrescription } = useData();
  const { showToast } = useToast();

  const patient = getPatientById(id || '');
  const soapNotes = getSOAPNotesByPatient(id || '');
  const prescriptions = getPrescriptionsByPatient(id || '');

  const [activeTab, setActiveTab] = useState<'all' | 'soap' | 'prescription'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | '90days' | 'year'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  // Integrated Form State - Combine SOAP + Prescription
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<'soap' | 'prescription' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // SOAP + Prescription Combined Form
  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    // SOAP fields
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    notes: '',
    // Prescription fields
    medications: [{ name: '', dosage: '', frequency: '', route: 'oral' as MedicationRoute, duration: 7 }] as Medication[],
    prescriptionStatus: 'active' as PrescriptionStatus,
  });

  // Auto-expand most recent records
  const topRecordsRef = useRef<HTMLDivElement>(null);
  const [autoExpanded, setAutoExpanded] = useState(false);

  // Combine and sort records
  const allRecords: RecordItem[] = useMemo(() => {
    const soapItems: RecordItem[] = soapNotes.map(note => ({
      id: `soap-${note.id}`,
      type: 'soap' as const,
      date: note.visitDate,
      doctorName: note.doctorName,
      data: note,
    }));
    const prescriptionItems: RecordItem[] = prescriptions.map(pres => ({
      id: `pres-${pres.id}`,
      type: 'prescription' as const,
      date: pres.date,
      doctorName: pres.doctorName,
      data: pres,
    }));
    return [...soapItems, ...prescriptionItems].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [soapNotes, prescriptions]);

  // Auto-expand first 3 records on mount
  useEffect(() => {
    if (!autoExpanded && allRecords.length > 0) {
      const firstThree = allRecords.slice(0, 3).map(r => r.id);
      setExpandedRecords(new Set(firstThree));
      setAutoExpanded(true);
    }
  }, [allRecords, autoExpanded]);

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

  // Filter records
  const filteredRecords = useMemo(() => {
    let filtered = allRecords;
    if (activeTab === 'soap') filtered = filtered.filter(r => r.type === 'soap');
    else if (activeTab === 'prescription') filtered = filtered.filter(r => r.type === 'prescription');

    if (dateFilter !== 'all') {
      const now = new Date();
      const daysMap = { '30days': 30, '90days': 90, 'year': 365 };
      const days = daysMap[dateFilter as keyof typeof daysMap];
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => new Date(r.date) >= cutoffDate);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        if (r.type === 'soap') {
          const soap = r.data as SOAPNote;
          return (
            soap.subjective.toLowerCase().includes(query) ||
            soap.assessment.toLowerCase().includes(query) ||
            soap.plan.toLowerCase().includes(query)
          );
        } else {
          const pres = r.data as Prescription;
          return pres.medications.some(m => m.name.toLowerCase().includes(query));
        }
      });
    }
    return filtered;
  }, [allRecords, activeTab, dateFilter, searchQuery]);

  const toggleExpand = (recordId: string) => {
    setExpandedRecords(prev => {
      const next = new Set(prev);
      if (next.has(recordId)) next.delete(recordId);
      else next.add(recordId);
      return next;
    });
  };

  // Form handlers
  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', route: 'oral', duration: 7 }],
    }));
  };

  const removeMedication = (index: number) => {
    if (formData.medications.length > 1) {
      setFormData(prev => ({
        ...prev,
        medications: prev.medications.filter((_, i) => i !== index),
      }));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) =>
        i === index ? { ...med, [field]: value } : med
      ),
    }));
  };

  const openNewForm = (type: 'soap' | 'prescription') => {
    setEditingType(type);
    setEditingId(null);
    setFormData({
      visitDate: new Date().toISOString().split('T')[0],
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      notes: '',
      medications: [{ name: '', dosage: '', frequency: '', route: 'oral', duration: 7 }],
      prescriptionStatus: 'active',
    });
    setShowForm(true);
  };

  const openEditForm = (record: RecordItem) => {
    if (record.type === 'soap') {
      const soap = record.data as SOAPNote;
      setEditingType('soap');
      setEditingId(soap.id);
      setFormData({
        visitDate: soap.visitDate,
        subjective: soap.subjective,
        objective: soap.objective,
        assessment: soap.assessment,
        plan: soap.plan,
        notes: soap.notes || '',
        medications: [{ name: '', dosage: '', frequency: '', route: 'oral', duration: 7 }],
        prescriptionStatus: 'active',
      });
    } else {
      const pres = record.data as Prescription;
      setEditingType('prescription');
      setEditingId(pres.id);
      setFormData({
        visitDate: pres.date,
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        notes: pres.notes || '',
        medications: pres.medications.length > 0 ? pres.medications : [{ name: '', dosage: '', frequency: '', route: 'oral', duration: 7 }],
        prescriptionStatus: pres.status,
      });
    }
    setShowForm(true);
    setTimeout(() => topRecordsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingType === 'soap') {
      if (!formData.subjective.trim() || !formData.assessment.trim()) {
        showToast('error', '請填寫主觀症狀和評估');
        return;
      }
      if (editingId) {
        updateSOAPNote(editingId, {
          visitDate: formData.visitDate,
          subjective: formData.subjective,
          objective: formData.objective,
          assessment: formData.assessment,
          plan: formData.plan,
          notes: formData.notes,
        });
        showToast('success', '就診記錄已更新');
      } else {
        addSOAPNote({
          visitDate: formData.visitDate,
          subjective: formData.subjective,
          objective: formData.objective,
          assessment: formData.assessment,
          plan: formData.plan,
          notes: formData.notes,
          patientId: patient.id,
          doctorId: user?.id || '',
          doctorName: user?.name || '',
        });
        showToast('success', '就診記錄已新增');
      }
    } else {
      const validMeds = formData.medications.filter(m => m.name.trim());
      if (validMeds.length === 0) {
        showToast('error', '請至少填寫一種藥物');
        return;
      }
      if (editingId) {
        updatePrescription(editingId, {
          date: formData.visitDate,
          medications: validMeds,
          status: formData.prescriptionStatus,
          notes: formData.notes,
        });
        showToast('success', '處方已更新');
      } else {
        addPrescription({
          date: formData.visitDate,
          medications: validMeds,
          status: formData.prescriptionStatus,
          notes: formData.notes,
          patientId: patient.id,
          doctorId: user?.id || '',
          doctorName: user?.name || '',
        });
        showToast('success', '處方已新增');
      }
    }
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingType(null);
    setEditingId(null);
  };

  const getStatusColor = (status: PrescriptionStatus) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'filled': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'expired': return 'bg-slate-200 text-slate-500 border border-slate-300';
    }
  };

  const getStatusText = (status: PrescriptionStatus) => {
    switch (status) {
      case 'active': return '有效';
      case 'filled': return '已取藥';
      case 'expired': return '已過期';
    }
  };

  const getRouteText = (route: MedicationRoute) => {
    const routes: Record<MedicationRoute, string> = {
      oral: '口服', topical: '外用', injection: '注射', inhalation: '吸入', other: '其他',
    };
    return routes[route];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="max-w-full mx-auto">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link to={`/patients/${patient.id}`} className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">醫療記錄</h1>
            <p className="text-sm text-slate-500">{patient.name} ({patient.patientNumber})</p>
          </div>
        </div>

        {user?.role !== 'patient' && !showForm && (
          <div className="flex gap-2">
            <button
              onClick={() => openNewForm('soap')}
              className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 flex items-center gap-1.5"
            >
              <Stethoscope className="w-4 h-4" />
              新就診
            </button>
            <button
              onClick={() => openNewForm('prescription')}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <Pill className="w-4 h-4" />
              新處方
            </button>
          </div>
        )}
      </div>

      {/* Main Content: Form + Records */}
      <div className={`grid gap-4 ${showForm ? 'grid-cols-5' : 'grid-cols-1'}`}>
        {/* Integrated Form Panel */}
        {showForm && (
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-4 max-h-[calc(100vh-180px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingType('soap')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${editingType === 'soap' ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-100 text-slate-600'}`}
                >
                  <Stethoscope className="w-4 h-4 inline mr-1" />
                  就診記錄
                </button>
                <button
                  onClick={() => setEditingType('prescription')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${editingType === 'prescription' ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' : 'bg-slate-100 text-slate-600'}`}
                >
                  <Pill className="w-4 h-4 inline mr-1" />
                  處方藥物
                </button>
              </div>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600 w-16">日期</label>
                <input
                  type="date"
                  value={formData.visitDate}
                  onChange={e => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              {/* SOAP Fields */}
              {editingType === 'soap' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-yellow-700 mb-1">
                      S - 主觀症狀 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.subjective}
                      onChange={e => setFormData(prev => ({ ...prev, subjective: e.target.value }))}
                      rows={2}
                      placeholder="病人主訴..."
                      className="w-full px-3 py-1.5 border border-yellow-200 rounded text-sm bg-yellow-50 focus:ring-2 focus:ring-yellow-200 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">O - 客觀發現</label>
                    <textarea
                      value={formData.objective}
                      onChange={e => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                      rows={2}
                      placeholder="檢查結果..."
                      className="w-full px-3 py-1.5 border border-blue-200 rounded text-sm bg-blue-50 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      A - 評估 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.assessment}
                      onChange={e => setFormData(prev => ({ ...prev, assessment: e.target.value }))}
                      rows={2}
                      placeholder="診斷意見..."
                      className="w-full px-3 py-1.5 border border-green-200 rounded text-sm bg-green-50 focus:ring-2 focus:ring-green-200 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">P - 處置計劃</label>
                    <textarea
                      value={formData.plan}
                      onChange={e => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                      rows={2}
                      placeholder="治療方案..."
                      className="w-full px-3 py-1.5 border border-purple-200 rounded text-sm bg-purple-50 focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                    />
                  </div>
                </>
              )}

              {/* Prescription Fields */}
              {editingType === 'prescription' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-slate-600">藥物</label>
                      <button
                        type="button"
                        onClick={addMedication}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        + 新增
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {formData.medications.map((med, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                          <input
                            type="text"
                            value={med.name}
                            onChange={e => updateMedication(idx, 'name', e.target.value)}
                            placeholder="藥名"
                            className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={e => updateMedication(idx, 'dosage', e.target.value)}
                            placeholder="劑量"
                            className="w-20 px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={e => updateMedication(idx, 'frequency', e.target.value)}
                            placeholder="頻率"
                            className="w-20 px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                          <select
                            value={med.route}
                            onChange={e => updateMedication(idx, 'route', e.target.value)}
                            className="w-16 px-1 py-1 border border-slate-200 rounded text-xs"
                          >
                            <option value="oral">口服</option>
                            <option value="topical">外用</option>
                            <option value="injection">注射</option>
                            <option value="inhalation">吸入</option>
                          </select>
                          <input
                            type="number"
                            value={med.duration}
                            onChange={e => updateMedication(idx, 'duration', parseInt(e.target.value) || 0)}
                            placeholder="天"
                            className="w-12 px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                          {formData.medications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMedication(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600 w-16">狀態</label>
                    <select
                      value={formData.prescriptionStatus}
                      onChange={e => setFormData(prev => ({ ...prev, prescriptionStatus: e.target.value as PrescriptionStatus }))}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm"
                    >
                      <option value="active">有效</option>
                      <option value="filled">已取藥</option>
                      <option value="expired">已過期</option>
                    </select>
                  </div>
                </>
              )}

              {/* Common Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">備註</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="其他說明..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                >
                  {editingId ? '儲存' : '新增'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Compact Records Panel */}
        <div className={`${showForm ? 'col-span-3' : ''}`} ref={topRecordsRef}>
          {/* Compact Stats & Filters */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded text-amber-700">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span className="font-medium">{soapNotes.length}</span> 就診
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded text-indigo-700">
                  <Pill className="w-3.5 h-3.5" />
                  <span className="font-medium">{prescriptions.length}</span> 處方
                </span>
              </div>

              <div className="h-4 w-px bg-slate-200" />

              {/* Tabs */}
              <div className="flex gap-1">
                {[
                  { key: 'all', label: '全部', color: 'gray' },
                  { key: 'soap', label: '就診', color: 'amber' },
                  { key: 'prescription', label: '處方', color: 'indigo' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      activeTab === tab.key
                        ? tab.color === 'amber'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : tab.color === 'indigo'
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                        : 'text-slate-500 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-slate-200" />

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value as typeof dateFilter)}
                className="px-2 py-1 text-xs border border-slate-200 rounded"
              >
                <option value="all">全部時間</option>
                <option value="30days">30天</option>
                <option value="90days">90天</option>
                <option value="year">1年</option>
              </select>

              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜尋..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Compact Records List - Table Style */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暫無記錄</p>
              </div>
            ) : (
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                {/* Table Header */}
                <div className="sticky top-0 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-slate-500">
                  <div className="col-span-1">日期</div>
                  <div className="col-span-1">類型</div>
                  <div className="col-span-5">內容摘要</div>
                  <div className="col-span-2">藥物</div>
                  <div className="col-span-1">醫師</div>
                  <div className="col-span-2 text-right">操作</div>
                </div>

                {/* Records */}
                {filteredRecords.map((record, idx) => {
                  const isExpanded = expandedRecords.has(record.id);
                  const isSOAP = record.type === 'soap';
                  const data = record.data;

                  return (
                    <div key={record.id} className="border-b border-slate-100 last:border-0">
                      {/* Compact Row */}
                      <div
                        className={`grid grid-cols-12 gap-2 px-3 py-2 text-sm cursor-pointer ${isExpanded ? (isSOAP ? 'bg-amber-50 border-l-2 border-l-amber-400' : 'bg-indigo-50 border-l-2 border-l-indigo-400') : (isSOAP ? 'hover:bg-amber-50/50' : 'hover:bg-indigo-50/50')}`}
                        onClick={() => toggleExpand(record.id)}
                      >
                        <div className={`col-span-1 ${isSOAP ? 'text-amber-700' : 'text-indigo-700'} font-medium`}>
                          {formatDate(record.date)}
                        </div>
                        <div className="col-span-1">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                            isSOAP ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}>
                            {isSOAP ? (
                              <><Stethoscope className="w-3 h-3" /> 就診</>
                            ) : (
                              <><Pill className="w-3 h-3" /> 處方</>
                            )}
                          </span>
                        </div>
                        <div className="col-span-5 text-slate-700 truncate">
                          {isSOAP ? (
                            <span>
                              <span className="text-yellow-600">S:</span> {((data as SOAPNote).subjective).substring(0, 30)}
                              {(data as SOAPNote).objective && (
                                <span className="text-blue-600 ml-2">O:</span>
                              )}
                              <span className="text-green-600 ml-2">A:</span> {((data as SOAPNote).assessment).substring(0, 30)}
                            </span>
                          ) : (
                            <span className="text-slate-600">
                              {(data as Prescription).medications.map(m => m.name).join('、')}
                            </span>
                          )}
                        </div>
                        <div className="col-span-2 text-slate-500 text-xs">
                          {isSOAP ? '-' : (
                            <span className="truncate block">
                              {(data as Prescription).medications.slice(0, 2).map(m => m.name).join(', ')}
                              {(data as Prescription).medications.length > 2 && '...'}
                            </span>
                          )}
                        </div>
                        <div className="col-span-1 text-slate-500 text-xs truncate">
                          {record.doctorName}
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditForm(record); }}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="編輯"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('確定要刪除嗎？')) {
                                if (isSOAP) deleteSOAPNote((data as SOAPNote).id);
                                else deletePrescription((data as Prescription).id);
                                showToast('success', '已刪除');
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="刪除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className={`px-3 pb-3 ${isSOAP ? 'bg-amber-50/70' : 'bg-indigo-50/70'}`}>
                          {isSOAP ? (
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                                <div className="font-medium text-yellow-800 mb-1">S 主觀症狀</div>
                                <div className="text-slate-600 whitespace-pre-wrap">{(data as SOAPNote).subjective}</div>
                              </div>
                              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                                <div className="font-medium text-blue-800 mb-1">O 客觀發現</div>
                                <div className="text-slate-600 whitespace-pre-wrap">{(data as SOAPNote).objective || '-'}</div>
                              </div>
                              <div className="p-2 bg-green-50 rounded border border-green-200">
                                <div className="font-medium text-green-800 mb-1">A 評估</div>
                                <div className="text-slate-600 whitespace-pre-wrap">{(data as SOAPNote).assessment}</div>
                              </div>
                              <div className="p-2 bg-purple-50 rounded border border-purple-200">
                                <div className="font-medium text-purple-800 mb-1">P 處置計劃</div>
                                <div className="text-slate-600 whitespace-pre-wrap">{(data as SOAPNote).plan || '-'}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor((data as Prescription).status)}`}>
                                  {getStatusText((data as Prescription).status)}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {(data as Prescription).medications.map((med, idx) => (
                                  <div key={idx} className="p-2 bg-white rounded border border-indigo-200">
                                    <div className="font-medium text-indigo-800">{med.name}</div>
                                    <div className="text-xs text-slate-500">
                                      {med.dosage} | {med.frequency} | {getRouteText(med.route)} | {med.duration}天
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {editingType !== 'prescription' && (
                                <select
                                  value={(data as Prescription).status}
                                  onChange={e => {
                                    updatePrescription((data as Prescription).id, { status: e.target.value as PrescriptionStatus });
                                    showToast('success', '狀態已更新');
                                  }}
                                  className="px-2 py-1 text-xs border border-indigo-200 rounded"
                                >
                                  <option value="active">有效</option>
                                  <option value="filled">已取藥</option>
                                  <option value="expired">已過期</option>
                                </select>
                              )}
                            </div>
                          )}
                          {(data as SOAPNote).notes && (
                            <div className={`mt-2 p-2 rounded text-xs ${isSOAP ? 'bg-amber-100/50' : 'bg-indigo-100/50'}`}>
                              <span className="font-medium text-slate-600">備註：</span>
                              {(data as SOAPNote).notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientMedicalRecords;
