import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/common/Header';
import {
  ArrowRight, ArrowLeft, BookOpen, CheckCircle2,
  LayoutDashboard, MessageCircle, RefreshCw,
  UserCheck, Award,
} from 'lucide-react';

/* ─── tiny helpers ─── */
const Divider = () => (
  <div className="flex items-center gap-3 my-8">
    <div className="h-px flex-1 bg-secondary/25" />
    <div className="flex gap-1.5">
      <div className="w-1.5 h-1.5 rotate-45 bg-secondary/50" />
      <div className="w-2   h-2   rotate-45 bg-secondary/80" />
      <div className="w-1.5 h-1.5 rotate-45 bg-secondary/50" />
    </div>
    <div className="h-px flex-1 bg-secondary/25" />
  </div>
);

interface SectionProps { id: string; icon: React.ReactNode; title: string; children: React.ReactNode; }
const Section = ({ id, icon, title, children }: SectionProps) => (
  <section id={id} className="scroll-mt-24">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary flex-shrink-0">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-primary">{title}</h2>
    </div>
    {children}
    <Divider />
  </section>
);

interface StepProps { number: number; title: string; children: React.ReactNode; }
const Step = ({ number, title, children }: StepProps) => (
  <div className="flex gap-4 mb-5">
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
      <span className="text-xs font-bold text-primary">{number}</span>
    </div>
    <div className="flex-1 pt-0.5">
      <p className="font-semibold text-primary mb-1">{title}</p>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  </div>
);

interface NoteProps { children: React.ReactNode; variant?: 'info' | 'warn'; }
const Note = ({ children, variant = 'info' }: NoteProps) => (
  <div className={`my-4 px-4 py-3 rounded-lg border-s-2 text-sm leading-relaxed ${
    variant === 'warn'
      ? 'bg-amber-50 border-amber-400 text-amber-800'
      : 'bg-primary/5 border-primary/40 text-gray-700'
  }`}>
    {children}
  </div>
);

const SECTIONS = [
  { id: 'overview',       labelAr: 'لوحة الإحصائيات',       labelFr: 'Vue d\'ensemble' },
  { id: 'registrations',  labelAr: 'طلبات التسجيل',          labelFr: 'Inscriptions' },
  { id: 'classes',        labelAr: 'الحلقات',                labelFr: 'Classes' },
  { id: 'users',          labelAr: 'الحسابات',               labelFr: 'Comptes' },
  { id: 'students',       labelAr: 'الطلاب',                 labelFr: 'Élèves' },
  { id: 'recovery',       labelAr: 'طلبات الاسترداد',        labelFr: 'Récupération' },
  { id: 'messages',       labelAr: 'الرسائل',                labelFr: 'Messages' },
];

export default function AdminGuidePage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const BackBtn = () => (
    <Link
      to="/admin"
      className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-secondary transition-colors"
    >
      {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
      {isAr ? 'العودة إلى لوحة التحكم' : 'Retour au tableau de bord'}
    </Link>
  );

  return (
    <div className="min-h-screen bg-background" dir={isAr ? 'rtl' : 'ltr'}>
      <Header />

      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* Back button — top */}
        <div className="mb-6"><BackBtn /></div>

        {/* Page header */}
        <div className="card mb-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="h-px w-16 bg-secondary/30" />
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rotate-45 bg-secondary/60" />
              <div className="w-2   h-2   rotate-45 bg-secondary" />
              <div className="w-1.5 h-1.5 rotate-45 bg-secondary/60" />
            </div>
            <div className="h-px w-16 bg-secondary/30" />
          </div>

          <p className="text-secondary font-semibold text-xs uppercase tracking-widest mb-2">
            {isAr ? 'المنصة القرآنية · مسجد أنس بن مالك' : 'Plateforme coranique · Mosquée Anas Ibn Mālik'}
          </p>
          <h1 className="text-3xl font-bold text-primary mb-2">
            {isAr ? 'دليل المسؤول' : 'Guide Administrateur'}
          </h1>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">
            {isAr
              ? 'مرجع شامل لجميع صلاحيات لوحة التحكم الإدارية وكيفية استخدامها'
              : 'Référence complète pour toutes les fonctionnalités du tableau de bord administrateur'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* TOC Sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="card sticky top-24">
              <BackBtn />
              <Divider />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                {isAr ? 'الأقسام' : 'Sections'}
              </p>
              <ul className="space-y-1">
                {SECTIONS.map(({ id, labelAr, labelFr }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="block text-sm text-primary/70 hover:text-secondary hover:ps-2 transition-all py-1 border-s-2 border-transparent hover:border-secondary ps-2"
                    >
                      {isAr ? labelAr : labelFr}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 card space-y-0">

            {/* ── Overview ── */}
            <Section id="overview" icon={<LayoutDashboard className="w-4 h-4" />} title={isAr ? 'لوحة الإحصائيات' : 'Vue d\'ensemble'}>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                {isAr
                  ? 'عند الدخول إلى لوحة التحكم تظهر تلقائيًا تبويبة الإحصائيات، وتجمع أهم البيانات في مكان واحد.'
                  : 'L\'onglet Vue d\'ensemble s\'affiche par défaut et concentre les données essentielles de la plateforme.'}
              </p>

              <Step number={1} title={isAr ? 'البطاقات الإحصائية الأربع' : 'Les quatre cartes statistiques'}>
                {isAr
                  ? 'تُعرض أعلى الصفحة أربع بطاقات: عدد الحلقات النشطة، إجمالي الطلاب المسجّلين، الطلبات المعلّقة، وإجمالي طلبات التسجيل.'
                  : 'En haut de la page : nombre de classes actives, total des élèves inscrits, demandes en attente, et total des demandes d\'inscription.'}
              </Step>
              <Step number={2} title={isAr ? 'آخر التسجيلات وتوزيع الحلقات' : 'Récentes inscriptions & répartition'}>
                {isAr
                  ? 'أسفل البطاقات قائمتان جانبيتان: آخر ثمانية طلبات تسجيل مع حالتها، وشريط توزيع الطلاب حسب الحلقة مع نسبة كل حلقة.'
                  : 'Sous les cartes : les 8 dernières demandes d\'inscription avec leur statut, et la répartition des élèves par classe avec pourcentages.'}
              </Step>
              <Step number={3} title={isAr ? 'الإحصائيات المتقدمة' : 'Statistiques avancées'}>
                {isAr
                  ? 'تُحمَّل تلقائيًا بمجرد الانتقال إلى التبويبة: إجمالي الصفحات المحفوظة والمراجَعة، الطلاب النشطون، وعدد الجلسات. تليها مقارنة نشاط المعلمين وتوزيع مستويات الحفظ ونشاط آخر ٧ أيام.'
                  : 'Chargées automatiquement à l\'ouverture : pages mémorisées & révisées au total, élèves actifs, sessions. Suivies d\'un comparatif d\'activité des enseignants, distribution des niveaux de Hizb, et activité des 7 derniers jours.'}
              </Step>
              <Step number={4} title={isAr ? 'طباعة التقرير' : 'Générer le rapport'}>
                {isAr
                  ? 'زر "طباعة التقرير" في أعلى يمين الصفحة يفتح تقريرًا مفصّلًا بصيغة قابلة للطباعة يشمل جديع الإحصائيات والحلقات وسجل التسجيلات.'
                  : 'Le bouton "Imprimer le rapport" en haut à droite génère un document imprimable avec toutes les statistiques, les classes et l\'historique des inscriptions.'}
              </Step>
              <Note>
                {isAr
                  ? 'الإحصائيات المتقدمة تُحمَّل مرة واحدة فقط لكل زيارة. استخدم زر التحديث في المتصفح إذا تريد بيانات أحدث.'
                  : 'Les statistiques avancées ne se chargent qu\'une fois par visite. Actualisez la page pour obtenir des données plus récentes.'}
              </Note>
            </Section>

            {/* ── Registrations ── */}
            <Section id="registrations" icon={<CheckCircle2 className="w-4 h-4" />} title={isAr ? 'طلبات التسجيل' : 'Inscriptions'}>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                {isAr
                  ? 'تُعرض هنا جميع الطلبات المعلّقة: التسجيل الجديد، إضافة طفل إضافي، وطلبات تغيير الحلقة.'
                  : 'Ici s\'affichent toutes les demandes en attente : nouvelles inscriptions, ajout d\'un enfant, et changements de classe.'}
              </p>
              <Step number={1} title={isAr ? 'أنواع الطلبات' : 'Types de demandes'}>
                {isAr
                  ? <>
                      يُميّز اللون الجانبي الأيسر نوع الطلب:<br />
                      <span className="font-medium text-amber-700">أصفر</span> = تسجيل جديد · <span className="font-medium text-blue-700">أزرق</span> = إضافة طفل · <span className="font-medium text-purple-700">بنفسجي</span> = تغيير حلقة
                    </>
                  : <>
                      La couleur de la bordure gauche indique le type :<br />
                      <span className="font-medium text-amber-700">Jaune</span> = nouvelle inscription · <span className="font-medium text-blue-700">Bleu</span> = ajout d'enfant · <span className="font-medium text-purple-700">Violet</span> = changement de classe
                    </>}
              </Step>
              <Step number={2} title={isAr ? 'عرض التفاصيل' : 'Voir les détails'}>
                {isAr
                  ? 'زر "التفاصيل" يعرض نافذة تضم معلومات الطالب والولي الأمر والحلقة المطلوبة والتاريخ.'
                  : 'Le bouton "Détails" ouvre une fenêtre avec les informations de l\'élève, du parent, de la classe demandée et la date.'}
              </Step>
              <Step number={3} title={isAr ? 'الموافقة أو الرفض' : 'Approuver ou refuser'}>
                {isAr
                  ? 'زر "قبول الطلب" يُسجّل الطالب في الحلقة ويُرسل للولي إشعارًا. زر "رفض" يُلغي الطلب ويُحدّث حالته.'
                  : 'Le bouton "Accepter" inscrit l\'élève et notifie le parent. Le bouton "Refuser" annule la demande et met à jour son statut.'}
              </Step>
              <Note variant="warn">
                {isAr
                  ? 'الطلبات المعلّقة تظهر في أعلى التبويبة مع عداد أحمر في الشريط العلوي. تصفّح هذه التبويبة دوريًا للبقاء محدّثًا.'
                  : 'Les demandes en attente sont signalées par un compteur rouge dans la barre de navigation. Vérifiez régulièrement.'}
              </Note>
            </Section>

            {/* ── Classes ── */}
            <Section id="classes" icon={<BookOpen className="w-4 h-4" />} title={isAr ? 'الحلقات' : 'Classes'}>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                {isAr
                  ? 'إدارة حلقات المدرسة: إنشاء حلقات الحفظ والتلقين، تعديلها وحذفها.'
                  : 'Gestion des classes de l\'école : création de classes de Hifz et de Talqin, modification et suppression.'}
              </p>
              <Step number={1} title={isAr ? 'إنشاء حلقة جديدة' : 'Créer une nouvelle classe'}>
                {isAr
                  ? 'انقر "إنشاء حلقة"، أدخل اسم الشيخ واختر النوع (حفظ / تلقين)، ثم احفظ. سيُصبح اسم الحلقة تلقائيًا "Halaqat Sheikh [الاسم]".'
                  : 'Cliquez "Créer une classe", saisissez le nom du cheikh et choisissez le type (Hifz / Talqin), puis enregistrez. Le nom sera automatiquement "Halaqat Sheikh [nom]".'}
              </Step>
              <Step number={2} title={isAr ? 'صنفا الحلقات' : 'Deux types de classes'}>
                {isAr
                  ? <>
                      <span className="font-medium text-green-700">حلقة الحفظ</span>: لحفظ القرآن الكريم — تُعرض بتمييز أخضر.<br />
                      <span className="font-medium text-blue-700">حلقة التلقين</span>: للأطفال الصغار الذين يتعلمون عن طريق السماع والترديد — تُعرض بتمييز أزرق.
                    </>
                  : <>
                      <span className="font-medium text-green-700">Hifz</span> : mémorisation du Coran — affichage vert.<br />
                      <span className="font-medium text-blue-700">Talqin</span> : pour les petits enfants, apprentissage par écoute et répétition — affichage bleu.
                    </>}
              </Step>
              <Step number={3} title={isAr ? 'تعديل الحلقة' : 'Modifier une classe'}>
                {isAr
                  ? 'زر "تعديل" في بطاقة كل حلقة يتيح تغيير اسمها أو اسم الشيخ المسؤول. لا يُغيّر هذا انتسابات الطلاب.'
                  : 'Le bouton "Modifier" de chaque carte permet de changer le nom ou le cheikh responsable sans affecter les élèves inscrits.'}
              </Step>
              <Step number={4} title={isAr ? 'حذف الحلقة' : 'Supprimer une classe'}>
                {isAr
                  ? 'لا يمكن حذف حلقة بها طلاب. يجب نقل جميع طلابها إلى حلقة أخرى أولًا، ثم المتابعة بالحذف.'
                  : 'Il n\'est pas possible de supprimer une classe contenant des élèves. Transférez-les d\'abord vers une autre classe.'}
              </Step>
              <Note>
                {isAr ? 'يمكن الاطلاع على تفاصيل الطلاب في كل حلقة عبر زر "عرض التفاصيل".' : 'Le bouton "Voir les détails" affiche la liste des élèves de chaque classe.'}
              </Note>
            </Section>

            {/* ── Users ── */}
            <Section id="users" icon={<UserCheck className="w-4 h-4" />} title={isAr ? 'الحسابات' : 'Comptes parents'}>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                {isAr
                  ? 'قائمة بجميع حسابات أولياء الأمور مع إمكانية التعديل والتعليق والحذف.'
                  : 'Liste de tous les comptes parents avec possibilité de modifier, suspendre ou supprimer.'}
              </p>
              <Step number={1} title={isAr ? 'عداد الدخول' : 'Compteur de connexions'}>
                {isAr
                  ? 'يُظهر الجدول عدد مرات دخول كل والٍ. حساب بعداد صفري يعني أنه لم يُسجّل دخوله حتى الآن.'
                  : 'Le tableau affiche le nombre de connexions de chaque parent. Un compteur à zéro signifie que le compte n\'a jamais été utilisé.'}
              </Step>
              <Step number={2} title={isAr ? 'تعليق الحساب / تنشيطه' : 'Suspendre / Activer'}>
                {isAr
                  ? 'زر "تعليق" يمنع ولي الأمر من الدخول مع الاحتفاظ بياناته. يمكن كتابة سبب التعليق اختياريًا. زر "تنشيط" يرفع التعليق.'
                  : 'Le bouton "Suspendre" empêche la connexion tout en conservant les données. Une raison optionnelle peut être saisie. "Activer" lève la suspension.'}
              </Step>
              <Step number={3} title={isAr ? 'حذف الحساب' : 'Supprimer un compte'}>
                {isAr
                  ? 'الحذف نهائي ولا يمكن التراجع عنه. تحقق من نقل بيانات الطلاب قبل حذف أي حساب.'
                  : 'La suppression est définitive et irréversible. Assurez-vous que les données des élèves sont traitées avant de procéder.'}
              </Step>
              <Note variant="warn">
                {isAr
                  ? 'الحسابات المعلّقة تظهر بخلفية مائلة للأحمر في الجدول وعليها علامة "موقوف".'
                  : 'Les comptes suspendus apparaissent sur fond rouge dans le tableau avec le badge "Suspendu".'}
              </Note>
            </Section>

            {/* ── Students ── */}
            <Section id="students" icon={<Award className="w-4 h-4" />} title={isAr ? 'الطلاب' : 'Élèves'}>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                {isAr
                  ? 'جدول شامل بجميع الطلاب المسجّلين مع إمكانية تعديل بياناتهم أو نقلهم أو حذفهم.'
                  : 'Tableau complet de tous les élèves inscrits, avec modification, transfert et suppression.'}
              </p>
              <Step number={1} title={isAr ? 'تعديل بيانات طالب' : 'Modifier un élève'}>
                {isAr
                  ? 'زر "تعديل" يفتح نموذجًا لتغيير الاسم الأول والأخير والحلقة المنتسب إليها.'
                  : 'Le bouton "Modifier" ouvre un formulaire pour changer le prénom, le nom et la classe de l\'élève.'}
              </Step>
              <Step number={2} title={isAr ? 'نقل الطالب إلى حلقة أخرى' : 'Transférer vers une autre classe'}>
                {isAr
                  ? 'يتم النقل من نفس نموذج التعديل بتغيير الحلقة من القائمة المنسدلة. سيظهر الطالب في الحلقة الجديدة فورًا.'
                  : 'Le transfert s\'effectue dans le formulaire de modification en changeant la classe dans la liste déroulante. L\'élève apparaît immédiatement dans la nouvelle classe.'}
              </Step>
              <Step number={3} title={isAr ? 'حذف طالب' : 'Supprimer un élève'}>
                {isAr
                  ? 'الحذف نهائي ويزيل سجل تقدم الطالب بالكامل. تأكد قبل المتابعة.'
                  : 'La suppression est définitive et efface tout l\'historique de progression. Confirmez avant de procéder.'}
              </Step>
            </Section>

            {/* ── Recovery ── */}
            <Section id="recovery" icon={<RefreshCw className="w-4 h-4" />} title={isAr ? 'طلبات الاسترداد' : 'Récupération de compte'}>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                {isAr
                  ? 'تجمع هذه التبويبة طلبات أولياء الأمور لتصحيح أخطاء الحسابات أو طلب إضافة طفل أو تغيير حلقة.'
                  : 'Cet onglet regroupe les demandes de correction de compte, d\'ajout d\'enfant et de changement de classe soumises par les parents.'}
              </p>
              <Step number={1} title={isAr ? 'أنواع طلبات الاسترداد' : 'Types de demandes'}>
                {isAr
                  ? <>
                      <span className="font-medium">تصحيح رقم الهاتف</span>: لولي الأمر يطلب تغيير رقمه لأنه أخطأ عند التسجيل.<br />
                      <span className="font-medium">إضافة طفل</span>: طلب إضافة طفل إضافي لنفس الحساب.<br />
                      <span className="font-medium">تغيير حلقة</span>: طلب نقل الطالب إلى حلقة أخرى.
                    </>
                  : <>
                      <span className="font-medium">Correction de numéro</span> : parent qui a fait une erreur lors de l'inscription.<br />
                      <span className="font-medium">Ajout d'enfant</span> : demande d'inscription d'un enfant supplémentaire.<br />
                      <span className="font-medium">Changement de classe</span> : demande de transfert vers une autre classe.
                    </>}
              </Step>
              <Step number={2} title={isAr ? 'الموافقة على الطلب' : 'Approuver la demande'}>
                {isAr
                  ? 'عند الموافقة يُطبَّق التغيير المطلوب تلقائيًا (رقم جديد، طالب مضاف، نقل لحلقة). تظهر رسالة تأكيد.'
                  : 'L\'approbation applique automatiquement la modification demandée (nouveau numéro, élève ajouté, transfert). Un message de confirmation s\'affiche.'}
              </Step>
              <Step number={3} title={isAr ? 'تعليق الحساب عبر الطلب' : 'Suspendre via la demande'}>
                {isAr
                  ? 'إذا كان الطلب مشبوهًا يمكن تعليق حساب ولي الأمر مباشرة من هنا دون الانتقال إلى تبويبة الحسابات.'
                  : 'Si la demande est suspecte, le compte peut être suspendu directement ici sans passer par l\'onglet Comptes.'}
              </Step>
              <Step number={4} title={isAr ? 'رفض الطلب' : 'Rejeter la demande'}>
                {isAr
                  ? 'يُلغي الطلب ويُبقي الحالة الحالية دون تغيير. ولي الأمر لا يتلقى إشعارًا تلقائيًا.'
                  : 'Annule la demande et conserve l\'état actuel. Le parent ne reçoit pas de notification automatique.'}
              </Step>
              <Note variant="warn">
                {isAr
                  ? 'الطلبات المعلّقة تُسبب عداد أحمر في الشريط العلوي. تحقق منها بانتظام.'
                  : 'Les demandes en attente génèrent un compteur rouge dans la barre. Vérifiez-les régulièrement.'}
              </Note>
            </Section>

            {/* ── Messages ── */}
            <Section id="messages" icon={<MessageCircle className="w-4 h-4" />} title={isAr ? 'الرسائل' : 'Messages'}>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                {isAr
                  ? 'تستقبل هذه التبويبة جميع الرسائل الواردة من أولياء الأمور والمعلمين والزوار عبر نموذج التواصل في المنصة.'
                  : 'Cet onglet reçoit tous les messages des parents, enseignants et visiteurs envoyés via le formulaire de contact de la plateforme.'}
              </p>
              <Step number={1} title={isAr ? 'قراءة الرسائل' : 'Lire les messages'}>
                {isAr
                  ? 'انقر على رسالة من القائمة للاطلاع على محتواها. تُصنَّف الرسائل تلقائيًا كمقروءة بمجرد فتحها.'
                  : 'Cliquez sur un message de la liste pour le consulter. Il est automatiquement marqué comme lu à l\'ouverture.'}
              </Step>
              <Step number={2} title={isAr ? 'أنواع الرسائل' : 'Types de messages'}>
                {isAr
                  ? 'كل رسالة تحمل نوعًا: استفسار، اقتراح، شكوى، دعم تقني. الرسائل الواردة من أولياء الأمور قد تحتوي على بريد إلكتروني للرد.'
                  : 'Chaque message porte un type : enquête, suggestion, réclamation, assistance technique. Les messages parents peuvent inclure un e-mail pour la réponse.'}
              </Step>
              <Step number={3} title={isAr ? 'الرد على المرسِل' : 'Répondre à l\'expéditeur'}>
                {isAr
                  ? 'إذا أدرج ولي الأمر بريده الإلكتروني فيمكن الرد عليه مباشرة من خارج المنصة (البريد الإلكتروني). المنصة لا تتضمن مربع رد مدمجًا للمسؤول.'
                  : 'Si le parent a fourni son e-mail, répondez-lui directement par e-mail. La plateforme ne dispose pas d\'une boîte de réponse intégrée pour l\'administrateur.'}
              </Step>
              <Step number={4} title={isAr ? 'حذف الرسائل' : 'Supprimer des messages'}>
                {isAr
                  ? 'يمكن حذف أي رسالة بعد الاطلاع عليها. الحذف نهائي.'
                  : 'Tout message peut être supprimé après lecture. La suppression est définitive.'}
              </Step>
              <Note>
                {isAr
                  ? 'الرسائل غير المقروءة تُعرض بعداد أحمر في تبويبة الرسائل ويصلك تنبيه بها بالبريد الإلكتروني تلقائيًا.'
                  : 'Les messages non lus génèrent un compteur rouge dans l\'onglet et une notification par e-mail automatique.'}
              </Note>
            </Section>

            {/* Closing note */}
            <div className="text-center py-6">
              <div className="flex items-center justify-center gap-2 mb-5">
                <div className="h-px w-16 bg-secondary/30" />
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rotate-45 bg-secondary/60" />
                  <div className="w-2   h-2   rotate-45 bg-secondary" />
                  <div className="w-1.5 h-1.5 rotate-45 bg-secondary/60" />
                </div>
                <div className="h-px w-16 bg-secondary/30" />
              </div>
              <p className="text-sm text-gray-500 italic leading-relaxed">
                {isAr
                  ? 'جعل الله هذا الجهد في خدمة كتابه العزيز ذخرًا وثوابًا دائمًا.'
                  : 'Que cet effort au service du Noble Coran soit une récompense durable auprès d\'Allah.'}
              </p>
              <div className="mt-6"><BackBtn /></div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
