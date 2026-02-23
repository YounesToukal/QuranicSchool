import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/themeStore';
import Header from '@/components/common/Header';
import { ArrowRight } from 'lucide-react';

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-secondary/15'}`} />
      <div className="flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rotate-45 ${isDark ? 'bg-secondary/40' : 'bg-secondary/35'}`} />
        <div className={`w-2.5 h-2.5 rotate-45 ${isDark ? 'bg-secondary/65' : 'bg-secondary/55'}`} />
        <div className={`w-1.5 h-1.5 rotate-45 ${isDark ? 'bg-secondary/40' : 'bg-secondary/35'}`} />
      </div>
      <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-secondary/15'}`} />
    </div>
  );
}

function Section({
  id,
  number,
  title,
  children,
  isDark,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
          isDark ? 'bg-secondary/20 text-secondary' : 'bg-secondary/15 text-secondary'
        }`}>
          {number}
        </span>
        <h2 className={`text-xl font-bold ${isDark ? 'text-[#f0e6c8]' : 'text-primary'}`}>
          {title}
        </h2>
      </div>
      <div className={`ps-11 space-y-3 text-[0.95rem] leading-loose ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
        {children}
      </div>
    </section>
  );
}

function Step({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border ${
      isDark ? 'bg-white/5 border-white/10' : 'bg-primary/3 border-primary/10'
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full mt-2.5 flex-shrink-0 ${isDark ? 'bg-secondary/70' : 'bg-secondary'}`} />
      <p className={isDark ? 'text-[#e8dcc8]' : 'text-gray-700'}>{label}</p>
    </div>
  );
}

function Note({ text, isDark }: { text: string; isDark: boolean }) {
  return (
    <p className={`text-xs px-3 py-2.5 rounded-lg border mt-1 leading-relaxed ${
      isDark ? 'bg-secondary/8 border-secondary/20 text-secondary/80' : 'bg-secondary/6 border-secondary/15 text-secondary/90'
    }`}>
      {text}
    </p>
  );
}

// ─── TOC data ─────────────────────────────────────────────────────────────────

const SECTIONS_AR = [
  { id: 'overview',   number: '١', title: 'نظرة عامة على لوحتك' },
  { id: 'students',   number: '٢', title: 'بطاقات الطلاب' },
  { id: 'logging',    number: '٣', title: 'تسجيل التقدم اليومي' },
  { id: 'updates',    number: '٤', title: 'تحديث البيانات' },
  { id: 'contact',    number: '٥', title: 'التواصل مع الإدارة' },
];

const SECTIONS_FR = [
  { id: 'overview',   number: '1', title: 'Vue générale du tableau' },
  { id: 'students',   number: '2', title: 'Fiches des élèves' },
  { id: 'logging',    number: '3', title: 'Enregistrer la progression' },
  { id: 'updates',    number: '4', title: 'Mise à jour des données' },
  { id: 'contact',    number: '5', title: "Contacter l'administration" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherGuidePage() {
  const { i18n } = useTranslation();
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const isAr = i18n.language === 'ar';

  const sections = isAr ? SECTIONS_AR : SECTIONS_FR;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#1e4a4c]' : 'bg-[#FEFBF6]'}`}>
      <Header />

      <div className="container mx-auto px-4 py-10 max-w-4xl">

        {/* Back button — prominent */}
        <button
          onClick={() => navigate('/teacher')}
          className={`flex items-center gap-2 mb-8 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
            isDark
              ? 'text-secondary/80 border-secondary/25 hover:bg-secondary/10 hover:text-secondary'
              : 'text-primary border-primary/20 hover:bg-primary/5 hover:text-primary'
          }`}
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <ArrowRight className={`w-4 h-4 ${isAr ? '' : 'rotate-180'}`} />
          {isAr ? 'العودة إلى لوحتي' : 'Retour au tableau de bord'}
        </button>

        {/* Page header */}
        <div className="text-center mb-12" dir={isAr ? 'rtl' : 'ltr'}>
          <p className={`font-amiri text-2xl mb-2 ${isDark ? 'text-secondary/75' : 'text-secondary/65'}`}>
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>
          <h1 className={`text-3xl md:text-4xl font-bold mb-3 ${isDark ? 'text-[#f5ede0]' : 'text-primary'}`}>
            {isAr ? 'دليل لوحة المعلم' : 'Guide du tableau de bord enseignant'}
          </h1>
          <p className={`text-base max-w-lg mx-auto ${isDark ? 'text-white/55' : 'text-gray-500'}`}>
            {isAr
              ? 'كل ما يحتاجه المعلم لتسجيل التقدم ومتابعة طلابه بيسر وكفاءة'
              : 'Tout ce dont un enseignant a besoin pour enregistrer la progression de ses élèves'}
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className={`h-px w-16 ${isDark ? 'bg-secondary/25' : 'bg-secondary/20'}`} />
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rotate-45 ${isDark ? 'bg-secondary/45' : 'bg-secondary/40'}`} />
              <div className={`w-2.5 h-2.5 rotate-45 ${isDark ? 'bg-secondary/70' : 'bg-secondary/60'}`} />
              <div className={`w-1.5 h-1.5 rotate-45 ${isDark ? 'bg-secondary/45' : 'bg-secondary/40'}`} />
            </div>
            <div className={`h-px w-16 ${isDark ? 'bg-secondary/25' : 'bg-secondary/20'}`} />
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-10">

          {/* Sticky TOC */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className={`sticky top-24 rounded-xl p-4 border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-secondary/12'
            }`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${
                isDark ? 'text-secondary/70' : 'text-secondary/80'
              }`}>
                {isAr ? 'المحتويات' : 'Sommaire'}
              </p>
              <nav className="space-y-1" dir={isAr ? 'rtl' : 'ltr'}>
                {sections.map(s => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                      isDark
                        ? 'text-white/55 hover:text-secondary hover:bg-white/5'
                        : 'text-gray-500 hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isDark ? 'text-secondary/50' : 'text-secondary/60'}`}>
                      {s.number}
                    </span>
                    {s.title}
                  </a>
                ))}
              </nav>

              {/* Back button in TOC */}
              <div className="mt-5 pt-4 border-t border-secondary/10">
                <button
                  onClick={() => navigate('/teacher')}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isDark
                      ? 'bg-secondary/15 text-secondary hover:bg-secondary/25'
                      : 'bg-primary/8 text-primary hover:bg-primary/15'
                  }`}
                  dir={isAr ? 'rtl' : 'ltr'}
                >
                  <ArrowRight className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
                  {isAr ? 'لوحتي' : 'Mon tableau'}
                </button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="lg:col-span-3 space-y-2" dir={isAr ? 'rtl' : 'ltr'}>

            {isAr ? (
              <>
                <Section id="overview" number="١" title="نظرة عامة على لوحتك" isDark={isDark}>
                  <p>
                    عند تسجيل الدخول تظهر لوحتك مباشرة مع بطاقة تعريفية تعرض:
                  </p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="اسم حلقتك وعدد الطلاب المسجلين فيها" />
                    <Step isDark={isDark} label="شريط إنجاز يومي: عدد الطلاب الذين سُجِّل تقدّمهم اليوم مقارنة بالعدد الكلي" />
                    <Step isDark={isDark} label="أزرار تصفية سريعة: الكل — تم التسجيل — لم يُسجَّل بعد" />
                    <Step isDark={isDark} label="ملخص إحصائي موجز: متوسط الحفظ، إجمالي النقاط، ومعدل الحضور هذا الشهر" />
                  </div>
                  <Note isDark={isDark} text="إذا لم تظهر حلقتك، تواصل مع المشرف ليتأكد من ربط حسابك بالفصل الصحيح." />
                </Section>

                <Divider isDark={isDark} />

                <Section id="students" number="٢" title="بطاقات الطلاب" isDark={isDark}>
                  <p>
                    تعرض شبكة الطلاب بطاقة لكل طالب تحوي:
                  </p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="الاسم الكامل وصورة الطالب (إن وُجدت)" />
                    <Step isDark={isDark} label="الحزب الحالي من أصل 60 مع شريط تقدّم بصري" />
                    <Step isDark={isDark} label="نقاط الطالب هذا الشهر" />
                    <Step isDark={isDark} label="علامة خضراء في زاوية البطاقة إذا سُجِّل تقدّمه اليوم" />
                  </div>
                  <p className="mt-3">
                    اضغط على بطاقة أي طالب لفتح نافذة التسجيل اليومي الخاصة به.
                  </p>
                  <Note isDark={isDark} text="يمكنك تصفية الطلاب بين من سُجِّل تقدّمهم ومن لم يُسجَّل بعد للتأكد من إكمال جلسة اليوم." />
                </Section>

                <Divider isDark={isDark} />

                <Section id="logging" number="٣" title="تسجيل التقدم اليومي" isDark={isDark}>
                  <p>
                    بعد الضغط على بطاقة الطالب تنفتح واجهة التسجيل الذكي وتشمل:
                  </p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="الحضور: حاضر — غائب — غياب بعذر" />
                    <Step isDark={isDark} label="صفحات الحفظ الجديد ومراجعة الصفحات السابقة" />
                    <Step isDark={isDark} label="مستوى التركيز: عالٍ — متوسط — منخفض" />
                    <Step isDark={isDark} label="ملاحظة نصية اختيارية تظهر لولي الأمر في لوحته" />
                  </div>
                  <p className="mt-3">
                    بعد التأكيد تُحتسَب النقاط تلقائيًا وتُحدَّث لوحة ولي الأمر.
                    للحلقات من نوع التلقين، تُعرض واجهة مخصصة لتقييم التلاوة والتجويد.
                  </p>
                  <Note isDark={isDark} text="التسجيل اليومي هو ما يراه ولي الأمر — كلما كان دقيقًا وممنهجًا كلما ازداد ثقة الأهل في المنصة." />
                </Section>

                <Divider isDark={isDark} />

                <Section id="updates" number="٤" title="تحديث البيانات" isDark={isDark}>
                  <p>
                    لا يلزمك أي إعداد إضافي — البيانات تتدفق تلقائيًا.
                  </p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="بعد كل تسجيل تُحدَّث نقاط الطالب ويُعاد احتساب الترتيب في الحلقة والترتيب العام" />
                    <Step isDark={isDark} label="تُخطَر الإدارة تلقائيًا بأي نشاط غير اعتيادي" />
                    <Step isDark={isDark} label="يرى ولي الأمر التحديث في غضون 30 ثانية دون الحاجة لإعادة تحميل" />
                  </div>
                  <Note isDark={isDark} text="الثبات في التسجيل يومًا بيوم هو أكثر ما يُثري بيانات الطلاب ويمنح الإدارة رؤية واضحة لمستوى كل حلقة." />
                </Section>

                <Divider isDark={isDark} />

                <Section id="contact" number="٥" title="التواصل مع الإدارة" isDark={isDark}>
                  <p>
                    يمكنك مراسلة المشرفين في أي وقت عبر أيقونة الرسالة الظاهرة في رأس الصفحة.
                    اختر نوع رسالتك (استفسار، اقتراح، شكوى، دعم تقني) وأضف بريدك الإلكتروني لتلقّي الرد مباشرة.
                  </p>
                  <Note isDark={isDark} text="للاستفسارات المتعلقة بإضافة طالب أو نقله إلى حلقة أخرى — تواصل مع الإدارة للتنسيق." />
                </Section>

                {/* Closing dua */}
                <div className={`mt-12 pt-8 border-t text-center ${isDark ? 'border-white/10' : 'border-secondary/12'}`}>
                  <p className={`font-amiri text-lg mb-6 ${isDark ? 'text-secondary/60' : 'text-secondary/55'}`}>
                    جعل الله مجهودك في تعليم كتابه ميزانًا ثقيلًا في كفّة حسناتك
                  </p>
                  <button
                    onClick={() => navigate('/teacher')}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                      isDark
                        ? 'bg-secondary/15 text-secondary border-secondary/25 hover:bg-secondary/25'
                        : 'bg-primary text-white border-primary hover:bg-primary/90'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" />
                    العودة إلى لوحتي
                  </button>
                </div>
              </>
            ) : (
              <>
                <Section id="overview" number="1" title="Vue générale du tableau" isDark={isDark}>
                  <p>
                    {"À la connexion, votre tableau de bord apparaît directement avec une fiche récapitulative affichant :"}
                  </p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="Le nom de votre halaqah et le nombre total d'élèves inscrits" />
                    <Step isDark={isDark} label="Une barre de progression journalière : nombre d'élèves enregistrés aujourd'hui sur le total" />
                    <Step isDark={isDark} label="Des filtres rapides : Tous — Enregistrés — Non enregistrés" />
                    <Step isDark={isDark} label={"Un résumé statistique : moyenne de mémorisation, total des points et taux de présence du mois"} />
                  </div>
                  <Note isDark={isDark} text={"Si votre halaqah n'apparaît pas, contactez l'administration pour vérifier l'association de votre compte."} />
                </Section>

                <Divider isDark={isDark} />

                <Section id="students" number="2" title="Fiches des élèves" isDark={isDark}>
                  <p>
                    La grille affiche une fiche par élève comprenant :
                  </p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label={"Le nom complet et la photo de l'élève (si disponible)"} />
                    <Step isDark={isDark} label="Le hizb actuel sur 60, avec une barre de progression visuelle" />
                    <Step isDark={isDark} label="Les points de ce mois" />
                    <Step isDark={isDark} label={"Un badge vert dans le coin de la fiche si la progression a été enregistrée aujourd'hui"} />
                  </div>
                  <p className="mt-3">
                    {"Appuyez sur la fiche d'un élève pour ouvrir l'interface d'enregistrement journalier."}
                  </p>
                  <Note isDark={isDark} text={"Utilisez les filtres pour distinguer les élèves enregistrés de ceux qui restent en attente et compléter la session du jour."} />
                </Section>

                <Divider isDark={isDark} />

                <Section id="logging" number="3" title="Enregistrer la progression" isDark={isDark}>
                  <p>
                    {"En cliquant sur la fiche d'un élève, l'interface d'enregistrement intelligent s'ouvre et comprend :"}
                  </p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="Présence : présent — absent — absence justifiée" />
                    <Step isDark={isDark} label="Pages mémorisées et pages de révision" />
                    <Step isDark={isDark} label="Niveau de concentration : élevé — moyen — faible" />
                    <Step isDark={isDark} label={"Une note textuelle facultative, visible par le parent dans son tableau de bord"} />
                  </div>
                  <p className="mt-3">
                    {"Après confirmation, les points sont calculés automatiquement et le tableau du parent est mis à jour. Pour les halaqahs de Talqin, une interface dédiée à l'évaluation de la récitation est présentée."}
                  </p>
                  <Note isDark={isDark} text={"L'enregistrement journalier est ce que voit le parent — plus il est précis et régulier, plus les familles font confiance à la plateforme."} />
                </Section>

                <Divider isDark={isDark} />

                <Section id="updates" number="4" title="Mise à jour des données" isDark={isDark}>
                  <p>
                    {"Aucune configuration supplémentaire n'est nécessaire — les données se propagent automatiquement."}
                  </p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label={"Après chaque enregistrement, les points sont mis à jour et le classement recalculé"} />
                    <Step isDark={isDark} label={"L'administration est notifiée automatiquement en cas d'activité inhabituelle"} />
                    <Step isDark={isDark} label="Le parent voit la mise à jour en moins de 30 secondes sans avoir besoin de recharger la page" />
                  </div>
                  <Note isDark={isDark} text={"La régularité des enregistrements jour après jour est ce qui enrichit le plus les données et offre à l'administration une vision claire de chaque halaqah."} />
                </Section>

                <Divider isDark={isDark} />

                <Section id="contact" number="5" title="Contacter l'administration" isDark={isDark}>
                  <p>
                    {"Vous pouvez écrire aux administrateurs à tout moment via l'icône de messagerie en haut de chaque page. Choisissez le type de message et laissez votre e-mail pour recevoir une réponse directe."}
                  </p>
                  <Note isDark={isDark} text={"Pour les demandes d'ajout ou de transfert d'un élève vers une autre halaqah, contactez l'administration pour coordination."} />
                </Section>

                {/* Closing dua */}
                <div className={`mt-12 pt-8 border-t text-center ${isDark ? 'border-white/10' : 'border-secondary/12'}`}>
                  <p className={`font-amiri text-lg mb-6 ${isDark ? 'text-secondary/60' : 'text-secondary/55'}`}>
                    {"Qu'Allah récompense votre effort dans l'enseignement de Son noble Livre"}
                  </p>
                  <button
                    onClick={() => navigate('/teacher')}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                      isDark
                        ? 'bg-secondary/15 text-secondary border-secondary/25 hover:bg-secondary/25'
                        : 'bg-primary text-white border-primary hover:bg-primary/90'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Retour au tableau de bord
                  </button>
                </div>
              </>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
