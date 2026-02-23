import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registrationApi, classApi } from '@/lib/api';
import type { Class } from '@/types';
import Header from '@/components/common/Header';
import { Phone, User, ArrowRight, Plus, X, AlertCircle, Lock } from 'lucide-react';

interface Child {
  firstName: string;
  classId: number | '';
}

const ALGERIAN_PHONE_REGEX = /^0[567]\d{8}$/;
const ARABIC_TEXT_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/;

const validateAlgerianPhone = (phone: string) =>
  ALGERIAN_PHONE_REGEX.test(phone.replace(/\s/g, ''));

const validateArabic = (text: string) =>
  text.trim().length > 0 && ARABIC_TEXT_REGEX.test(text.trim());

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    parentFirstName: '',
    parentFamilyName: '',
    parentPhone: '',
    children: [{ firstName: '', classId: '' as number | '' }] as Child[],
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPhoneConfirm, setShowPhoneConfirm] = useState(false);
  const [confirmPhone, setConfirmPhone] = useState('');
  const [phoneConfirmError, setPhoneConfirmError] = useState('');

  useEffect(() => { loadClasses(); }, []);

  const loadClasses = async () => {
    try {
      const response = await classApi.getPublic();
      setClasses(response.data);
    } catch {
      console.error('Failed to load classes');
    }
  };

  const addChild = () => {
    setFormData({ ...formData, children: [...formData.children, { firstName: '', classId: '' }] });
  };

  const removeChild = (index: number) => {
    if (formData.children.length > 1)
      setFormData({ ...formData, children: formData.children.filter((_, i) => i !== index) });
  };

  const updateChild = (index: number, field: keyof Child, value: string | number) => {
    const updated = [...formData.children];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, children: updated });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.parentFirstName.trim()) errors.parentFirstName = t('registration.errorNameRequired');
    else if (!validateArabic(formData.parentFirstName)) errors.parentFirstName = t('registration.errorArabicRequired');
    if (!formData.parentFamilyName.trim()) errors.parentFamilyName = t('registration.errorNameRequired');
    else if (!validateArabic(formData.parentFamilyName)) errors.parentFamilyName = t('registration.errorArabicRequired');
    const cleanPhone = formData.parentPhone.replace(/\s/g, '');
    if (!cleanPhone) errors.parentPhone = t('registration.errorPhoneRequired');
    else if (!validateAlgerianPhone(cleanPhone)) errors.parentPhone = t('registration.errorInvalidPhone');
    formData.children.forEach((child, i) => {
      if (!child.firstName.trim()) errors[`child_${i}_firstName`] = t('registration.errorNameRequired');
      else if (!validateArabic(child.firstName)) errors[`child_${i}_firstName`] = t('registration.errorArabicRequired');
      if (!child.classId) errors[`child_${i}_classId`] = t('registration.errorClassRequired');
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowPhoneConfirm(true);
    setConfirmPhone('');
    setPhoneConfirmError('');
  };

  const handlePhoneConfirm = async () => {
    if (confirmPhone.replace(/\s/g, '') !== formData.parentPhone.replace(/\s/g, '')) {
      setPhoneConfirmError(t('registration.errorPhoneMismatch'));
      return;
    }
    setShowPhoneConfirm(false);
    await submitRegistration();
  };

  const submitRegistration = async () => {
    setLoading(true);
    setError('');
    const parentName = `${formData.parentFirstName.trim()} ${formData.parentFamilyName.trim()}`;
    try {
      await Promise.all(formData.children.map(child =>
        registrationApi.create({
          parentName,
          parentPhone: formData.parentPhone.replace(/\s/g, ''),
          childFirstName: child.firstName,
          childLastName: formData.parentFamilyName.trim(),
          classId: child.classId,
        })
      ));
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || t('registration.errorRegistering'));
    } finally {
      setLoading(false);
    }
  };

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
              <h2 className="text-2xl font-bold text-primary mb-3">{t('registration.successTitle')}</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-right" dir="rtl">
                <p className="text-amber-800 font-medium text-sm leading-relaxed">{t('registration.reviewNotice')}</p>
              </div>
              <p className="text-gray-600 mb-6 text-sm">{t('registration.successMessage')}</p>
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

      {showPhoneConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2 text-right" dir="rtl">{t('registration.confirmPhoneTitle')}</h3>
            <p className="text-sm text-gray-500 mb-4 text-right" dir="rtl">{t('registration.confirmPhoneDesc')}</p>
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center font-mono text-lg tracking-widest text-gray-700">
              {formData.parentPhone}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right" dir="rtl">{t('registration.reEnterPhone')}</label>
              <input type="tel" value={confirmPhone} onChange={(e) => { setConfirmPhone(e.target.value); setPhoneConfirmError(''); }}
                className="input-field text-center font-mono tracking-widest" placeholder="0XXXXXXXXX" maxLength={10} dir="ltr" />
              {phoneConfirmError && <p className="text-red-500 text-xs mt-1 text-right" dir="rtl">{phoneConfirmError}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPhoneConfirm(false)} className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handlePhoneConfirm} disabled={loading} className="flex-1 btn-primary py-2">
                {loading ? t('common.loading') : t('registration.confirmAndSend')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <div className="card">
            <h2 className="text-2xl font-bold text-center text-primary mb-1">{t('registration.title')}</h2>
            <p className="text-center text-xs text-gray-400 mb-4">{t('registration.arabicNamesNotice')}</p>

            {/* One-account notice */}
            <div className="mb-5 px-4 py-3 rounded-xl border border-secondary/20 bg-secondary/6 text-center" dir="rtl">
              <p className="text-xs text-secondary/90 leading-relaxed">
                {t('registration.oneAccountNote')}
              </p>
            </div>

            <form onSubmit={handleSubmitClick} className="space-y-4" dir="rtl">

              {/* Parent name: two fields side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registration.parentFirstName')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={formData.parentFirstName}
                      onChange={(e) => { setFormData({ ...formData, parentFirstName: e.target.value }); if (fieldErrors.parentFirstName) setFieldErrors({ ...fieldErrors, parentFirstName: '' }); }}
                      className={`input-field ps-9 text-sm ${fieldErrors.parentFirstName ? 'border-red-400' : ''}`}
                      placeholder={t('registration.firstNamePlaceholder')} dir="rtl" />
                  </div>
                  {fieldErrors.parentFirstName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.parentFirstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registration.parentFamilyName')} <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.parentFamilyName}
                    onChange={(e) => { setFormData({ ...formData, parentFamilyName: e.target.value }); if (fieldErrors.parentFamilyName) setFieldErrors({ ...fieldErrors, parentFamilyName: '' }); }}
                    className={`input-field text-sm ${fieldErrors.parentFamilyName ? 'border-red-400' : ''}`}
                    placeholder={t('registration.familyNamePlaceholder')} dir="rtl" />
                  {fieldErrors.parentFamilyName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.parentFamilyName}</p>}
                  {formData.parentFamilyName && !fieldErrors.parentFamilyName && (
                    <p className="text-xs text-primary/70 mt-1">{t('registration.familyNameHint')}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('registration.parentPhone')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" value={formData.parentPhone}
                    onChange={(e) => { const val = e.target.value.replace(/[^\d]/g, '').slice(0, 10); setFormData({ ...formData, parentPhone: val }); if (fieldErrors.parentPhone) setFieldErrors({ ...fieldErrors, parentPhone: '' }); }}
                    className={`input-field ps-9 font-mono tracking-widest ${fieldErrors.parentPhone ? 'border-red-400' : ''}`}
                    placeholder="0XXXXXXXXX" maxLength={10} dir="ltr" />
                </div>
                {fieldErrors.parentPhone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.parentPhone}</p>}
              </div>

              {/* Children */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">{t('registration.children')}</label>
                  {formData.children.length < 5 && (
                    <button type="button" onClick={addChild} className="text-sm text-primary font-semibold hover:text-primary/80 flex items-center gap-1">
                      <Plus className="w-4 h-4" />{t('registration.addChild')}
                    </button>
                  )}
                </div>

                {formData.children.map((child, index) => (
                  <div key={index} className="mb-3 p-4 bg-gray-50 rounded-xl border border-gray-200 relative">
                    {formData.children.length > 1 && (
                      <button type="button" onClick={() => removeChild(index)} className="absolute top-2 start-2 text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <div className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">{t('registration.child')} {index + 1}</div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('registration.childFirstName')} *</label>
                        <input type="text" value={child.firstName}
                          onChange={(e) => updateChild(index, 'firstName', e.target.value)}
                          className={`input-field text-sm ${fieldErrors[`child_${index}_firstName`] ? 'border-red-400' : ''}`}
                          placeholder={t('registration.childFirstNamePlaceholder')} dir="rtl" />
                        {fieldErrors[`child_${index}_firstName`] && <p className="text-red-500 text-xs mt-1">{fieldErrors[`child_${index}_firstName`]}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                          {t('registration.childLastName')} <Lock className="w-3 h-3 text-gray-400" />
                        </label>
                        <input type="text" value={formData.parentFamilyName || '\u2014'} readOnly tabIndex={-1}
                          className="input-field text-sm bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" dir="rtl" />
                        <p className="text-xs text-gray-400 mt-0.5">{t('registration.autoFilled')}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('registration.selectClass')} *</label>
                      <select value={child.classId} onChange={(e) => updateChild(index, 'classId', Number(e.target.value))}
                        className={`input-field text-sm ${fieldErrors[`child_${index}_classId`] ? 'border-red-400' : ''}`} dir="rtl">
                        <option value="">{t('registration.chooseClass')}</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      {fieldErrors[`child_${index}_classId`] && <p className="text-red-500 text-xs mt-1">{fieldErrors[`child_${index}_classId`]}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? t('common.loading') : t('registration.submit')}
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('auth.hasAccount')}{' '}
                <a href="/login" className="text-primary font-semibold hover:underline">{t('common.login')}</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
