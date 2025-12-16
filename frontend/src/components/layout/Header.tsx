import React from 'react';
import { useTranslation } from 'react-i18next';
import ThemeSwitch from '@/components/ui/ThemeSwitch';
import LanguageSwitch from '@/components/ui/LanguageSwitch';
import GitHubIcon from '@/components/icons/GitHubIcon';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { t } = useTranslation();

  return (
    <header className="bg-[#000000] dark:bg-[#000000] shadow-sm z-10 border-b border-[#ff6600]/30">
      <div className="flex justify-between items-center px-3 py-3">
        <div className="flex items-center">
          {/* 侧边栏切换按钮 */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md text-[#ff6600] dark:text-[#ff6600] hover:text-[#ff6600] dark:hover:text-[#ff6600] hover:bg-[#333333] dark:hover:bg-[#333333] focus:outline-none"
            aria-label={t('app.toggleSidebar')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* 应用标题 */}
          <h1 className="ml-4 text-xl font-bold text-[#ff6600] dark:text-[#ff6600]">{t('app.title')}</h1>
        </div>

        {/* Theme Switch and Language Switcher and Version */}
        <div className="flex items-center space-x-1">
          <span className="text-sm text-[#ff6600]/70 dark:text-[#ff6600]/70 mr-2">
            {import.meta.env.PACKAGE_VERSION === 'dev'
              ? import.meta.env.PACKAGE_VERSION
              : `v${import.meta.env.PACKAGE_VERSION}`}
          </span>

          <a
            href="https://github.com/samanhappy/mcphub"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md text-[#ff6600] dark:text-[#ff6600] hover:text-[#ff6600] dark:hover:text-[#ff6600] hover:bg-[#333333] dark:hover:bg-[#333333]"
            aria-label="GitHub Repository"
          >
            <GitHubIcon className="h-5 w-5" />
          </a>
          <ThemeSwitch />
          <LanguageSwitch />
        </div>
      </div>
    </header>
  );
};

export default Header;