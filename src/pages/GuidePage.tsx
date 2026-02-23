import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/themeStore';
import Header from '@/components/common/Header';

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
        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-amiri text-sm font-bold flex-shrink-0 ${
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

const SECTIONS_AR = [
  { id: 'goal',    number: '١', title: 'هدف المنصة' },
  { id: 'register', number: '٢', title: 'كيفية التسجيل' },
  { id: 'login',   number: '٣', title: 'تسجيل الدخول' },
  { id: 'dashboard', number: '٤', title: 'لوحة متابعة ولي الأمر' },
  { id: 'children', number: '٥', title: 'إدارة أبنائكم' },
  { id: 'points',  number: '٦', title: 'النقاط والترتيب' },
  { id: 'contact', number: '٧', title: 'التواصل مع الإدارة' },
];

const SECTIONS_FR = [
  { id: 'goal',    number: '1', title: 'Objectif de la plateforme' },
  { id: 'register', number: '2', title: 'Créer un compte' },
  { id: 'login',   number: '3', title: 'Se connecter' },
  { id: 'dashboard', number: '4', title: 'Tableau de bord parent' },
  { id: 'children', number: '5', title: 'Gérer vos enfants' },
  { id: 'points',  number: '6', title: 'Points et classement' },
  { id: 'contact', number: '7', title: 'Contacter l\'administration' },
];

export default function GuidePage() {
  const { i18n } = useTranslation();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const isAr = i18n.language === 'ar';

  const sections = isAr ? SECTIONS_AR : SECTIONS_FR;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#1e4a4c]' : 'bg-[#FEFBF6]'}`}>
      <Header />

      <div className="container mx-auto px-4 py-12 max-w-4xl">

        {/* Page Header */}
        <div className="text-center mb-12">
          <p className={`font-amiri text-2xl mb-2 ${isDark ? 'text-secondary/75' : 'text-secondary/65'}`}>
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>
          <h1 className={`text-3xl md:text-4xl font-bold mb-3 ${isDark ? 'text-[#f5ede0]' : 'text-primary'}`}>
            {isAr ? 'دليل الاستخدام' : 'Guide d\'utilisation'}
          </h1>
          <p className={`text-base max-w-lg mx-auto ${isDark ? 'text-white/55' : 'text-gray-500'}`}>
            {isAr
              ? 'كل ما يحتاجه ولي الأمر لمتابعة مسيرة أبنائه القرآنية على هذه المنصة'
              : 'Tout ce dont un parent a besoin pour suivre le parcours coranique de ses enfants'}
          </p>

          {/* Divider */}
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
              <nav className="space-y-1">
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
            </div>
          </aside>

          {/* Main content */}
          <main className="lg:col-span-3 space-y-2">

            {isAr ? (
              <>
                <Section id="goal" number="١" title="هدف المنصة" isDark={isDark}>
                  <p>
                    منصة <strong className={isDark ? 'text-[#f0e6c8]' : 'text-primary'}>مسجد أنس بن مالك</strong> هي فضاء رقمي مخصص لمتابعة
                    مسيرة أبنائكم الحافظين في حلقات المسجد. تتيح للآباء الاطلاع على تقدم أبنائهم في الحفظ والتلقين،
                    ومتابعة نقاطهم وترتيبهم الشهري، والتواصل مع الإدارة.
                  </p>
                  <p>
                    صُمِّمت هذه المنصة لتكون جسرًا شفافًا بين ولي الأمر والحلقة القرآنية، بعيدًا عن التعقيد،
                    قريبًا من القيم التي نرعاها.
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="register" number="٢" title="كيفية التسجيل" isDark={isDark}>
                  <p>صفحة التسجيل تطلب منكم معلومات ولي الأمر وأبنائه. إليكم الخطوات:</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label='من الصفحة الرئيسية، انقر على "تسجيل طفلي"' />
                    <Step isDark={isDark} label="أدخل اسمك الأول واسم عائلتك بالحروف العربية" />
                    <Step isDark={isDark} label='أدخل رقم هاتفك ثم اضغط "إرسال الرمز"' />
                    <Step isDark={isDark} label="أضف طفلك أو أطفالك: الاسم الأول لكل طفل واختر حلقته" />
                    <Step isDark={isDark} label='اضغط "إرسال الطلب" ثم أعد إدخال رقم هاتفك تأكيدًا' />
                    <Step isDark={isDark} label="بعد المراجعة، يقبل المشرف الطلب ويُفعَّل حسابك" />
                  </div>
                  <p className={`text-xs mt-3 px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-secondary/8 border-secondary/20 text-secondary/80' : 'bg-secondary/6 border-secondary/15 text-secondary/90'
                  }`}>
                    ملاحظة: يكفي حساب واحد لمتابعة جميع أبنائكم المسجّلين.
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="login" number="٣" title="تسجيل الدخول" isDark={isDark}>
                  <p>يتصل ولي الأمر برقم هاتفه ورمز SMS، بينما المشرفون والمعلمون يستخدمون البريد الإلكتروني وكلمة المرور.</p>
                  <p className={`font-semibold mt-3 mb-2 ${isDark ? 'text-[#f0e6c8]' : 'text-primary'}`}>لأولياء الأمور:</p>
                  <div className="space-y-2">
                    <Step isDark={isDark} label='انقر على "تسجيل الدخول" في الصفحة الرئيسية' />
                    <Step isDark={isDark} label='اختر لسان "ولي الأمر" (محدد تلقائيًا)' />
                    <Step isDark={isDark} label='أدخل رقم هاتفك ثم اضغط "إرسال الرمز"' />
                    <Step isDark={isDark} label="ستصلك رسالة SMS تحتوي على رمز من 6 أرقام" />
                    <Step isDark={isDark} label='أدخل الرمز واضغط "التحقق من الرمز" — ستنتقل إلى لوحة متابعة أبنائك' />
                  </div>
                  <p className={`mt-3 text-sm ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                    في حال تغيّر رقم هاتفك أو نسيانه، استخدم رابط «رقم هاتفك خاطئ أو لا تتذكره؟» الظاهر أسفل نموذج الدخول.
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="dashboard" number="٤" title="لوحة متابعة ولي الأمر" isDark={isDark}>
                  <p>بعد تسجيل الدخول، ستجد لوحة تعرض لكل طفل مسجّل ما يلي:</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="آخر الأنشطة المسجّلة من قِبل المعلم (حفظ أو تلقين)" />
                    <Step isDark={isDark} label="عدد النقاط المتراكمة والترتيب الشهري" />
                    <Step isDark={isDark} label="اسم الحلقة التي ينتمي إليها الطفل" />
                  </div>
                  <p className="mt-3">
                    تُحدَّث البيانات تلقائيًا في كل مرة يُسجّل المعلم نشاطًا جديدًا، دون أي تدخّل من ولي الأمر.
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="children" number="٥" title="إدارة أبنائكم" isDark={isDark}>
                  <p>من لوحة التحكم يمكنكم:</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="إضافة طفل آخر إلى حسابكم عبر زر «إضافة طفل جديد»" />
                    <Step isDark={isDark} label="طلب تغيير حلقة الطفل (من حفظ إلى تلقين أو بين الحلقات) عبر زر «تغيير الحلقة»" />
                    <Step isDark={isDark} label="متابعة حالة الطلبات المرسلة (قيد الانتظار / مقبول / مرفوض)" />
                  </div>
                  <p className={`text-xs mt-3 px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-secondary/8 border-secondary/20 text-secondary/80' : 'bg-secondary/6 border-secondary/15 text-secondary/90'
                  }`}>
                    تظهر الطلبات في قسم «متابعة الطلبات» داخل لوحتكم، ويُبلَّغ ولي الأمر بتحديثها فور معالجتها من الإدارة.
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="points" number="٦" title="النقاط والترتيب" isDark={isDark}>
                  <p>
                    يحصل الطالب على نقاط مقابل كل نشاط يُسجّله المعلم سواءً في حلقة الحفظ أو التلقين.
                    تتجمّع النقاط شهريًا لتحديد الترتيب الذي يظهر على الصفحة الرئيسية للجميع.
                  </p>
                  <p>
                    الهدف من الترتيب تحفيز الطلاب على المواظبة والاجتهاد في كتاب الله — وليس المنافسة لذاتها، بل التذكير بفضل السبق في حفظ القرآن.
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="contact" number="٧" title="التواصل مع الإدارة" isDark={isDark}>
                  <p>يمكنكم مراسلة الإدارة عبر طريقتين:</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="زر «تواصل معنا» في أسفل الصفحة الرئيسية — متاح للجميع بدون تسجيل دخول" />
                    <Step isDark={isDark} label="أيقونة الرسائل الظاهرة في كل صفحة بعد تسجيل الدخول — مخصصة لأولياء الأمور والمعلمين" />
                  </div>
                  <p className="mt-3">
                    يمكنكم اختيار نوع رسالتكم (استفسار، اقتراح، شكوى، دعم تقني) وإضافة بريدكم الإلكتروني لتلقّي الرد مباشرة.
                  </p>
                </Section>
              </>
            ) : (
              <>
                <Section id="goal" number="1" title="Objectif de la plateforme" isDark={isDark}>
                  <p>
                    La plateforme de la <strong className={isDark ? 'text-[#f0e6c8]' : 'text-primary'}>Mosquée Anas Ibn Mālik</strong> est un espace numérique
                    dédié au suivi du parcours de mémorisation du Saint Coran de vos enfants inscrits dans les halaqahs de la mosquée.
                  </p>
                  <p>
                    Elle permet aux parents de consulter en temps réel les progrès, les points et le classement mensuel de leurs enfants,
                    et de communiquer facilement avec l'administration.
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="register" number="2" title="Créer un compte" isDark={isDark}>
                  <p>{"Le formulaire d'inscription vous demande vos informations et celles de vos enfants :"}</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label={"Sur la page d'accueil, cliquez sur « Inscrire mon enfant »"} />
                    <Step isDark={isDark} label="Saisissez votre prénom et nom de famille en lettres arabes" />
                    <Step isDark={isDark} label='Entrez votre numéro de téléphone, puis cliquez sur "Envoyer le code"' />
                    <Step isDark={isDark} label="Ajoutez vos enfants : prénom de chaque enfant et sa halaqah (Hifz ou Talqin)" />
                    <Step isDark={isDark} label={'Cliquez sur "Envoyer la demande", puis confirmez votre numéro de téléphone'} />
                    <Step isDark={isDark} label={"L'administration examine la demande et l'approuve — votre compte est alors actif"} />
                  </div>
                  <p className={`text-xs mt-3 px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-secondary/8 border-secondary/20 text-secondary/80' : 'bg-secondary/6 border-secondary/15 text-secondary/90'
                  }`}>
                    Un seul compte suffit pour suivre tous vos enfants inscrits à la mosquée.
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="login" number="3" title="Se connecter" isDark={isDark}>
                  <p>Les parents se connectent via leur numéro de téléphone et un code SMS. Les administrateurs et enseignants utilisent un e-mail et un mot de passe.</p>
                  <p className={`font-semibold mt-3 mb-2 ${isDark ? 'text-[#f0e6c8]' : 'text-primary'}`}>Pour les parents :</p>
                  <div className="space-y-2">
                    <Step isDark={isDark} label={"Cliquez sur « Connexion » depuis la page d'accueil"} />
                    <Step isDark={isDark} label={"Sélectionnez l'onglet « Parent » (sélectionné par défaut)"} />
                    <Step isDark={isDark} label={'Entrez votre numéro de téléphone, puis cliquez sur "Envoyer le code"'} />
                    <Step isDark={isDark} label="Vous recevez un SMS contenant un code à 6 chiffres" />
                    <Step isDark={isDark} label={'Saisissez le code reçu et cliquez sur "Vérifier le code" — vous accédez à votre tableau de bord'} />
                  </div>
                  <p className={`mt-3 text-sm ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                    {"En cas de changement ou d'oubli de numéro, utilisez le lien « Numéro incorrect ? » affiché sous le formulaire."}
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="dashboard" number="4" title="Tableau de bord parent" isDark={isDark}>
                  <p>Après connexion, vous trouverez pour chaque enfant inscrit :</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label="Les dernières activités enregistrées par l'enseignant (mémorisation ou récitation)" />
                    <Step isDark={isDark} label="Le total des points accumulés et le classement mensuel" />
                    <Step isDark={isDark} label="La halaqah à laquelle appartient l'enfant" />
                  </div>
                  <p className="mt-3">
                    Les données sont mises à jour automatiquement à chaque saisie de l'enseignant, sans aucune action de votre part.
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="children" number="5" title="Gérer vos enfants" isDark={isDark}>
                  <p>Depuis votre tableau de bord, vous pouvez :</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label='Ajouter un autre enfant à votre compte via le bouton "Ajouter un enfant"' />
                    <Step isDark={isDark} label='Demander un changement de halaqah via le bouton "Changer de halaqah"' />
                    <Step isDark={isDark} label="Suivre l'état de vos demandes (en attente / acceptée / refusée)" />
                  </div>
                  <p className={`text-xs mt-3 px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-secondary/8 border-secondary/20 text-secondary/80' : 'bg-secondary/6 border-secondary/15 text-secondary/90'
                  }`}>
                    Les demandes apparaissent dans la section "Suivi des demandes" de votre tableau de bord. Vous êtes notifié dès qu'elles sont traitées.
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="points" number="6" title="Points et classement" isDark={isDark}>
                  <p>
                    Chaque activité enregistrée par l'enseignant génère des points pour l'élève, qu'il soit en halaqah Hifz ou Talqin.
                    Les points s'accumulent chaque mois pour établir le classement affiché sur la page d'accueil.
                  </p>
                  <p>
                    L'objectif est d'encourager la régularité et l'effort dans la mémorisation du Coran, dans un esprit de saine émulation.
                  </p>
                </Section>

                <Divider isDark={isDark} />

                <Section id="contact" number="7" title="Contacter l'administration" isDark={isDark}>
                  <p>Vous pouvez nous écrire de deux façons :</p>
                  <div className="space-y-2 mt-3">
                    <Step isDark={isDark} label={"Le bouton \"Nous écrire\" en bas de la page d'accueil — accessible sans connexion"} />
                    <Step isDark={isDark} label="L'icône de messagerie visible sur chaque page après connexion — réservée aux parents et enseignants" />
                  </div>
                  <p className="mt-3">
                    Vous pouvez choisir le type de votre message (demande, suggestion, réclamation, support technique) et laisser votre e-mail pour recevoir une réponse directe.
                  </p>
                </Section>
              </>
            )}

            {/* Footer within content */}
            <div className={`mt-12 pt-8 border-t text-center ${isDark ? 'border-white/10' : 'border-secondary/12'}`}>
              <p className={`font-amiri text-lg ${isDark ? 'text-secondary/60' : 'text-secondary/55'}`}>
                {isAr ? 'وفّقكم الله في تربية أبنائكم على كتابه الكريم' : "Qu'Allah bénisse vos enfants dans ce noble parcours"}
              </p>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
