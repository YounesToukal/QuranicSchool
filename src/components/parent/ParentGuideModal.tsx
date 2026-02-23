import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/themeStore';
import { X, BookMarked } from 'lucide-react';

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-secondary/15'}`} />
      <div className="flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rotate-45 ${isDark ? 'bg-secondary/40' : 'bg-secondary/35'}`} />
        <div className={`w-2 h-2 rotate-45 ${isDark ? 'bg-secondary/65' : 'bg-secondary/55'}`} />
        <div className={`w-1.5 h-1.5 rotate-45 ${isDark ? 'bg-secondary/40' : 'bg-secondary/35'}`} />
      </div>
      <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-secondary/15'}`} />
    </div>
  );
}

function Section({
  number,
  title,
  children,
  isDark,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
          isDark ? 'bg-secondary/20 text-secondary' : 'bg-secondary/15 text-secondary'
        }`}>
          {number}
        </span>
        <h3 className={`text-base font-bold ${isDark ? 'text-[#f0e6c8]' : 'text-primary'}`}>
          {title}
        </h3>
      </div>
      <div className={`ps-9 space-y-2 text-sm leading-loose ${isDark ? 'text-white/68' : 'text-gray-600'}`}>
        {children}
      </div>
    </div>
  );
}

function Step({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border ${
      isDark ? 'bg-white/5 border-white/8' : 'bg-primary/3 border-primary/8'
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full mt-[7px] flex-shrink-0 ${isDark ? 'bg-secondary/65' : 'bg-secondary'}`} />
      <p className={isDark ? 'text-[#e8dcc8]' : 'text-gray-700'}>{label}</p>
    </div>
  );
}

function Note({ text, isDark }: { text: string; isDark: boolean }) {
  return (
    <p className={`text-xs px-3 py-2 rounded-lg border mt-2 ${
      isDark ? 'bg-secondary/8 border-secondary/20 text-secondary/80' : 'bg-secondary/6 border-secondary/15 text-secondary/90'
    }`}>
      {text}
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ParentGuideModal() {
  const { i18n } = useTranslation();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const isAr = i18n.language === 'ar';
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger button — styled to match the guide link in header */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/70 hover:text-secondary hover:bg-white/10 transition-all text-sm border border-transparent hover:border-white/15"
        title={isAr ? 'دليل لوحتك' : 'Guide du tableau de bord'}
      >
        <BookMarked className="w-4 h-4" />
        <span className="text-xs font-medium">{isAr ? 'دليل لوحتك' : 'Mon guide'}</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className={`relative w-full max-w-lg max-h-[88vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${
              isDark ? 'bg-[#1a3e40] border border-white/10' : 'bg-white border border-secondary/12'
            }`}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${
              isDark ? 'border-white/10 bg-[#163336]' : 'border-secondary/10 bg-[#1e4a4c]'
            }`}>
              {/* Basmala + title */}
              <div>
                <p className="font-amiri text-sm text-secondary/80 leading-none mb-0.5">
                  بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                </p>
                <h2 className="text-base font-bold text-white">
                  {isAr ? 'دليل لوحة المتابعة' : 'Guide du tableau de bord'}
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-1">

              {isAr ? (
                <>
                  {/* ١ — Overview */}
                  <Section number="١" title="ما الذي تعرضه لوحتك" isDark={isDark}>
                    <p>
                      عند تسجيل الدخول ستجد بطاقة لكل طفل مسجّل تعرض:
                    </p>
                    <div className="space-y-1.5 mt-2">
                      <Step isDark={isDark} label="اسمه الكامل وحلقته (حفظ أو تلقين)" />
                      <Step isDark={isDark} label="آخر نشاط سجّله المعلم (حفظ أو تلاوة)" />
                      <Step isDark={isDark} label="نقاطه المتراكمة هذا الشهر وترتيبه في الحلقة والترتيب العام" />
                      <Step isDark={isDark} label="شبكة الأحزاب التي قطعها حتى الآن" />
                    </div>
                  </Section>

                  <Divider isDark={isDark} />

                  {/* ٢ — Auto-update */}
                  <Section number="٢" title="كيف تتحدث البيانات" isDark={isDark}>
                    <p>
                      لا يتطلب الأمر أي إجراء منكم — البيانات تتحدث تلقائيًا في كل مرة يُسجّل المعلم نشاطًا جديدًا.
                    </p>
                    <div className="space-y-1.5 mt-2">
                      <Step isDark={isDark} label="يُسجّل المعلم الحضور والأداء عبر لوحة التحكم الخاصة به" />
                      <Step isDark={isDark} label="تظهر النقاط والأنشطة الجديدة عند تحديث الصفحة أو بعد 30 ثانية تلقائيًا" />
                      <Step isDark={isDark} label="يُحسَب الترتيب الشهري من مجموع نقاط الطلاب في الحلقة ذاتها" />
                    </div>
                    <Note isDark={isDark} text="إن لم تجدوا تحديثًا منذ فترة، تأكدوا من حضور ابنكم — فالنقاط مرتبطة بالحضور والأداء الفعلي." />
                  </Section>

                  <Divider isDark={isDark} />

                  {/* ٣ — Managing children */}
                  <Section number="٣" title="إدارة أبنائكم" isDark={isDark}>
                    <p>يمكنكم من لوحة التحكم:</p>
                    <div className="space-y-1.5 mt-2">
                      <Step isDark={isDark} label="التنقّل بين أبنائكم عبر أزرار الأسماء في أعلى الصفحة (إن كان لديكم أكثر من طفل)" />
                      <Step isDark={isDark} label='إضافة طفل آخر عبر زر "إضافة طفل جديد" — سيُرسَل الطلب للمشرف للمراجعة' />
                      <Step isDark={isDark} label='طلب تغيير حلقة طفل عبر زر "تغيير الحلقة" الظاهر في بطاقته' />
                    </div>
                    <Note isDark={isDark} text="يكفي حساب واحد لمتابعة جميع أبنائكم — لا تحتاجون لتسجيل منفصل لكل طفل." />
                  </Section>

                  <Divider isDark={isDark} />

                  {/* ٤ — Requests */}
                  <Section number="٤" title="متابعة طلباتكم" isDark={isDark}>
                    <p>
                      يظهر في أعلى لوحتكم شريط «متابعة الطلبات» يجمع كل طلباتكم المُرسَلة.
                    </p>
                    <div className="space-y-1.5 mt-2">
                      <Step isDark={isDark} label="نقطة صفراء: الطلب قيد المراجعة" />
                      <Step isDark={isDark} label="نقطة خضراء: تمت الموافقة" />
                      <Step isDark={isDark} label="نقطة حمراء: تم الرفض — يمكن إرسال طلب جديد" />
                    </div>
                    <Note isDark={isDark} text="تظهر إشعارات «جديد» تلقائيًا عند تغيّر حالة أي طلب." />
                  </Section>

                  <Divider isDark={isDark} />

                  {/* ٥ — Contact */}
                  <Section number="٥" title="التواصل مع الإدارة" isDark={isDark}>
                    <p>
                      يمكنكم مراسلة المشرفين في أي وقت عبر أيقونة الرسالة الظاهرة في كل صفحة بعد تسجيل الدخول.
                      اختاروا نوع رسالتكم (استفسار، اقتراح، شكوى، دعم تقني) وأضيفوا بريدكم لتلقّي الرد.
                    </p>
                  </Section>

                  {/* Closing dua */}
                  <div className="pt-4 mt-2 text-center border-t border-secondary/10">
                    <p className={`font-amiri text-base ${isDark ? 'text-secondary/60' : 'text-secondary/55'}`}>
                      وفّقكم الله في تربية أبنائكم على كتابه الكريم
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* 1 — Overview */}
                  <Section number="1" title="Ce que affiche votre tableau de bord" isDark={isDark}>
                    <p>
                      À la connexion, vous trouvez une fiche pour chaque enfant inscrit, affichant :
                    </p>
                    <div className="space-y-1.5 mt-2">
                      <Step isDark={isDark} label="Son nom complet et sa halaqah (Hifz ou Talqin)" />
                      <Step isDark={isDark} label="La dernière activité enregistrée par l'enseignant" />
                      <Step isDark={isDark} label="Ses points du mois et son classement (halaqah et général)" />
                      <Step isDark={isDark} label="La grille des hizbs parcourus jusqu'à présent" />
                    </div>
                  </Section>

                  <Divider isDark={isDark} />

                  {/* 2 — Auto-update */}
                  <Section number="2" title="Comment les données se mettent à jour" isDark={isDark}>
                    <p>
                      {"Aucune action de votre part n'est requise — les données se mettent à jour automatiquement à chaque saisie de l'enseignant."}
                    </p>
                    <div className="space-y-1.5 mt-2">
                      <Step isDark={isDark} label="L'enseignant enregistre la présence et les performances depuis son propre espace" />
                      <Step isDark={isDark} label="Points et activités apparaissent au rechargement de la page ou après 30 secondes" />
                      <Step isDark={isDark} label="Le classement mensuel est calculé à partir du total des points de chaque halaqah" />
                    </div>
                    <Note isDark={isDark} text="Si aucune mise à jour n'apparaît depuis un moment, vérifiez la présence de votre enfant — les points sont liés à sa participation effective." />
                  </Section>

                  <Divider isDark={isDark} />

                  {/* 3 — Managing children */}
                  <Section number="3" title="Gérer vos enfants" isDark={isDark}>
                    <p>{"Depuis votre tableau de bord, vous pouvez :"}</p>
                    <div className="space-y-1.5 mt-2">
                      <Step isDark={isDark} label="Naviguer entre vos enfants via les boutons de noms en haut de la page (si vous en avez plusieurs)" />
                      <Step isDark={isDark} label={"Ajouter un autre enfant via le bouton \"Ajouter un enfant\" — la demande est envoyée à l'administrateur pour examen"} />
                      <Step isDark={isDark} label={"Demander un changement de halaqah via le bouton \"Changer de halaqah\" affiché sur sa fiche"} />
                    </div>
                    <Note isDark={isDark} text="Un seul compte suffit pour suivre tous vos enfants inscrits à la mosquée." />
                  </Section>

                  <Divider isDark={isDark} />

                  {/* 4 — Requests */}
                  <Section number="4" title="Suivi de vos demandes" isDark={isDark}>
                    <p>
                      {"Un panneau \"Suivi des demandes\" en haut de votre tableau regroupe toutes vos demandes envoyées."}
                    </p>
                    <div className="space-y-1.5 mt-2">
                      <Step isDark={isDark} label="Point jaune : demande en cours d'examen" />
                      <Step isDark={isDark} label="Point vert : demande acceptée" />
                      <Step isDark={isDark} label="Point rouge : demande refusée — une nouvelle demande peut être soumise" />
                    </div>
                    <Note isDark={isDark} text="Des badges « Nouveau » apparaissent automatiquement dès qu'une demande change de statut." />
                  </Section>

                  <Divider isDark={isDark} />

                  {/* 5 — Contact */}
                  <Section number="5" title="Contacter l'administration" isDark={isDark}>
                    <p>
                      {"Vous pouvez écrire aux administrateurs à tout moment via l'icône de messagerie visible sur chaque page après connexion. Choisissez le type de votre message et laissez votre e-mail pour recevoir une réponse directe."}
                    </p>
                  </Section>

                  {/* Closing dua */}
                  <div className="pt-4 mt-2 text-center border-t border-secondary/10">
                    <p className={`font-amiri text-base ${isDark ? 'text-secondary/60' : 'text-secondary/55'}`}>
                      {"Qu'Allah bénisse vos enfants dans ce noble parcours"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
