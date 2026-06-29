import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { messageApi } from '@/lib/api';
import { MessageCircle, X, Send } from 'lucide-react';

const MESSAGE_TYPES = [
  { value: 'inquiry',    labelAr: 'استفسار',   labelFr: "Demande d'informations" },
  { value: 'suggestion', labelAr: 'اقتراح',    labelFr: 'Suggestion' },
  { value: 'complaint',  labelAr: 'شكوى',      labelFr: 'Réclamation' },
  { value: 'tech',       labelAr: 'دعم تقني',  labelFr: 'Assistance technique' },
];

export default function ContactAdminButton() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'form' | 'sent'>('form');
  const [messageType, setMessageType] = useState('inquiry');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setShowModal(false);
    document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) closeModal();
    };
    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setStep('form');
      setMessageType('inquiry');
      setSubject('');
      setMessage('');
      setReplyEmail('');
      setError('');
      setLoading(false);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError(t('common.fillAllFields'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const typeLabel = MESSAGE_TYPES.find(m => m.value === messageType);
      const fullSubject = `[${isAr ? typeLabel?.labelAr : typeLabel?.labelFr}] ${subject.trim()}`;
      await messageApi.sendMessage({
        subject: fullSubject,
        message: message.trim(),
        replyEmail: replyEmail.trim() || undefined,
        messageType,
      });
      setStep('sent');
    } catch {
      setError(t('common.errorSendingMessage'));
    } finally {
      setLoading(false);
    }
  };

  const isTech = messageType === 'tech';

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 end-6 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 z-[100] ring-2 ring-secondary/30 hover:ring-secondary/60"
        title={t('common.contactAdminTitle')}
        aria-label={t('common.contactAdminTitle')}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[200] p-0 sm:p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
            dir={isAr ? 'rtl' : 'ltr'}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-primary px-5 pt-5 pb-4">
              <div className="flex items-center justify-center gap-1.5 mb-3 opacity-30">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className={`rounded-full bg-secondary ${i === 3 ? 'w-2 h-2' : 'w-1.5 h-1.5 opacity-60'}`} />
                ))}
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-secondary font-semibold text-[11px] uppercase tracking-widest mb-0.5">
                    {t('app.name')}
                  </p>
                  <h3 className="text-white text-lg font-bold leading-tight">
                    {t('common.contactAdminTitle')}
                  </h3>
                </div>
                <button onClick={closeModal} className="text-white/50 hover:text-white transition-colors mt-0.5">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {step === 'sent' ? (
              <div className="px-6 py-10 text-center" dir={isAr ? 'rtl' : 'ltr'}>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="h-px w-12 bg-secondary/30" />
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rotate-45 bg-secondary opacity-60" />
                    <div className="w-2 h-2 rotate-45 bg-secondary" />
                    <div className="w-1.5 h-1.5 rotate-45 bg-secondary opacity-60" />
                  </div>
                  <div className="h-px w-12 bg-secondary/30" />
                </div>
                <p className="text-primary font-bold text-lg mb-2">
                  {isAr ? 'وصلت رسالتك' : 'Message transmis'}
                </p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {isAr
                    ? 'سيطّلع عليها المسؤول وسيُردّ عليك في أقرب وقت ممكن.'
                    : "L'administration a bien reçu votre message et vous répondra dans les meilleurs délais."}
                </p>
                {replyEmail && (
                  <p className="text-xs text-gray-400 mt-2">
                    {isAr ? `سيصلك الرد على: ${replyEmail}` : `Réponse attendue sur : ${replyEmail}`}
                  </p>
                )}
                <button
                  onClick={closeModal}
                  className="mt-6 px-8 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm"
                >
                  {t('common.close')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
                {/* Message type pills */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {t('common.messageType')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {MESSAGE_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setMessageType(type.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          messageType === type.value
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/40'
                        }`}
                      >
                        {isAr ? type.labelAr : type.labelFr}
                      </button>
                    ))}
                  </div>
                  {isTech && (
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      {isAr
                        ? 'سيتم توجيه رسالتك إلى الفريق التقني المختص.'
                        : "Votre message sera acheminé à l'équipe technique."}
                    </p>
                  )}
                </div>

                {/* Arabesque divider */}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-100" />
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rotate-45 bg-secondary/40" />
                    <div className="w-1.5 h-1.5 rotate-45 bg-secondary/60" />
                    <div className="w-1 h-1 rotate-45 bg-secondary/40" />
                  </div>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('common.subject')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm outline-none transition"
                    placeholder={t('common.subjectPlaceholder')}
                    maxLength={200}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('common.message')} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm outline-none transition resize-none"
                    rows={4}
                    placeholder={t('common.yourMessage')}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('common.replyEmail')}
                  </label>
                  <input
                    type="email"
                    value={replyEmail}
                    onChange={e => setReplyEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm outline-none transition"
                    placeholder={t('common.replyEmailPlaceholder')}
                    dir="ltr"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">{t('common.replyEmailNote')}</p>
                </div>

                {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="animate-pulse">{t('common.sendingMessage')}</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t('common.send')}
                      </>
                    )}
                  </button>
                </div>

                {/* Platform credit — subtle footer */}
                <p className="text-center text-[10px] text-gray-300 pt-1 border-t border-gray-100">
                  {isAr
                    ? 'المنصة القرآنية الرقمية · تطوير وتقنية متخصصة'
                    : 'Plateforme coranique numérique · Développement spécialisé'}
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
