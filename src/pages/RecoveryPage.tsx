import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registrationApi, messageApi } from '@/lib/api';
import Header from '@/components/common/Header';
import { Phone, User, ArrowRight, AlertCircle, ArrowLeft, BookOpen, Send } from 'lucide-react';

const ALGERIAN_PHONE_REGEX = /^0[567]\d{8}$/;
const ARABIC_TEXT_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/;
const validateAlgerianPhone = (phone: string) => ALGERIAN_PHONE_REGEX.test(phone.replace(/\s/g, ''));
const validateArabic = (text: string) => text.trim().length > 0 && ARABIC_TEXT_REGEX.test(text.trim());

export default function RecoveryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    childName: '',
    newPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = t('registration.errorNameRequired');
    else if (!validateArabic(formData.fullName)) errors.fullName = t('registration.errorArabicRequired');
    if (!formData.childName.trim()) errors.childName = t('registration.errorNameRequired');
    else if (!validateArabic(formData.childName)) errors.childName = t('registration.errorArabicRequired');
    const cleanNew = formData.newPhone.replace(/\s/g, '');
    if (!cleanNew) errors.newPhone = t('registration.errorPhoneRequired');
    else if (!validateAlgerianPhone(cleanNew)) errors.newPhone = t('registration.errorInvalidPhone');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      await registrationApi.submitRecovery({
        requestType: 'wrong_number',
        requesterName: formData.fullName.trim(),
        childNameForLookup: formData.childName.trim(),
        newPhone: formData.newPhone.replace(/\s/g, ''),
      });
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.data?.notFound) {
        setNotFound(true);
      } else {
        setError(err.response?.data?.message || t('registration.errorRecovery'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (notFound) {
    const handleContactSubmit = async () => {
      if (!contactMsg.trim()) return;
      setContactLoading(true);
      try {
        await messageApi.sendPublicMessage({
          senderName: formData.fullName.trim() || 'زائر',          subject: 'طلب مساعدة — رقم غير معروف',          message: `معلومات البحث:\nاسم ولي الأمر: ${formData.fullName}\nاسم الطفل: ${formData.childName}\nالرقم الجديد المطلوب: ${formData.newPhone}\nالبريد الإلكتروني للرد: ${contactEmail.trim() || 'غير محدد'}\n\nرسالة إضافية:\n${contactMsg}`,
        });
        setContactSent(true);
      } catch {
        // ignore — still show optimistic success
        setContactSent(true);
      } finally {
        setContactLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <div className="card" dir="rtl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">لم يُعثر على سجل لهذا الحساب</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  لم نتمكن من إيجاد أي سجل مرتبط بالمعلومات التي أدخلتها.
                  <br />
                  <span className="text-xs text-gray-400 mt-1 inline-block">
                    تأكد من كتابة الاسم بالضبط كما سُجِّل، بما في ذلك اسم العائلة.
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => { setNotFound(false); setShowContactForm(false); setContactSent(false); setContactMsg(''); setContactEmail(''); }}
                  className="btn-primary w-full"
                >
                  المحاولة مجدداً
                </button>

                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-2.5 px-4 border border-primary/30 text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors text-sm"
                >
                  تسجيل طفلي من جديد
                </button>

                {/* Inline contact admin */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowContactForm(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">التواصل مع الإدارة</span>
                    <span className="text-xs text-gray-400">{showContactForm ? '▲' : '▼'}</span>
                  </button>

                  {showContactForm && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                      {contactSent ? (
                        <div className="text-center py-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600 font-medium">تم إرسال رسالتك</p>
                          <p className="text-xs text-gray-400 mt-1">ستتلقى رداً من الإدارة في أقرب وقت.</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                            إذا كنت واثقاً من صحة المعلومات، أرسل رسالة للإدارة. أضف بريدك الإلكتروني حتى نتمكن من التواصل معك.
                          </p>
                          <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="input-field text-sm mb-2"
                            placeholder="بريدك الإلكتروني للرد عليك (اختياري)"
                            dir="ltr"
                          />
                          <textarea
                            value={contactMsg}
                            onChange={(e) => setContactMsg(e.target.value)}
                            rows={3}
                            className="input-field text-sm resize-none"
                            placeholder="مثال: أنا مسجّل بالفعل لكن هناك خطأ في رقم الهاتف..."
                            dir="rtl"
                          />
                          <button
                            type="button"
                            onClick={handleContactSubmit}
                            disabled={contactLoading || !contactMsg.trim()}
                            className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                          >
                            {contactLoading ? '...' : <><Send className="w-3.5 h-3.5" /> إرسال</>}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <div className="card text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-primary mb-3">{t('registration.recoverySuccessTitle')}</h2>
              <p className="text-gray-600 mb-6 text-sm">{t('registration.recoverySuccessMessage')}</p>
              <button onClick={() => navigate('/login')} className="btn-primary">{t('registration.backToLogin')}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="card">
            {/* Back link */}
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {t('registration.backToLogin')}
            </button>

            <h2 className="text-2xl font-bold text-primary mb-1" dir="rtl">{t('registration.recoveryTitle')}</h2>
            <p className="text-sm text-gray-500 mb-6" dir="rtl">{t('registration.recoveryDesc')}</p>

            <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">

              {/* Full name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('registration.yourFullName')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => { setFormData({ ...formData, fullName: e.target.value }); setFieldErrors({ ...fieldErrors, fullName: '' }); }}
                    className={`input-field ps-9 ${fieldErrors.fullName ? 'border-red-400' : ''}`}
                    placeholder={t('registration.parentNamePlaceholder')}
                    dir="rtl"
                  />
                </div>
                {fieldErrors.fullName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.fullName}</p>}
              </div>

              {/* Child name lookup */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('registration.childLookupName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.childName}
                  onChange={(e) => { setFormData({ ...formData, childName: e.target.value }); setFieldErrors({ ...fieldErrors, childName: '' }); }}
                  className={`input-field ${fieldErrors.childName ? 'border-red-400' : ''}`}
                  placeholder={t('registration.childLookupPlaceholder')}
                  dir="rtl"
                />
                {fieldErrors.childName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.childName}</p>}
                <p className="text-xs text-gray-400 mt-1">{t('registration.childLookupHint')}</p>
              </div>

              {/* New correct phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('registration.newPhoneCorrect')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.newPhone}
                    onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, '').slice(0, 10); setFormData({ ...formData, newPhone: v }); setFieldErrors({ ...fieldErrors, newPhone: '' }); }}
                    className={`input-field ps-9 font-mono tracking-widest ${fieldErrors.newPhone ? 'border-red-400' : ''}`}
                    placeholder="0XXXXXXXXX"
                    maxLength={10}
                    dir="ltr"
                  />
                </div>
                {fieldErrors.newPhone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.newPhone}</p>}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? t('common.loading') : t('registration.sendRecovery')}
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
