import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import Header from '@/components/common/Header';
import { Phone, ArrowRight, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [loginType, setLoginType] = useState<'otp' | 'email'>('otp');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNotFound, setPhoneNotFound] = useState(false);

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPhoneNotFound(false);

    try {
      const response = await authApi.phoneLogin(phone);
      const { token, user } = response.data;
      login(token);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher');
      else navigate('/parent');
    } catch (err: any) {
      const msg = err.response?.data?.message || t('auth.errorSending');
      setError(msg);
      if (err.response?.status === 404 || msg.includes('غير مسجل')) {
        setPhoneNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login({ email, password });
      const { token, user } = response.data;
      
      login(token);
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/parent');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="card">
            <h2 className="text-2xl font-bold text-center text-primary mb-6">
              {t('auth.loginTitle')}
            </h2>

            {/* Login Type Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setLoginType('otp')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  loginType === 'otp'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('common.parent')}
              </button>
              <button
                type="button"
                onClick={() => setLoginType('email')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  loginType === 'email'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('common.admin')} / {t('common.teacher')}
              </button>
            </div>

            {loginType === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field ps-10"
                      placeholder="admin@qurandec.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field ps-10"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? t('common.loading') : t('common.login')}
                  <ArrowRight className="w-5 h-5 ms-2 inline rtl:rotate-180" />
                </button>
              </form>
            ) : (
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.phoneNumber')}
                  </label>
                  <div className="relative">
                    <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field ps-10 font-mono tracking-widest"
                      placeholder="0XXXXXXXXX"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                    {phoneNotFound && (
                      <button
                        type="button"
                        onClick={() => navigate('/recovery')}
                        className="block mt-2 text-primary font-semibold underline text-sm"
                      >
                        {t('auth.wrongPhoneLink')}
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? t('common.loading') : t('common.login')}
                  <ArrowRight className="w-5 h-5 ms-2 inline rtl:rotate-180" />
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => navigate('/recovery')}
                    className="text-sm text-gray-500 hover:text-primary transition-colors"
                  >
                    {t('auth.wrongPhoneLink')}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('auth.noAccount')}{' '}
                <button 
                  onClick={() => navigate('/register')}
                  className="text-primary font-semibold hover:underline"
                >
                  {t('auth.registerChild')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
