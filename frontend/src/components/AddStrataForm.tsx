import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStrataData } from '@/hooks/useStrataData';
import { useServerData } from '@/hooks/useServerData';
import { StrataFormData, Server, IGroupServerConfig } from '@/types';
import { ServerToolConfig } from './ServerToolConfig';

interface AddStrataFormProps {
  onAdd: () => void;
  onCancel: () => void;
}

const AddStrataForm = ({ onAdd, onCancel }: AddStrataFormProps) => {
  const { t } = useTranslation();
  const { createStrata } = useStrataData();
  const { servers } = useServerData();
  const [availableServers, setAvailableServers] = useState<Server[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<StrataFormData>({
    name: '',
    description: '',
    servers: [] as IGroupServerConfig[],
  });

  useEffect(() => {
    // Filter available servers (enabled only)
    setAvailableServers(servers.filter((server) => server.enabled !== false));
  }, [servers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.name.trim()) {
        setError(t('stratas.nameRequired') || 'Strata name is required');
        setIsSubmitting(false);
        return;
      }

      const result = await createStrata(formData.name, formData.description, formData.servers);
      if (!result || !result.success) {
        setError(result?.message || t('stratas.createError') || 'Failed to create strata');
        setIsSubmitting(false);
        return;
      }

      onAdd();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-black rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col border border-[#ff6600]/30">
        <div className="p-6 flex-shrink-0">
          <h2 className="text-xl font-semibold text-[#ff6600] mb-4">
            {t('stratas.addNew') || 'Add New Strata'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 text-red-400 rounded-md border border-red-500/30">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[#ff6600] text-sm font-bold mb-2" htmlFor="name">
                  {t('stratas.name') || 'Name'} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-[#ff6600]/30 rounded-md px-3 py-2 text-[#ff6600] bg-[#333333] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                  placeholder={t('stratas.namePlaceholder') || 'Enter strata name'}
                  required
                />
              </div>

              <div>
                <label className="block text-[#ff6600] text-sm font-bold mb-2" htmlFor="description">
                  {t('stratas.description') || 'Description'}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border border-[#ff6600]/30 rounded-md px-3 py-2 text-[#ff6600] bg-[#333333] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                  placeholder={
                    t('stratas.descriptionPlaceholder') || 'Enter strata description (optional)'
                  }
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-[#ff6600] text-sm font-bold mb-2">
                  {t('stratas.configureTools') || 'Configure Servers and Tools'}
                </label>
                <ServerToolConfig
                  servers={availableServers}
                  value={formData.servers as IGroupServerConfig[]}
                  onChange={(servers) => setFormData((prev) => ({ ...prev, servers }))}
                  className="border border-[#ff6600]/30 rounded-lg p-4 bg-[#333333]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 p-6 pt-4 border-t border-[#ff6600]/30 flex-shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-[#ff6600] hover:text-[#ff6600] border border-[#ff6600]/30 rounded-md hover:bg-[#333333] transition-colors"
              disabled={isSubmitting}
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#ff6600] text-black rounded-md hover:bg-[#cc5200] disabled:opacity-50 transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('common.submitting') || 'Creating...' : t('common.create') || 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStrataForm;
