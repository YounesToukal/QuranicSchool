import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useTranslation } from 'react-i18next';
import { LogOut, User, Sun, Moon, BookOpen, HelpCircle, BookMarked } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-primary text-white shadow-xl sticky top-0 z-50 border-b-2 border-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-secondary via-secondary to-amber-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-secondary/40 group-hover:ring-secondary/70 transition-all duration-300">
                <BookOpen className="w-6 h-6 text-primary" strokeWidth={2.5} />
              </div>
              {/* Decorative corner accent */}
              <div className="absolute -top-0.5 -end-0.5 w-3 h-3 bg-secondary/60 rounded-full blur-sm"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight group-hover:text-secondary transition-colors duration-200">
                {t('app.name')}
              </h1>
              <p className="text-[10px] sm:text-xs text-white/70 tracking-wide">{t('app.tagline')}</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Parent dashboard guide — only for parents */}
            {user?.role === 'parent' && (
              <Link
                to="/parent-guide"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/70 hover:text-secondary hover:bg-white/10 transition-all text-sm border border-transparent hover:border-white/15"
              >
                <BookMarked className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {i18n.language === 'ar' ? 'دليل لوحتك' : 'Mon guide'}
                </span>
              </Link>
            )}

            {/* Admin dashboard guide — only for admins */}
            {user?.role === 'admin' && (
              <Link
                to="/admin-guide"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/70 hover:text-secondary hover:bg-white/10 transition-all text-sm border border-transparent hover:border-white/15"
              >
                <BookMarked className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {i18n.language === 'ar' ? 'دليل لوحتك' : 'Mon guide'}
                </span>
              </Link>
            )}

            {/* Teacher dashboard guide — only for teachers */}
            {user?.role === 'teacher' && (
              <Link
                to="/teacher-guide"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/70 hover:text-secondary hover:bg-white/10 transition-all text-sm border border-transparent hover:border-white/15"
              >
                <BookMarked className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {i18n.language === 'ar' ? 'دليل لوحتك' : 'Mon guide'}
                </span>
              </Link>
            )}

            {/* Guide link — visible to all */}
            <Link
              to="/guide"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/70 hover:text-secondary hover:bg-white/10 transition-all text-sm border border-transparent hover:border-white/15"
              title={t('common.guide')}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{t('common.guide')}</span>
            </Link>
            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 hover:bg-white/15 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ring-1 ring-white/10 hover:ring-white/20"
              aria-label={theme === 'dark' ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
              title={theme === 'dark' ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </button>
            
            {/* User Info & Logout */}
            {user && (
              <div className="flex items-center gap-2 sm:gap-3 ms-1 sm:ms-2 ps-2 sm:ps-3 border-s border-white/20">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/15 transition-colors">
                  <div className="w-7 h-7 bg-secondary rounded-full flex items-center justify-center text-primary">
                    <User className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold leading-tight">{user.name}</span>
                    <span className="text-[10px] text-white/60 leading-tight">{t(`common.${user.role}`)}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 sm:p-2.5 hover:bg-red-500/20 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ring-1 ring-white/10 hover:ring-red-400/30 group"
                  aria-label={t('common.logout')}
                  title={t('common.logout')}
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5 group-hover:text-red-300 transition-colors" />
                </button>
              </div>
            )}

            {/* Mobile Language Switcher */}
            <div className="sm:hidden">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle decorative bottom accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent"></div>
    </header>
  );
}
