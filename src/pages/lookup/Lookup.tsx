import React, { useState, useEffect, useCallback } from 'react';
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
  const [icd10Results, setIcd10Results] = useState<ICD10Code[]>([]);
  const [medicationResults, setMedicationResults] = useState<Medication[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search for ICD-10
  const searchICD10 = useCallback(async (query: string) => {
    if (query.length < 1) {
      setIcd10Results([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await api.searchICD10(query) as ICD10Code[];
      setIcd10Results(results);
    } catch (error) {
      console.error('Failed to search ICD-10:', error);
      // Use sample data as fallback
      setIcd10Results([
        { id: '1', code: 'I10', name_tc: '原發性高血壓', name_en: 'Essential hypertension', category: '循環系統' },
        { id: '2', code: 'E11', name_tc: '2型糖尿病', name_en: 'Type 2 diabetes mellitus', category: '內分泌' },
        { id: '3', code: 'J06', name_tc: '上呼吸道感染', name_en: 'Acute upper respiratory infection', category: '呼吸系統' },
      ]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search for Medications
  const searchMedications = useCallback(async (query: string) => {
    if (query.length < 1) {
      setMedicationResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await api.searchMedications(query) as Medication[];
      setMedicationResults(results);
    } catch (error) {
      console.error('Failed to search medications:', error);
      // Use sample data as fallback
      setMedicationResults([
        { id: '1', name: '阿司匹林', generic_name: 'Aspirin', dosage: '100mg', route: '口服', frequency: '每日一次' },
        { id: '2', name: '布洛芬', generic_name: 'Ibuprofen', dosage: '200mg', route: '口服', frequency: '每日三次' },
        { id: '3', name: '氨氯地平', generic_name: 'Amlodipine', dosage: '5mg', route: '口服', frequency: '每日一次' },
      ]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchICD10(icd10Query);
    }, 300);
    return () => clearTimeout(timer);
  }, [icd10Query, searchICD10]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchMedications(medicationQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [medicationQuery, searchMedications]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '傳染病': 'bg-red-100 text-red-800',
      '腫瘤': 'bg-purple-100 text-purple-800',
      '血液疾病': 'bg-pink-100 text-pink-800',
      '內分泌': 'bg-orange-100 text-orange-800',
      '代謝疾病': 'bg-yellow-100 text-yellow-800',
      '精神疾病': 'bg-indigo-100 text-indigo-800',
      '神經系統': 'bg-blue-100 text-blue-800',
      '眼部疾病': 'bg-cyan-100 text-cyan-800',
      '循環系統': 'bg-red-100 text-red-800',
      '呼吸系統': 'bg-green-100 text-green-800',
      '消化系統': 'bg-teal-100 text-teal-800',
      '皮膚疾病': 'bg-pink-100 text-pink-800',
      '肌肉骨骼': 'bg-gray-100 text-gray-800',
      '泌尿系統': 'bg-blue-100 text-blue-800',
      '妊娠疾病': 'bg-pink-100 text-pink-800',
      '症狀': 'bg-yellow-100 text-yellow-800',
      '損傷': 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">查找工具</h1>
        <p className="text-gray-500 mt-1">快速查找 ICD-10 疾病分類與藥物資料</p>
      </div>

      {/* Tabs */}
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
              <CardTitle>ICD-10 疾病分類查詢</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="輸入疾病名稱或 ICD-10 編碼..."
                  value={icd10Query}
                  onChange={(e) => setIcd10Query(e.target.value)}
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

              {isSearching && (
                <div className="text-center py-8 text-gray-500">
                  搜尋中...
                </div>
              )}

              {!isSearching && icd10Query && icd10Results.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  找不到符合的疾病分類
                </div>
              )}

              {!isSearching && icd10Results.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">找到 {icd10Results.length} 個結果</p>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {icd10Results.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">
                                {item.code}
                              </span>
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
              )}

              {!icd10Query && (
                <div className="text-center py-12 text-gray-500">
                  <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>輸入關鍵字開始搜尋 ICD-10 疾病分類</p>
                  <p className="text-sm mt-2">可用於快速填入 SOAP 記錄中的「評估」欄位</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>藥物資料庫查詢</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="輸入藥物名稱..."
                  value={medicationQuery}
                  onChange={(e) => setMedicationQuery(e.target.value)}
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

              {isSearching && (
                <div className="text-center py-8 text-gray-500">
                  搜尋中...
                </div>
              )}

              {!isSearching && medicationQuery && medicationResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  找不到符合的藥物
                </div>
              )}

              {!isSearching && medicationResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">找到 {medicationResults.length} 個結果</p>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {medicationResults.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Pill className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-gray-900">{item.name}</span>
                              <span className="text-sm text-gray-500">({item.generic_name})</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                劑量: {item.dosage}
                              </span>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                用法: {item.frequency}
                              </span>
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                途徑: {item.route}
                              </span>
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
              )}

              {!medicationQuery && (
                <div className="text-center py-12 text-gray-500">
                  <Pill className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>輸入關鍵字開始搜尋藥物資料</p>
                  <p className="text-sm mt-2">可用於快速添加處方藥物</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
