import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Search, Plus, X, Pill, Stethoscope } from 'lucide-react';
import api from '@/services/api';

interface ICD10Code {
  id: string;
  code: string;
  name_tc: string;
  name_en: string;
  category: string;
}

interface Medication {
  id: string;
  name: string;
  generic_name: string;
  dosage: string;
  route: string;
  frequency: string;
}

export default function Lookup() {
  const [icd10Query, setIcd10Query] = useState('');
  const [medicationQuery, setMedicationQuery] = useState('');
  const [allIcd10, setAllIcd10] = useState<ICD10Code[]>([]);
  const [allMedications, setAllMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAllICD10().catch(() => []),
      api.getAllMedications().catch(() => []),
    ]).then(([icd10, meds]) => {
      setAllIcd10((icd10 as ICD10Code[]) || []);
      setAllMedications((meds as Medication[]) || []);
      setIsLoading(false);
    });
  }, []);

  const filteredIcd10 = useMemo(() => {
    if (!icd10Query.trim()) return allIcd10;
    const q = icd10Query.toLowerCase();
    return allIcd10.filter(
      item =>
        item.code.toLowerCase().includes(q) ||
        item.name_tc.includes(icd10Query) ||
        item.name_en.toLowerCase().includes(q)
    );
  }, [allIcd10, icd10Query]);

  const filteredMeds = useMemo(() => {
    if (!medicationQuery.trim()) return allMedications;
    const q = medicationQuery.toLowerCase();
    return allMedications.filter(
      item =>
        item.name.includes(medicationQuery) ||
        (item.generic_name && item.generic_name.toLowerCase().includes(q)) ||
        (item.dosage && item.dosage.toLowerCase().includes(q))
    );
  }, [allMedications, medicationQuery]);

  const categoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      '傳染病': 'bg-red-100 text-red-700',
      '腫瘤': 'bg-purple-100 text-purple-700',
      '血液': 'bg-pink-100 text-pink-700',
      '內分泌': 'bg-orange-100 text-orange-700',
      '精神': 'bg-indigo-100 text-indigo-700',
      '神經': 'bg-blue-100 text-blue-700',
      '循環': 'bg-red-100 text-red-700',
      '呼吸': 'bg-green-100 text-green-700',
      '消化': 'bg-teal-100 text-teal-700',
      '面板': 'bg-pink-100 text-pink-700',
      '肌肉骨骼': 'bg-gray-100 text-gray-700',
      '泌尿': 'bg-cyan-100 text-cyan-700',
      '症狀': 'bg-yellow-100 text-yellow-700',
      '損傷': 'bg-red-100 text-red-700',
      '健康狀態': 'bg-gray-100 text-gray-700',
    };
    const cls = colors[cat] || 'bg-gray-100 text-gray-600';
    return <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls}`}>{cat}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">查找工具</h1>
        <p className="text-gray-500 mt-1">快速查找 ICD-10 疾病分類與藥物資料</p>
      </div>

      {/* ICD-10 Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">ICD-10 疾病分類</h2>
            <span className="text-xs text-gray-400">
              {isLoading ? '載入中...' : `${filteredIcd10.length} 筆`}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜尋疾病名稱或 ICD-10 編碼..."
              value={icd10Query}
              onChange={e => setIcd10Query(e.target.value)}
              className="pl-9 w-64"
            />
            {icd10Query && (
              <button onClick={() => setIcd10Query('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ICD-10 編碼</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">中文名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">英文名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">類別</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">載入中...</td>
                </tr>
              ) : filteredIcd10.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    {allIcd10.length === 0 ? '尚無疾病分類資料' : '找不到符合的疾病分類'}
                  </td>
                </tr>
              ) : (
                filteredIcd10.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="font-mono text-sm bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{item.code}</span>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{item.name_tc}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{item.name_en}</td>
                    <td className="px-6 py-3">{categoryBadge(item.category)}</td>
                    <td className="px-6 py-3 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">選擇</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Medications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pill className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">藥物資料庫</h2>
            <span className="text-xs text-gray-400">
              {isLoading ? '載入中...' : `${filteredMeds.length} 筆`}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜尋藥物名稱..."
              value={medicationQuery}
              onChange={e => setMedicationQuery(e.target.value)}
              className="pl-9 w-64"
            />
            {medicationQuery && (
              <button onClick={() => setMedicationQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">藥物名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">學名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">劑量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">用法頻率</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">途徑</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">載入中...</td>
                </tr>
              ) : filteredMeds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    {allMedications.length === 0 ? '尚無藥物資料' : '找不到符合的藥物'}
                  </td>
                </tr>
              ) : (
                filteredMeds.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{item.generic_name || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{item.dosage || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{item.frequency || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{item.route || '-'}</td>
                    <td className="px-6 py-3 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">選擇</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
