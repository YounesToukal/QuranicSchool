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
  { id: 'overview',  number: '١', title: 'ما تعرضه لوحتك' },
  { id: 'updates',   number: '٢', title: 'كيف تتحدث البيانات' },
  { id: 'children',  number: '٣', title: 'إدارة أبنائكم' },
  { id: 'requests',  number: '٤', title: 'متابعة الطلبات' },
  { id: 'contact',   number: '٥', title: 'التواصل مع الإدارة' },
];

const SECTIONS_FR = [
  { id: 'overview',  number: '1', title: 'Contenu du tableau de bord' },
  { id: 'updates',   number: '2', title: 'Mise à jour des données' },
  { id: 'children',  number: '3', title: 'Gérer vos enfants' },
  { id: 'requests',  number: '4', title: 'Suivi des demandes' },
  { id: 'contact',   number: '5', title: "Contacter l'administration" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParentGuidePage() {
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

        {/* Back button — prominent, above everything */}
        <button
          onClick={() => navigate('/parent')}
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
            {isAr ? 'دليل لوحة المتابعة' : 'Guide du tableau de bord'}
          </h1>
          <p className={`text-base max-w-lg mx-auto ${isDark ? 'text-white/55' : 'text-gray-500'}`}>
            {isAr
              ? 'كل ما يحتاجه ولي الأمر لمتابعة مسيرة أبنائه القرآنية على هذه المنصة'
              : 'Tout ce dont un parent a besoin pour suivre le parcours coranique de ses enfants'}
          </p>
          {/* Arabesque divider */}
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

              {/* Back button in TOC on desktop */}
              <div className="mt-5 pt-4 border-t border-secondary/10">
                <button
                  onClick={() => navigate('/parent')}
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
                <Section id="overview" number="١" title="ما تعرضه لوحتك" isDark={isDark}>
                  <p>عند تسجيل الدخول ستجد بطاقة مخصصة لكل طفل مسجّل، تعرض:</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="اسمه الكامل وحلقته (حفظ أو تلقين)" />
                    <Step isDark={isDark} label="آخر نشاط سجّله المعلم: حضور، حفظ، أو تلاوة" />
                    <Step isDark={isDark} label="نقاطه المتراكمة هذا الشهر وترتيبه في الحلقة والترتيب العام" />
                    <Step isDark={isDark} label="شبكة الأحزاب التي أتمّها حتى الآن" />
                  </div>
                  <p className="mt-3">
                    تُصمَّم هذه اللوحة لتكون مرجعًا شفافًا ومباشرًا — دون تعقيد — يُطلعكم على كل ما يجري في الحلقة.
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="updates" number="٢" title="كيف تتحدث البيانات" isDark={isDark}>
                  <p>لا يتطلب الأمر أي إجراء منكم — كل شيء يسير تلقائيًا.</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="يُسجّل المعلم الحضور والأداء عبر لوحة تحكمه الخاصة" />
                    <Step isDark={isDark} label="تظهر النقاط والأنشطة الجديدة عند إعادة تحميل الصفحة أو بعد 30 ثانية تلقائيًا" />
                    <Step isDark={isDark} label="يُحسَب الترتيب الشهري من مجموع نقاط جميع الطلاب في الحلقة ذاتها" />
                  </div>
                  <Note isDark={isDark} text="إن لم تجدوا تحديثًا منذ فترة، تأكدوا من حضور ابنكم — فالنقاط مرتبطة بالحضور والأداء الفعلي." />
                </Section>

                <Divider isDark={isDark} />

                <Section id="children" number="٣" title="إدارة أبنائكم" isDark={isDark}>
                  <p>يمكنكم من لوحة التحكم:</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="التنقّل بين أبنائكم عبر أزرار الأسماء في أعلى الصفحة (إن كان لديكم أكثر من طفل)" />
                    <Step isDark={isDark} label='إضافة طفل آخر عبر زر "إضافة طفل جديد" — يُرسَل الطلب للمشرف للمراجعة ثم التفعيل' />
                    <Step isDark={isDark} label='طلب تغيير حلقة طفل عبر زر "تغيير الحلقة" الظاهر في بطاقته' />
                  </div>
                  <Note isDark={isDark} text="يكفي حساب واحد لمتابعة جميع أبنائكم — لا تحتاجون لتسجيل منفصل لكل طفل." />
                </Section>

                <Divider isDark={isDark} />

                <Section id="requests" number="٤" title="متابعة الطلبات" isDark={isDark}>
                  <p>
                    يظهر في أعلى لوحتكم شريط «متابعة الطلبات» يجمع كل طلباتكم المُرسَلة (تسجيل، إضافة طفل، تغيير حلقة).
                  </p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="نقطة صفراء: الطلب قيد المراجعة من الإدارة" />
                    <Step isDark={isDark} label="نقطة خضراء: تمت الموافقة — الحساب أو التغيير مُفعَّل" />
                    <Step isDark={isDark} label="نقطة حمراء: تم الرفض — بإمكانكم إرسال طلب جديد" />
                  </div>
                  <Note isDark={isDark} text="تظهر إشعارات «جديد» تلقائيًا عند تغيّر حالة أي طلب — لن يفوتكم تحديث." />
                </Section>

                <Divider isDark={isDark} />

                <Section id="contact" number="٥" title="التواصل مع الإدارة" isDark={isDark}>
                  <p>
                    يمكنكم مراسلة المشرفين في أي وقت عبر أيقونة الرسالة الظاهرة في رأس كل صفحة بعد تسجيل الدخول.
                    اختاروا نوع رسالتكم (استفسار، اقتراح، شكوى، دعم تقني) وأضيفوا بريدكم الإلكتروني لتلقّي الرد مباشرة.
                  </p>
                </Section>

                {/* Closing dua */}
                <div className={`mt-12 pt-8 border-t text-center ${isDark ? 'border-white/10' : 'border-secondary/12'}`}>
                  <p className={`font-amiri text-lg mb-6 ${isDark ? 'text-secondary/60' : 'text-secondary/55'}`}>
                    وفّقكم الله في تربية أبنائكم على كتابه الكريم
                  </p>
                  <button
                    onClick={() => navigate('/parent')}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                      isDark
                        ? 'bg-secondary/15 text-secondary border-secondary/25 hover:bg-secondary/25'
                        : 'bg-primary text-white border-primary hover:bg-primary/90'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" />
                    {isAr ? 'العودة إلى لوحتي' : 'Retour au tableau de bord'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <Section id="overview" number="1" title="Contenu du tableau de bord" isDark={isDark}>
                  <p>{"À la connexion, vous trouvez une fiche dédiée à chaque enfant inscrit, affichant :"}</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="Son nom complet et sa halaqah (Hifz ou Talqin)" />
                    <Step isDark={isDark} label={"La dernière activité enregistrée par l'enseignant : présence, mémorisation ou récitation"} />
                    <Step isDark={isDark} label="Ses points du mois et son classement dans la halaqah et en général" />
                    <Step isDark={isDark} label={"La grille des hizbs qu'il a parcourus jusqu'à présent"} />
                  </div>
                  <p className="mt-3">
                    {"Ce tableau est conçu pour être une fenêtre transparente sur la halaqah — simple, directe, sans complexité."}
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="updates" number="2" title="Mise à jour des données" isDark={isDark}>
                  <p>{"Aucune action de votre part n'est nécessaire — tout se met à jour automatiquement."}</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label={"L'enseignant enregistre la présence et les performances depuis son propre espace"} />
                    <Step isDark={isDark} label="Points et activités apparaissent au rechargement de la page ou après 30 secondes automatiquement" />
                    <Step isDark={isDark} label="Le classement mensuel est calculé à partir du cumul des points de chaque halaqah" />
                  </div>
                  <Note isDark={isDark} text={"Si aucune mise à jour n'apparaît depuis un moment, vérifiez la présence de votre enfant — les points sont liés à sa participation effective."} />
                </Section>

                <Divider isDark={isDark} />

                <Section id="children" number="3" title="Gérer vos enfants" isDark={isDark}>
                  <p>{"Depuis votre tableau de bord, vous pouvez :"}</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="Naviguer entre vos enfants via les boutons de noms en haut de la page (si vous en avez plusieurs)" />
                    <Step isDark={isDark} label={"Ajouter un autre enfant via le bouton \"Ajouter un enfant\" — la demande est transmise à l'administrateur pour validation"} />
                    <Step isDark={isDark} label={"Demander un changement de halaqah via le bouton \"Changer de halaqah\" affiché sur sa fiche"} />
                  </div>
                  <Note isDark={isDark} text="Un seul compte suffit pour suivre tous vos enfants inscrits à la mosquée." />
                </Section>

                <Divider isDark={isDark} />

                <Section id="requests" number="4" title="Suivi des demandes" isDark={isDark}>
                  <p>
                    {"Un panneau \"Suivi des demandes\" en haut de votre tableau regroupe toutes vos demandes (inscription, ajout d'enfant, changement de halaqah)."}
                  </p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label={"Point jaune : demande en cours d'examen par l'administration"} />
                    <Step isDark={isDark} label="Point vert : demande acceptée — compte ou modification activé" />
                    <Step isDark={isDark} label="Point rouge : demande refusée — une nouvelle demande peut être soumise" />
                  </div>
                  <Note isDark={isDark} text={"Des badges « Nouveau » apparaissent automatiquement dès qu'une demande change de statut — vous ne manquerez aucune mise à jour."} />
                </Section>

                <Divider isDark={isDark} />

                <Section id="contact" number="5" title="Contacter l'administration" isDark={isDark}>
                  <p>
                    {"Vous pouvez écrire aux administrateurs à tout moment via l'icône de messagerie en haut de chaque page après connexion. Choisissez le type de votre message et laissez votre e-mail pour recevoir une réponse directe."}
                  </p>
                </Section>

                {/* Closing dua */}
                <div className={`mt-12 pt-8 border-t text-center ${isDark ? 'border-white/10' : 'border-secondary/12'}`}>
                  <p className={`font-amiri text-lg mb-6 ${isDark ? 'text-secondary/60' : 'text-secondary/55'}`}>
                    {"Qu'Allah bénisse vos enfants dans ce noble parcours"}
                  </p>
                  <button
                    onClick={() => navigate('/parent')}
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
