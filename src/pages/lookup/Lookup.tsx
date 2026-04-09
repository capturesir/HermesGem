import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
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

  // Load all ICD-10 codes and medications on mount
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

  // Local filter: show all when query is empty, filter when query is typed
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '傳染病': 'bg-red-100 text-red-800',
      '腫瘤': 'bg-purple-100 text-purple-800',
      '血液': 'bg-pink-100 text-pink-800',
      '血液疾病': 'bg-pink-100 text-pink-800',
      '內分泌': 'bg-orange-100 text-orange-800',
      '精神': 'bg-indigo-100 text-indigo-800',
      '神經': 'bg-blue-100 text-blue-800',
      '神經系統': 'bg-blue-100 text-blue-800',
      '眼': 'bg-cyan-100 text-cyan-800',
      '眼/耳': 'bg-cyan-100 text-cyan-800',
      '耳': 'bg-teal-100 text-teal-800',
      '循環': 'bg-red-100 text-red-800',
      '循環系統': 'bg-red-100 text-red-800',
      '呼吸': 'bg-green-100 text-green-800',
      '呼吸系統': 'bg-green-100 text-green-800',
      '消化': 'bg-teal-100 text-teal-800',
      '消化系統': 'bg-teal-100 text-teal-800',
      '面板': 'bg-pink-100 text-pink-800',
      '面板疾病': 'bg-pink-100 text-pink-800',
      '肌肉骨骼': 'bg-gray-100 text-gray-800',
      '泌尿': 'bg-blue-100 text-blue-800',
      '泌尿系統': 'bg-blue-100 text-blue-800',
      '症狀': 'bg-yellow-100 text-yellow-800',
      '損傷': 'bg-red-100 text-red-800',
      '健康狀態': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const renderIcd10List = (list: ICD10Code[]) => (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">
        {icd10Query ? `找到 ${list.length} 個結果` : `共 ${list.length} 筆疾病分類`}
      </p>
      <div className="max-h-96 overflow-y-auto space-y-2">
        {list.map(item => (
          <div key={item.id} className="p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{item.code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </div>
                <p className="font-medium text-gray-900">{item.name_tc}</p>
                <p className="text-sm text-gray-500">{item.name_en}</p>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                選擇
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMedicationList = (list: Medication[]) => (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">
        {medicationQuery ? `找到 ${list.length} 個結果` : `共 ${list.length} 筆藥物`}
      </p>
      <div className="max-h-96 overflow-y-auto space-y-2">
        {list.map(item => (
          <div key={item.id} className="p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">{item.name}</span>
                  <span className="text-sm text-gray-500">({item.generic_name})</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">劑量: {item.dosage || '-'}</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">用法: {item.frequency || '-'}</span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">途徑: {item.route || '-'}</span>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                添加
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">查找工具</h1>
        <p className="text-gray-500 mt-1">快速查找 ICD-10 疾病分類與藥物資料</p>
      </div>

      <Tabs defaultValue="icd10" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="icd10" className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            ICD-10 疾病分類
          </TabsTrigger>
          <TabsTrigger value="medications" className="flex items-center gap-2">
            <Pill className="w-4 h-4" />
            藥物資料庫
          </TabsTrigger>
        </TabsList>

        {/* ICD-10 Tab */}
        <TabsContent value="icd10" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ICD-10 疾病分類</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="搜尋疾病名稱或 ICD-10 編碼..."
                  value={icd10Query}
                  onChange={e => setIcd10Query(e.target.value)}
                  className="pl-10"
                />
                {icd10Query && (
                  <button
                    onClick={() => setIcd10Query('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isLoading && (
                <div className="text-center py-8 text-gray-500">載入中...</div>
              )}

              {!isLoading && filteredIcd10.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {allIcd10.length === 0 ? '尚無疾病分類資料' : '找不到符合的疾病分類'}
                </div>
              )}

              {!isLoading && filteredIcd10.length > 0 && renderIcd10List(filteredIcd10)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>藥物資料庫</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="搜尋藥物名稱..."
                  value={medicationQuery}
                  onChange={e => setMedicationQuery(e.target.value)}
                  className="pl-10"
                />
                {medicationQuery && (
                  <button
                    onClick={() => setMedicationQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isLoading && (
                <div className="text-center py-8 text-gray-500">載入中...</div>
              )}

              {!isLoading && filteredMeds.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {allMedications.length === 0 ? '尚無藥物資料' : '找不到符合的藥物'}
                </div>
              )}

              {!isLoading && filteredMeds.length > 0 && renderMedicationList(filteredMeds)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
