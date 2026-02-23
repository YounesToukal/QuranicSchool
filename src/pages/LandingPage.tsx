import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/common/Header';
import { rankingApi, classApi, messageApi } from '@/lib/api';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { ArrowRight, MapPin, MessageCircle, Send, X } from 'lucide-react';

const ARABIC_NUMERALS = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠'];

const VISITOR_TYPES = [
  { value: 'inquiry',    labelAr: 'استفسار',   labelFr: "Demande d'informations" },
  { value: 'suggestion', labelAr: 'اقتراح',    labelFr: 'Suggestion' },
  { value: 'complaint',  labelAr: 'شكوى',      labelFr: 'Réclamation' },
  { value: 'tech',       labelAr: 'دعم تقني',  labelFr: 'Assistance technique' },
];

const MEDAL_STYLES: { ring: string; badge: string; isMedal: boolean }[] = [
  { isMedal: true,  ring: 'ring-1 ring-amber-300/60',  badge: 'bg-gradient-to-br from-amber-300 to-yellow-600 shadow-sm shadow-amber-300/50' },
  { isMedal: true,  ring: 'ring-1 ring-slate-300/60',  badge: 'bg-gradient-to-br from-slate-300 to-slate-500 shadow-sm shadow-slate-300/50' },
  { isMedal: true,  ring: 'ring-1 ring-orange-300/60', badge: 'bg-gradient-to-br from-orange-300 to-amber-700 shadow-sm shadow-orange-300/50' },
  { isMedal: false, ring: '', badge: '' },
  { isMedal: false, ring: '', badge: '' },
  { isMedal: false, ring: '', badge: '' },
  { isMedal: false, ring: '', badge: '' },
  { isMedal: false, ring: '', badge: '' },
  { isMedal: false, ring: '', badge: '' },
  { isMedal: false, ring: '', badge: '' },
];

function CardDivider({ accentBg, isDark }: { accentBg: string; isDark: boolean }) {
  return (
    <div className="flex items-center gap-2 px-6 my-3">
      <div className={`flex-1 h-px ${isDark ? 'bg-white/20' : 'bg-secondary/20'}`} />
      <div className="flex items-center gap-1">
        <div className={`w-[5px] h-[5px] rotate-45 ${accentBg} ${isDark ? 'opacity-60' : 'opacity-40'}`} />
        <div className={`w-2 h-2 rotate-45 ${accentBg} ${isDark ? 'opacity-80' : 'opacity-65'}`} />
        <div className={`w-[5px] h-[5px] rotate-45 ${accentBg} ${isDark ? 'opacity-60' : 'opacity-40'}`} />
      </div>
      <div className={`flex-1 h-px ${isDark ? 'bg-white/20' : 'bg-secondary/20'}`} />
    </div>
  );
}

function LeaderboardCard({
  arabicTitle,
  title,
  subtitle,
  students,
  accentText,
  accentBg,
  topBorder,
  pointsColor,
  isDark,
  pointsLabel,
  halaqahLabel,
  noRankingLabel,
}: {
  arabicTitle: string;
  title: string;
  subtitle: string;
  students: any[];
  accentText: string;
  accentBg: string;
  topBorder: string;
  pointsColor: string;
  isDark: boolean;
  pointsLabel: string;
  halaqahLabel: string;
  noRankingLabel: string;
}) {
  return (
    <div className={`relative rounded-xl overflow-hidden shadow-lg ${
      isDark 
        ? 'bg-[#1a3f41]/95 backdrop-blur-sm border border-secondary/30' 
        : 'bg-white/96 backdrop-blur-sm border border-secondary/20'
    } ${topBorder}`}>
      {/* Header */}
      <div className="relative px-6 pt-6 pb-3 text-center">
        <p className={`font-amiri text-3xl leading-snug ${
          isDark ? 'text-[#d4c19c]' : accentText
        }`}>{arabicTitle}</p>
        <p className={`font-montserrat text-[10px] font-semibold uppercase tracking-[0.22em] mt-1 ${
          isDark ? 'text-white/50' : 'text-gray-400'
        }`}>{title}</p>
        <p className={`text-[11px] mt-0.5 ${
          isDark ? 'text-white/40' : 'text-gray-400'
        }`}>{subtitle}</p>
      </div>

      <CardDivider accentBg={accentBg} isDark={isDark} />

      {/* Entries */}
      <div className="px-4 pb-5 space-y-2">
        {students.length > 0 ? (
          students.map((student, idx) => {
            const style = MEDAL_STYLES[idx] ?? MEDAL_STYLES[9];
            return (
              <div
                key={student.studentId}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isDark
                    ? idx === 0
                      ? `bg-secondary/15 ${style.ring} ring-opacity-40`
                      : 'bg-white/5 hover:bg-white/10'
                    : idx === 0
                      ? `bg-gradient-to-r from-secondary/10 via-secondary/5 to-transparent ${style.ring}`
                      : 'bg-gray-50/80 hover:bg-secondary/5'
                }`}
              >
                {style.isMedal ? (
                  <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-amiri font-bold text-white text-base leading-none ${style.badge}`}>
                    {ARABIC_NUMERALS[idx]}
                  </div>
                ) : (
                  <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-amiri text-sm leading-none border ${
                    isDark ? 'border-white/20 text-white/40' : 'border-secondary/25 text-gray-400'
                  }`}>
                    {ARABIC_NUMERALS[idx]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate leading-tight ${
                    isDark ? 'text-[#e8dcc8]' : 'text-gray-800'
                  }`}>{student.studentName}</p>
                  <p className={`text-[11px] truncate mt-0.5 ${
                    isDark ? 'text-white/45' : 'text-gray-400'
                  }`}>{student.className || halaqahLabel}</p>
                </div>
                <div className="text-end tabular-nums">
                  <span className={`text-base font-bold ${
                    isDark ? 'text-[#d4c19c]' : pointsColor
                  }`}>{student.points.toLocaleString()}</span>
                  <span className={`block text-[10px] font-normal leading-none ${
                    isDark ? 'text-white/40' : 'text-gray-400'
                  }`}>{pointsLabel}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center">
            <p className={`text-xs ${
              isDark ? 'text-white/40' : 'text-gray-400'
            }`}>{noRankingLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { isAuthenticated, user } = useAuthStore();
  const isDark = theme === 'dark';

  const [allHifz, setAllHifz]       = useState<any[]>([]);
  const [allTalqin, setAllTalqin]   = useState<any[]>([]);
  const [classes, setClasses]       = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Visitor contact form
  const [showVisitorContact, setShowVisitorContact] = useState(false);
  const [visitorStep, setVisitorStep]     = useState<'form' | 'sent'>('form');
  const [visitorName, setVisitorName]     = useState('');
  const [visitorType, setVisitorType]     = useState('inquiry');
  const [visitorSubject, setVisitorSubject] = useState('');
  const [visitorMessage, setVisitorMessage] = useState('');
  const [visitorEmail, setVisitorEmail]   = useState('');
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [visitorError, setVisitorError]   = useState('');

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'teacher':
          navigate('/teacher');
          break;
        case 'parent':
          navigate('/parent');
          break;
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    loadTopRankings();
    classApi.getPublic().then(res => setClasses(res.data)).catch(() => {});
    const interval = setInterval(loadTopRankings, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTopRankings = async () => {
    try {
      const [hifzRes, talqinRes] = await Promise.all([
        rankingApi.getGlobal('monthly', 'hifz'),
        rankingApi.getGlobal('monthly', 'talqin'),
      ]);
      setAllHifz(hifzRes.data);
      setAllTalqin(talqinRes.data);
    } catch (error) {
      console.error('Failed to load rankings:', error);
    }
  };

  const topHifz = (selectedClassId
    ? allHifz.filter(s => s.classId === selectedClassId)
    : allHifz
  ).slice(0, 10);

  const topTalqin = (selectedClassId
    ? allTalqin.filter(s => s.classId === selectedClassId)
    : allTalqin
  ).slice(0, 10);

  const closeVisitorContact = () => {
    setShowVisitorContact(false);
    setTimeout(() => {
      setVisitorStep('form'); setVisitorName(''); setVisitorType('inquiry');
      setVisitorSubject(''); setVisitorMessage(''); setVisitorEmail('');
      setVisitorLoading(false); setVisitorError('');
    }, 300);
  };

  const handleVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorMessage.trim()) {
      setVisitorError(isAr ? 'الاسم والرسالة مطلوبان' : 'Le nom et le message sont obligatoires');
      return;
    }
    setVisitorLoading(true);
    setVisitorError('');
    try {
      const typeLabel = VISITOR_TYPES.find(m => m.value === visitorType);
      const labelPrefix = isAr ? typeLabel?.labelAr : typeLabel?.labelFr;
      const finalSubject = visitorSubject.trim()
        ? `[${labelPrefix}] ${visitorSubject.trim()}`
        : `[${labelPrefix}]`;
      await messageApi.sendPublicMessage({
        senderName: visitorName.trim(),
        subject: finalSubject,
        message: visitorMessage.trim(),
        replyEmail: visitorEmail.trim() || undefined,
        messageType: visitorType,
      });
      setVisitorStep('sent');
    } catch {
      setVisitorError(isAr ? 'حدث خطأ، يُرجى المحاولة مجددًا' : 'Une erreur est survenue, veuillez réessayer');
    } finally {
      setVisitorLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className={`relative overflow-hidden ${
        isDark ? 'bg-[#1e4a4c]' : 'bg-[#FEFBF6]'
      }`}>
        <div className="relative container mx-auto px-4 pt-14 pb-16 md:pt-20 md:pb-24">
          <div className="max-w-xl mx-auto text-center space-y-6">
            {/* Basmala */}
            <div>
              <p className={`font-amiri text-2xl tracking-widest leading-relaxed ${isDark ? 'text-secondary/80' : 'text-secondary/70'}`}>
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className={`h-px w-12 ${isDark ? 'bg-secondary/30' : 'bg-secondary/25'}`} />
                <div className={`w-1.5 h-1.5 rotate-45 ${isDark ? 'bg-secondary/50' : 'bg-secondary/45'}`} />
                <div className={`w-2.5 h-2.5 rotate-45 ${isDark ? 'bg-secondary/70' : 'bg-secondary/60'}`} />
                <div className={`w-1.5 h-1.5 rotate-45 ${isDark ? 'bg-secondary/50' : 'bg-secondary/45'}`} />
                <div className={`h-px w-12 ${isDark ? 'bg-secondary/30' : 'bg-secondary/25'}`} />
              </div>
            </div>

            <h1 className={`text-4xl md:text-5xl font-bold leading-tight tracking-tight ${isDark ? 'text-[#f5ede0]' : 'text-primary'}`}>
              {t('app.name')}
            </h1>
            <p className={`text-base md:text-lg ${isDark ? 'text-[#e8dcc8]' : 'text-gray-500'}`}>
              {t('app.subtitle')}
            </p>

            {/* Hadith */}
            <div className={`rounded-lg px-6 py-4 text-start backdrop-blur-sm ${
              isDark ? 'bg-white/10 border border-white/15' : 'bg-primary/5 border border-primary/10'
            }`}>
              <p className={`font-amiri text-[1.35rem] leading-loose text-center ${isDark ? 'text-[#e8dcc8]' : 'text-primary/80'}`} dir="rtl">
                {t('hadith.bukhari.arabic')}
              </p>
              <p className={`text-[11px] mt-1.5 italic text-center ${isDark ? 'text-[#c4b89a]' : 'text-gray-400'}`}>
                «&thinsp;{t('hadith.bukhari.translation')}&thinsp;»
                <span className={`not-italic ms-1 ${isDark ? 'text-[#a4987c]/80' : 'text-gray-300'}`}>— {t('hadith.bukhari.source')}</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
              <Link to="/login" className="btn-primary w-full sm:w-auto">
                {t('common.login')}
                <ArrowRight className="w-4 h-4 ms-2 inline rtl:rotate-180" />
              </Link>
              <Link to="/register" className="btn-secondary w-full sm:w-auto">
                {t('auth.registerChild')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Rankings Section */}
      <section className={`relative py-16 overflow-hidden ${
        isDark ? 'bg-[#2a5a5d]' : 'bg-[#e8f4f5]'
      }`}>
        <div className="relative container mx-auto px-4">
          {/* Section heading */}
          <div className="text-center mb-8">
            <p className="font-amiri text-5xl text-secondary leading-none">{t('landing.topStudents')}</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="h-px w-12 bg-secondary/35" />
              <p className={`font-montserrat text-[10px] font-semibold uppercase tracking-[0.25em] ${isDark ? 'text-[#c4b89a]' : 'text-gray-400'}`}>{t('landing.monthlyLeaders')}</p>
              <div className="h-px w-12 bg-secondary/35" />
            </div>
          </div>

          {/* Class filter pills */}
          {classes.length > 0 && (
            <div className="max-w-3xl mx-auto mb-7">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none justify-center flex-wrap">
                {/* All pill */}
                <button
                  onClick={() => setSelectedClassId(null)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all border ${
                    selectedClassId === null
                      ? isDark
                        ? 'bg-secondary text-[#1a3f41] border-secondary shadow-sm'
                        : 'bg-secondary text-white border-secondary shadow-sm'
                      : isDark
                        ? 'bg-transparent text-white/55 border-white/20 hover:border-secondary/50 hover:text-white/80'
                        : 'bg-white/60 text-gray-500 border-secondary/25 hover:border-secondary/50 hover:text-gray-700'
                  }`}
                >
                  {t('landing.allClasses')}
                </button>
                {/* One pill per class */}
                {classes.map((cls: any) => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id === selectedClassId ? null : cls.id)}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all border ${
                      selectedClassId === cls.id
                        ? isDark
                          ? 'bg-secondary text-[#1a3f41] border-secondary shadow-sm'
                          : 'bg-secondary text-white border-secondary shadow-sm'
                        : isDark
                          ? 'bg-transparent text-white/55 border-white/20 hover:border-secondary/50 hover:text-white/80'
                          : 'bg-white/60 text-gray-500 border-secondary/25 hover:border-secondary/50 hover:text-gray-700'
                    }`}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <LeaderboardCard
              arabicTitle={t('landing.hifzTitle')}
              title={t('landing.period')}
              subtitle={t('landing.hifzSubtitle')}
              students={topHifz}
              accentText="text-primary"
              accentBg="bg-secondary"
              topBorder="border-t-4 border-t-secondary"
              pointsColor="text-primary"
              isDark={isDark}
              pointsLabel={t('landing.points')}
              halaqahLabel={t('landing.halaqah')}
              noRankingLabel={t('landing.noRanking')}
            />
            <LeaderboardCard
              arabicTitle={t('landing.talqinTitle')}
              title={t('landing.period')}
              subtitle={t('landing.talqinSubtitle')}
              students={topTalqin}
              accentText="text-secondary"
              accentBg="bg-secondary"
              topBorder="border-t-4 border-t-secondary"
              pointsColor="text-secondary"
              isDark={isDark}
              pointsLabel={t('landing.points')}
              halaqahLabel={t('landing.halaqah')}
              noRankingLabel={t('landing.noRanking')}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`text-white py-10 border-t border-secondary/15 ${
        isDark ? 'bg-[#122d2f]' : 'bg-primary'
      }`}>
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3">
            <p className={`font-amiri text-2xl leading-none text-secondary`}>{t('app.name')}</p>
            <p className="text-[11px] text-white/40 tracking-widest uppercase font-montserrat">{t('app.tagline')}</p>

            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="h-px w-8 bg-secondary/30" />
              <div className="w-1.5 h-1.5 rotate-45 bg-secondary/45" />
              <div className="w-2 h-2 rotate-45 bg-secondary/60" />
              <div className="w-1.5 h-1.5 rotate-45 bg-secondary/45" />
              <div className="h-px w-8 bg-secondary/30" />
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap pt-0.5">
              <a
                href="https://share.google/awEuInQYydgJTvw4u"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-secondary transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                {t('landing.visitMosque')}
              </a>
              <span className="text-white/20 select-none">·</span>
              <button
                onClick={() => setShowVisitorContact(true)}
                className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-secondary transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {t('landing.contactUs')}
              </button>
            </div>

            <p className="text-[11px] text-white/25 pt-1">{t('app.openSource')}</p>
          </div>
        </div>
      </footer>
      {/* Visitor Contact Modal */}
      {showVisitorContact && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[200] p-0 sm:p-4"
          onClick={closeVisitorContact}
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
                    {isAr ? 'مسجد أنس بن مالك' : 'Mosquée Anas Ibn Mālik'}
                  </p>
                  <h3 className="text-white text-lg font-bold leading-tight">
                    {t('landing.contactUs')}
                  </h3>
                </div>
                <button onClick={closeVisitorContact} className="text-white/50 hover:text-white transition-colors mt-0.5">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {visitorStep === 'sent' ? (
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
                {visitorEmail && (
                  <p className="text-xs text-gray-400 mt-2">
                    {isAr ? `سيصلك الرد على: ${visitorEmail}` : `Réponse attendue sur : ${visitorEmail}`}
                  </p>
                )}
                <button
                  onClick={closeVisitorContact}
                  className="mt-6 px-8 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm"
                >
                  {isAr ? 'إغلاق' : 'Fermer'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVisitorSubmit} className="px-5 py-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isAr ? 'الاسم الكريم' : 'Votre nom'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={e => setVisitorName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm outline-none transition"
                    placeholder={isAr ? 'أدخل اسمك' : 'Entrez votre nom'}
                    maxLength={100}
                  />
                </div>

                {/* Type pills */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {t('common.messageType')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {VISITOR_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setVisitorType(type.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          visitorType === type.value
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/40'
                        }`}
                      >
                        {isAr ? type.labelAr : type.labelFr}
                      </button>
                    ))}
                  </div>
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
                    {t('common.subject')}
                  </label>
                  <input
                    type="text"
                    value={visitorSubject}
                    onChange={e => setVisitorSubject(e.target.value)}
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
                    value={visitorMessage}
                    onChange={e => setVisitorMessage(e.target.value)}
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
                    value={visitorEmail}
                    onChange={e => setVisitorEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm outline-none transition"
                    placeholder={t('common.replyEmailPlaceholder')}
                    dir="ltr"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">{t('common.replyEmailNote')}</p>
                </div>

                {visitorError && <p className="text-red-500 text-xs font-medium">{visitorError}</p>}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeVisitorContact}
                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={visitorLoading}
                    className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {visitorLoading ? (
                      <span className="animate-pulse">{t('common.sendingMessage')}</span>
                    ) : (
                      <><Send className="w-4 h-4" />{t('common.send')}</>
                    )}
                  </button>
                </div>

                <p className="text-center text-[10px] text-gray-300 pt-1 border-t border-gray-100">
                  {isAr ? 'المنصة القرآنية الرقمية · تطوير وتقنية متخصصة' : 'Plateforme coranique numérique · Développement spécialisé'}
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


