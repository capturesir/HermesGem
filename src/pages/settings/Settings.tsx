import React, { useState } from 'react';
import { Save, Shield, Users, Calendar, Activity, FileText, Pill, AlertTriangle, FolderOpen } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';
import { moduleLabels } from '../../data/initialData';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useData();
  const { showToast } = useToast();

  const [orgName, setOrgName] = useState(settings.organizationName);
  const [slogan, setSlogan] = useState(settings.slogan);

  const modules = [
    { key: 'users', icon: Users, label: '用戶管理', roles: ['admin'] },
    { key: 'patients', icon: FileText, label: '病人管理', roles: ['admin', 'doctor', 'nurse', 'staff'] },
    { key: 'appointments', icon: Calendar, label: '預約管理', roles: ['admin', 'doctor', 'nurse', 'staff', 'patient'] },
    { key: 'settings', icon: Shield, label: '系統設定', roles: ['admin'] },
    { key: 'soap', icon: Activity, label: 'SOAP 記錄', roles: ['admin', 'doctor'] },
    { key: 'prescriptions', icon: Pill, label: '處方管理', roles: ['admin', 'doctor'] },
    { key: 'vitals', icon: Activity, label: '生命體徵', roles: ['admin', 'doctor', 'nurse'] },
    { key: 'allergies', icon: AlertTriangle, label: '過敏記錄', roles: ['admin', 'doctor', 'nurse'] },
    { key: 'alerts', icon: AlertTriangle, label: '特別警示', roles: ['admin', 'doctor', 'nurse'] },
    { key: 'documents', icon: FolderOpen, label: '文件管理', roles: ['admin', 'doctor', 'nurse'] },
  ];

  const roles: { key: UserRole; label: string; color: string }[] = [
    { key: 'admin', label: '管理員', color: 'bg-purple-100 text-purple-700' },
    { key: 'staff', label: '職員', color: 'bg-cyan-100 text-cyan-700' },
    { key: 'doctor', label: '醫生', color: 'bg-blue-100 text-blue-700' },
    { key: 'nurse', label: '護士', color: 'bg-pink-100 text-pink-700' },
    { key: 'patient', label: '病人', color: 'bg-green-100 text-green-700' },
  ];

  const getPermission = (role: UserRole, module: string) => {
    const perm = settings.permissions.find(p => p.role === role && p.module === module);
    return perm || { view: false, edit: false, delete: false };
  };

  const updatePermission = (role: UserRole, module: string, action: 'view' | 'edit' | 'delete', value: boolean) => {
    const newPermissions = [...settings.permissions];
    const index = newPermissions.findIndex(p => p.role === role && p.module === module);

    if (index >= 0) {
      newPermissions[index] = { ...newPermissions[index], [action]: value };
    } else {
      newPermissions.push({
        role,
        module,
        view: action === 'view' ? value : false,
        edit: action === 'edit' ? value : false,
        delete: action === 'delete' ? value : false,
      });
    }

    updateSettings({ permissions: newPermissions });
  };

  const handleSave = () => {
    updateSettings({
      organizationName: orgName,
      slogan: slogan,
    });
    showToast('success', '系統設定已儲存');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">系統設定</h1>
        <p className="text-slate-500 mt-1">管理系統配置和權限設定</p>
      </div>

      {/* Organization Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          機構設定
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              機構名稱
            </label>
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              className="w-full max-w-md px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              系統標語
            </label>
            <input
              type="text"
              value={slogan}
              onChange={e => setSlogan(e.target.value)}
              className="w-full max-w-md px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          儲存設定
        </button>
      </div>

      {/* Role Permissions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">角色權限設定</h2>
        <p className="text-sm text-slate-500 mb-6">
          設定各個角色對不同模組的檢視、編輯、刪除權限
        </p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600 sticky left-0 bg-white">
                  模組
                </th>
                {roles.map(role => (
                  <th key={role.key} className="text-center py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${role.color}`}>
                      {role.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map(module => {
                const Icon = module.icon;
                const visibleRoles = roles.filter(r => module.roles.includes(r.key));

                return (
                  <tr key={module.key} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 sticky left-0 bg-white">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{module.label}</span>
                      </div>
                    </td>
                    {roles.map(role => {
                      const hasAccess = module.roles.includes(role.key);
                      const perm = getPermission(role.key, module.key);

                      if (!hasAccess) {
                        return (
                          <td key={role.key} className="py-3 px-4 text-center">
                            <span className="text-slate-300">-</span>
                          </td>
                        );
                      }

                      return (
                        <td key={role.key} className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            {/* View */}
                            <label className="relative flex items-center justify-center w-8 h-8">
                              <input
                                type="checkbox"
                                checked={perm.view}
                                onChange={e => updatePermission(role.key, module.key, 'view', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                perm.view
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-slate-300 peer-hover:border-slate-400'
                              }`}>
                                {perm.view && <div className="w-2 h-2 bg-white rounded-sm" />}
                              </div>
                            </label>
                            {/* Edit */}
                            <label className="relative flex items-center justify-center w-8 h-8">
                              <input
                                type="checkbox"
                                checked={perm.edit}
                                onChange={e => updatePermission(role.key, module.key, 'edit', e.target.checked)}
                                disabled={!perm.view}
                                className="sr-only peer"
                              />
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                perm.edit
                                  ? 'bg-green-600 border-green-600'
                                  : perm.view
                                  ? 'border-slate-300 peer-hover:border-slate-400'
                                  : 'border-slate-200 bg-slate-100 cursor-not-allowed'
                              }`}>
                                {perm.edit && <div className="w-2 h-2 bg-white rounded-sm" />}
                              </div>
                            </label>
                            {/* Delete */}
                            <label className="relative flex items-center justify-center w-8 h-8">
                              <input
                                type="checkbox"
                                checked={perm.delete}
                                onChange={e => updatePermission(role.key, module.key, 'delete', e.target.checked)}
                                disabled={!perm.edit}
                                className="sr-only peer"
                              />
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                perm.delete
                                  ? 'bg-red-600 border-red-600'
                                  : perm.edit
                                  ? 'border-slate-300 peer-hover:border-slate-400'
                                  : 'border-slate-200 bg-slate-100 cursor-not-allowed'
                              }`}>
                                {perm.delete && <div className="w-2 h-2 bg-white rounded-sm" />}
                              </div>
                            </label>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border-2 border-blue-600 bg-blue-600 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-sm" />
            </div>
            <span className="text-slate-600">檢視</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border-2 border-green-600 bg-green-600 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-sm" />
            </div>
            <span className="text-slate-600">編輯</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border-2 border-red-600 bg-red-600 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-sm" />
            </div>
            <span className="text-slate-600">刪除</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-slate-400">-</span>
            <span className="text-slate-500">無權限</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
