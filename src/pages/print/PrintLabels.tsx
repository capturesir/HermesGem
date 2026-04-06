import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Printer, Download, Edit, RefreshCw } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { getCSTDateString } from '../../lib/dateUtils';

interface LabelContent {
  patientName: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  date: string;
  organizationName: string;
  doctorName: string;
  notes: string;
}

const defaultLabel: LabelContent = {
  patientName: '',
  medicationName: '',
  dosage: '',
  frequency: '',
  duration: '',
  route: '',
  date: getCSTDateString(),
  organizationName: '醫療機構電子病歷系統',
  doctorName: '',
  notes: ''
};

export default function PrintLabels() {
  const { prescriptions, patients } = useData();
  const [selectedPrescription, setSelectedPrescription] = useState<string>('');
  const [labelContent, setLabelContent] = useState<LabelContent>(defaultLabel);
  const [isEditing, setIsEditing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Get all active prescriptions with medications
  const activePrescriptions = prescriptions.filter(p => p.status === 'active');

  const handleSelectPrescription = (prescriptionId: string) => {
    setSelectedPrescription(prescriptionId);
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (prescription && prescription.medications.length > 0) {
      const medication = prescription.medications[0];
      const patient = patients.find(p => p.id === prescription.patientId);
      setLabelContent({
        ...defaultLabel,
        patientName: patient?.name || '',
        medicationName: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        duration: `${medication.duration} 天`,
        route: getRouteLabel(medication.route),
        date: prescription.date,
        doctorName: prescription.doctorName || '',
        notes: prescription.notes || ''
      });
    }
    setIsEditing(false);
  };

  const getRouteLabel = (route: string) => {
    const labels: Record<string, string> = {
      oral: '口服',
      topical: '外用',
      injection: '注射',
      inhalation: '吸入',
      other: '其他'
    };
    return labels[route] || route;
  };

  const handleUpdateField = (field: keyof LabelContent, value: string) => {
    setLabelContent(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>藥物標籤列印</title>
          <style>
            @page {
              size: 3in 2in;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
              font-size: 12px;
              line-height: 1.4;
            }
            .label {
              width: 3in;
              height: 2in;
              padding: 8px;
              border: 1px solid #000;
              page-break-inside: avoid;
            }
            .label-header {
              font-weight: bold;
              font-size: 14px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 4px;
              margin-bottom: 6px;
            }
            .label-row {
              display: flex;
              margin-bottom: 4px;
            }
            .label-label {
              font-weight: bold;
              width: 60px;
              flex-shrink: 0;
            }
            .label-value {
              flex: 1;
              word-break: break-all;
            }
            .label-footer {
              margin-top: 6px;
              padding-top: 4px;
              border-top: 1px solid #ccc;
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleBatchPrint = () => {
    const prescription = prescriptions.find(p => p.id === selectedPrescription);
    if (!prescription || !prescription.medications.length) return;

    const patient = patients.find(p => p.id === prescription.patientId);
    const labels = prescription.medications.map(med => `
      <div class="label">
        <div class="label-header">${labelContent.organizationName}</div>
        <div class="label-row">
          <span class="label-label">病人:</span>
          <span class="label-value">${patient?.name || ''}</span>
        </div>
        <div class="label-row">
          <span class="label-label">藥物:</span>
          <span class="label-value" style="font-weight: bold; font-size: 14px;">${med.name}</span>
        </div>
        <div class="label-row">
          <span class="label-label">劑量:</span>
          <span class="label-value">${med.dosage}</span>
        </div>
        <div class="label-row">
          <span class="label-label">用法:</span>
          <span class="label-value">${med.frequency}</span>
        </div>
        <div class="label-row">
          <span class="label-label">天數:</span>
          <span class="label-value">${med.duration} 天</span>
        </div>
        <div class="label-row">
          <span class="label-label">途徑:</span>
          <span class="label-value">${getRouteLabel(med.route)}</span>
        </div>
        <div class="label-footer">
          日期: ${prescription.date} | 醫生: ${prescription.doctorName || ''}
        </div>
      </div>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>批量藥物標籤列印</title>
          <style>
            @page {
              size: 3in 2in;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
              font-size: 12px;
              line-height: 1.4;
            }
            .label {
              width: 3in;
              height: 2in;
              padding: 8px;
              border: 1px solid #000;
              page-break-inside: avoid;
              display: inline-block;
              margin: 2px;
            }
            .label-header {
              font-weight: bold;
              font-size: 14px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 4px;
              margin-bottom: 6px;
            }
            .label-row {
              display: flex;
              margin-bottom: 4px;
            }
            .label-label {
              font-weight: bold;
              width: 60px;
              flex-shrink: 0;
            }
            .label-value {
              flex: 1;
              word-break: break-all;
            }
            .label-footer {
              margin-top: 6px;
              padding-top: 4px;
              border-top: 1px solid #ccc;
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${labels}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">藥物標籤列印</h1>
          <p className="text-gray-500 mt-1">自訂並列印藥物標籤</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Controls */}
        <div className="space-y-4">
          {/* Select Prescription */}
          <Card>
            <CardHeader>
              <CardTitle>選擇處方</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>選擇處方記錄</Label>
                <select
                  value={selectedPrescription}
                  onChange={(e) => handleSelectPrescription(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">請選擇處方...</option>
                  {activePrescriptions.map((p) => {
                    const patient = patients.find(pt => pt.id === p.patientId);
                    return (
                      <option key={p.id} value={p.id}>
                        {patient?.name} - {p.date} ({p.medications.length} 種藥物)
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedPrescription && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">藥物清單:</p>
                  <ul className="space-y-1">
                    {prescriptions.find(p => p.id === selectedPrescription)?.medications.map((med, idx) => (
                      <li key={idx} className="text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {med.name} - {med.dosage}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleBatchPrint}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    批量列印所有藥物標籤
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Label Content */}
          {selectedPrescription && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>標籤內容</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {isEditing ? '完成編輯' : '編輯'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>機構名稱</Label>
                    <Input
                      value={labelContent.organizationName}
                      onChange={(e) => handleUpdateField('organizationName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>日期</Label>
                    <Input
                      type="date"
                      value={labelContent.date}
                      onChange={(e) => handleUpdateField('date', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>病人姓名</Label>
                    <Input
                      value={labelContent.patientName}
                      onChange={(e) => handleUpdateField('patientName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>醫生姓名</Label>
                    <Input
                      value={labelContent.doctorName}
                      onChange={(e) => handleUpdateField('doctorName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>藥物名稱</Label>
                    <Input
                      value={labelContent.medicationName}
                      onChange={(e) => handleUpdateField('medicationName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>劑量</Label>
                    <Input
                      value={labelContent.dosage}
                      onChange={(e) => handleUpdateField('dosage', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>用藥頻率</Label>
                    <Input
                      value={labelContent.frequency}
                      onChange={(e) => handleUpdateField('frequency', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>療程天數</Label>
                    <Input
                      value={labelContent.duration}
                      onChange={(e) => handleUpdateField('duration', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>用藥途徑</Label>
                    <Input
                      value={labelContent.route}
                      onChange={(e) => handleUpdateField('route', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>備註</Label>
                    <Input
                      value={labelContent.notes}
                      onChange={(e) => handleUpdateField('notes', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handlePrint} className="flex-1">
                    <Printer className="w-4 h-4 mr-2" />
                    列印標籤
                  </Button>
                  <Button variant="outline" onClick={() => setLabelContent(defaultLabel)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重置
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>標籤預覽</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={printRef}
                className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 mx-auto"
                style={{ width: '300px', height: '200px', fontFamily: 'inherit' }}
              >
                <div className="border-b pb-2 mb-2">
                  <p className="font-bold text-sm">{labelContent.organizationName}</p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex">
                    <span className="font-bold w-16">病人:</span>
                    <span>{labelContent.patientName || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-16">藥物:</span>
                    <span className="font-bold">{labelContent.medicationName || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-16">劑量:</span>
                    <span>{labelContent.dosage || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-16">用法:</span>
                    <span>{labelContent.frequency || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-16">天數:</span>
                    <span>{labelContent.duration || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-16">途徑:</span>
                    <span>{labelContent.route || '-'}</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                  日期: {labelContent.date} | 醫生: {labelContent.doctorName || '-'}
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                這是標籤的實際大小預覽 (3" x 2")
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>使用說明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>1. 選擇要列印的處方記錄</p>
              <p>2. 點擊「編輯」按鈕自訂標籤內容</p>
              <p>3. 修改完成後點擊「列印標籤」進行列印</p>
              <p>4. 或使用「批量列印」一次性列印該處方的所有藥物標籤</p>
              <p className="text-gray-400 mt-4">提示: 所有登入用戶都有權限使用此功能</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
