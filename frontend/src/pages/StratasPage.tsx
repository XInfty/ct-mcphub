import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Strata } from '@/types';
import { useStrataData } from '@/hooks/useStrataData';
import { useServerData } from '@/hooks/useServerData';
import AddStrataForm from '@/components/AddStrataForm';
import EditStrataForm from '@/components/EditStrataForm';
import { Copy, Check, Link, FileCode, DropdownIcon } from '@/components/icons/LucideIcons';
import { useToast } from '@/contexts/ToastContext';
import { useSettingsData } from '@/hooks/useSettingsData';

const StratasPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    stratas,
    loading: stratasLoading,
    error: strataError,
    setError: setStrataError,
    deleteStrata,
    triggerRefresh,
  } = useStrataData();
  const { servers } = useServerData({ refreshOnMount: true });
  const { showToast } = useToast();
  const { installConfig } = useSettingsData();

  const [editingStrata, setEditingStrata] = useState<Strata | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedStrataId, setCopiedStrataId] = useState<string | null>(null);
  const [showCopyDropdown, setShowCopyDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCopyDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEditClick = (strata: Strata) => {
    setEditingStrata(strata);
  };

  const handleEditComplete = () => {
    setEditingStrata(null);
    triggerRefresh();
  };

  const handleDeleteStrata = async (strataId: string) => {
    if (!confirm(t('stratas.deleteConfirm') || 'Are you sure you want to delete this strata?')) {
      return;
    }

    const result = await deleteStrata(strataId);
    if (!result || !result.success) {
      setStrataError(result?.message || t('stratas.deleteError'));
    }
  };

  const handleAddStrata = () => {
    setShowAddForm(true);
  };

  const handleAddComplete = () => {
    setShowAddForm(false);
    triggerRefresh();
  };

  const copyToClipboard = (text: string, strataId: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedStrataId(strataId);
        setShowCopyDropdown(null);
        showToast(t('common.copySuccess'), 'success');
        setTimeout(() => setCopiedStrataId(null), 2000);
      });
    } else {
      // Fallback for HTTP or unsupported clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // Avoid scrolling to bottom
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedStrataId(strataId);
        setShowCopyDropdown(null);
        showToast(t('common.copySuccess'), 'success');
        setTimeout(() => setCopiedStrataId(null), 2000);
      } catch (err) {
        showToast(t('common.copyFailed') || 'Copy failed', 'error');
        console.error('Copy to clipboard failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCopyId = (strataId: string) => {
    copyToClipboard(strataId, strataId);
  };

  const handleCopyUrl = (strataId: string) => {
    copyToClipboard(`${installConfig.baseUrl}/mcp/${strataId}`, strataId);
  };

  const handleCopyJson = (strataId: string) => {
    const jsonConfig = {
      mcpServers: {
        mcphub: {
          url: `${installConfig.baseUrl}/mcp/${strataId}`,
          headers: {
            Authorization: "Bearer <your-access-token>"
          }
        }
      }
    };
    copyToClipboard(JSON.stringify(jsonConfig, null, 2), strataId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#ff6600]">{t('pages.stratas.title') || 'Stratas'}</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleAddStrata}
            className="px-4 py-2 bg-[#ff6600] text-black rounded hover:bg-[#cc5200] flex items-center btn-primary transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {t('stratas.add') || 'Add Strata'}
          </button>
        </div>
      </div>

      {strataError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 error-box rounded-lg">
          <p>{strataError}</p>
        </div>
      )}

      {stratasLoading ? (
        <div className="bg-[#000000] shadow rounded-lg p-6 loading-container border border-[#ff6600]/30">
          <div className="flex flex-col items-center justify-center">
            <svg
              className="animate-spin h-10 w-10 text-[#ff6600] mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-[#ff6600]">{t('app.loading') || 'Loading...'}</p>
          </div>
        </div>
      ) : stratas.length === 0 ? (
        <div className="bg-[#000000] shadow rounded-lg p-6 empty-state border border-[#ff6600]/30">
          <p className="text-[#ff6600]">
            {t('stratas.noStratas') || 'No stratas configured. Click "Add Strata" to create one.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {stratas.map((strata) => (
            <div
              key={strata.id}
              className="bg-[#000000] shadow rounded-lg p-6 page-card dashboard-card border border-[#ff6600]/30"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center">
                    <h3 className="text-xl font-semibold text-[#ff6600] mb-2">{strata.name}</h3>
                    <div className="flex items-center ml-3">
                      <span className="text-xs text-[#ff6600]/50 mr-1">{strata.id}</span>
                      <div className="relative" ref={showCopyDropdown === strata.id ? dropdownRef : null}>
                        <button
                          onClick={() => setShowCopyDropdown(showCopyDropdown === strata.id ? null : strata.id)}
                          className="p-1 text-[#ff6600]/50 hover:text-[#ff6600] transition-colors flex items-center"
                          title={t('common.copy')}
                        >
                          {copiedStrataId === strata.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          <DropdownIcon size={12} className="ml-1" />
                        </button>

                        {showCopyDropdown === strata.id && (
                          <div className="absolute top-full left-0 mt-1 bg-[#000000] shadow-lg rounded-md border border-[#ff6600]/30 py-1 z-10 min-w-[140px]">
                            <button
                              onClick={() => handleCopyId(strata.id)}
                              className="w-full px-3 py-2 text-left text-sm text-[#ff6600] hover:bg-[#ff6600]/20 flex items-center"
                            >
                              <Copy size={12} className="mr-2" />
                              {t('common.copyId')}
                            </button>
                            <button
                              onClick={() => handleCopyUrl(strata.id)}
                              className="w-full px-3 py-2 text-left text-sm text-[#ff6600] hover:bg-[#ff6600]/20 flex items-center"
                            >
                              <Link size={12} className="mr-2" />
                              {t('common.copyUrl')}
                            </button>
                            <button
                              onClick={() => handleCopyJson(strata.id)}
                              className="w-full px-3 py-2 text-left text-sm text-[#ff6600] hover:bg-[#ff6600]/20 flex items-center"
                            >
                              <FileCode size={12} className="mr-2" />
                              {t('common.copyJson')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {strata.description && (
                    <p className="text-[#ff6600]/70 text-sm">{strata.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(strata)}
                    className="px-3 py-1 text-sm bg-[#ff6600]/20 text-[#ff6600] rounded hover:bg-[#ff6600]/30 btn-secondary transition-colors border border-[#ff6600]/30"
                  >
                    {t('common.edit') || 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDeleteStrata(strata.id)}
                    className="px-3 py-1 text-sm bg-red-900/20 text-red-400 rounded hover:bg-red-900/30 btn-danger transition-colors border border-red-500/30"
                  >
                    {t('common.delete') || 'Delete'}
                  </button>
                </div>
              </div>

              {strata.servers && strata.servers.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-[#ff6600] mb-2">
                    {t('stratas.servers') || 'Servers'} ({strata.servers.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {strata.servers.map((server, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#ff6600]/20 text-[#ff6600] rounded-full text-sm label-primary border border-[#ff6600]/30"
                      >
                        {server.name}
                        {server.tools !== 'all' && server.tools && (
                          <span className="ml-1 text-xs text-[#ff6600]/70">
                            ({Array.isArray(server.tools) ? server.tools.length : 0} tools)
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <AddStrataForm onAdd={handleAddComplete} onCancel={handleAddComplete} />
      )}

      {editingStrata && (
        <EditStrataForm
          strata={editingStrata}
          onEdit={handleEditComplete}
          onCancel={() => setEditingStrata(null)}
        />
      )}
    </div>
  );
};

export default StratasPage;
