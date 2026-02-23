import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { studentApi, quranApi, rankingApi, progressApi, classApi, registrationApi } from '@/lib/api';
import type { Student, Surah, Hizb, Class } from '@/types';
import Header from '@/components/common/Header';
import HizbGrid from '@/components/quran/HizbGrid';
import PointsDisplay from '@/components/student/PointsDisplay';
import TalqinParentView from '@/components/parent/TalqinParentView';
import ContactAdminButton from '@/components/common/ContactAdminButton';
import { BookOpen, Calendar, TrendingUp, PlusCircle, RefreshCw, X, AlertCircle, ChevronDown, ChevronUp, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ParentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [classRanking, setClassRanking] = useState<any[]>([]);
  const [globalRanking, setGlobalRanking] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const ACTIVITY_PER_PAGE = 7;
  const [currentHizbSurahs, setCurrentHizbSurahs] = useState<Surah[]>([]);
  const [studentClass, setStudentClass] = useState<Class | null>(null);
  // Recovery modals
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showHalaqahModal, setShowHalaqahModal] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildClassId, setNewChildClassId] = useState<number | ''>('');
  const [halaqahClasses, setHalaqahClasses] = useState<Class[]>([]);
  const [selectedNewClassId, setSelectedNewClassId] = useState<number | ''>('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryDone, setRecoveryDone] = useState('');
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [requestsPanelOpen, setRequestsPanelOpen] = useState(false);
  const [unseenSet, setUnseenSet] = useState<Set<string>>(new Set());

  const student = students.find(s => s.id === selectedStudentId) || null;

  const SEEN_KEY = `qd_seen_reqs_${user?.id}`;

  const loadMyRequests = async () => {
    try {
      const res = await registrationApi.getMyRequests();
      const requests: any[] = res.data;
      const seenRaw = localStorage.getItem(SEEN_KEY);
      const seen: Set<string> = new Set(seenRaw ? JSON.parse(seenRaw) : []);
      const newUnseen = new Set<string>();

      for (const req of requests) {
        if (req.status === 'pending') continue;
        const key = `${req.id}_${req.status}`;
        if (!seen.has(key)) newUnseen.add(key);
      }

      setMyRequests(requests);
      if (newUnseen.size > 0) {
        setUnseenSet(newUnseen);
        setRequestsPanelOpen(true);
      }
    } catch { /* silent */ }
  };

  const markAllSeen = () => {
    const seenRaw = localStorage.getItem(SEEN_KEY);
    const seen: Set<string> = new Set(seenRaw ? JSON.parse(seenRaw) : []);
    unseenSet.forEach(k => seen.add(k));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
    setUnseenSet(new Set());
  };

  useEffect(() => {
    loadData();
    loadMyRequests();

    const rankingInterval = setInterval(() => {
      if (student) loadRankings(student);
    }, 30000);
    const notifInterval = setInterval(loadMyRequests, 60000);

    return () => {
      clearInterval(rankingInterval);
      clearInterval(notifInterval);
    };
  }, [user]);

  useEffect(() => {
    if (student) {
      setActivityPage(1);
      loadRankings(student);
      loadRecentActivity(student.id);
      loadCurrentHizbSurahs(student);
      loadStudentClass(student.classId);
    }
  }, [selectedStudentId]);

  const loadStudentClass = async (classId: number) => {
    try {
      const classResponse = await classApi.getById(classId);
      setStudentClass(classResponse.data);
    } catch (error) {
      console.error('Failed to load class:', error);
    }
  };

  const loadHalaqahClasses = async () => {
    try {
      const res = await classApi.getPublic();
      setHalaqahClasses(res.data);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const handleAddChildSubmit = async () => {
    if (!newChildName.trim() || !newChildClassId) {
      setRecoveryError(t('common.fillAllFields'));
      return;
    }
    setRecoveryLoading(true);
    setRecoveryError('');
    try {
      await registrationApi.addChildAsParent({
        childFirstName: newChildName.trim(),
        classId: newChildClassId as number,
      });
      setRecoveryDone('addChild');
      setShowAddChildModal(false);
      setNewChildName('');
      setNewChildClassId('');
      setRequestsPanelOpen(true);
      setTimeout(loadMyRequests, 1200);
    } catch (err: any) {
      setRecoveryError(err.response?.data?.message || t('registration.errorRecovery'));
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleHalaqahSubmit = async () => {
    if (!selectedNewClassId) {
      setRecoveryError(t('registration.errorClassRequired'));
      return;
    }
    setRecoveryLoading(true);
    setRecoveryError('');
    try {
      await registrationApi.submitHalaqahChange({
        existingStudentId: student!.id,
        newClassId: selectedNewClassId as number,
      });
      setRecoveryDone('halaqah');
      setShowHalaqahModal(false);
      setSelectedNewClassId('');
      setRequestsPanelOpen(true);
      setTimeout(loadMyRequests, 1200);
    } catch (err: any) {
      setRecoveryError(err.response?.data?.message || t('registration.errorRecovery'));
    } finally {
      setRecoveryLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Load all students for this parent
      const studentResponse = await studentApi.getByParent(user!.id);
      const studentsData = studentResponse.data;
      setStudents(studentsData);
      
      // Select the first student by default
      if (studentsData.length > 0) {
        setSelectedStudentId(studentsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentHizbSurahs = async (studentData: Student) => {
    try {
      const [surahsResponse, hizbsResponse] = await Promise.all([
        quranApi.getSurahs(),
        quranApi.getHizbs()
      ]);
      
      // Find all surahs in the current hizb
      if (studentData.currentHizb) {
        const currentHizb = hizbsResponse.data.find((h: Hizb) => h.number === studentData.currentHizb);
        if (currentHizb) {
          const hizbSurahs = surahsResponse.data.filter((s: Surah) => 
            currentHizb.surahs.includes(s.number)
          );
          setCurrentHizbSurahs(hizbSurahs);
        }
      }
    } catch (error) {
      console.error('Failed to load surahs:', error);
    }
  };

  const loadRankings = async (studentData?: Student) => {
    const currentStudent = studentData || student;
    if (!currentStudent) return;

    try {
      // Load class ranking
      if (currentStudent.classId) {
        const classRankResponse = await rankingApi.getByClass(currentStudent.classId, 'monthly');
        setClassRanking(classRankResponse.data);
      }

      // Load global ranking
      const globalRankResponse = await rankingApi.getGlobal('monthly');
      setGlobalRanking(globalRankResponse.data);
    } catch (error) {
      console.error('Failed to load rankings:', error);
    }
  };

  const loadRecentActivity = async (studentId: number) => {
    try {
      const response = await progressApi.getByStudent(studentId, { limit: 200 });
      setRecentActivity(response.data);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-on-bg">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="card text-center">
            <h2 className="text-2xl font-bold text-primary mb-4">
              {students.length === 0 ? t('parent.noChildren') : t('parent.selectChildPrompt')}
            </h2>
            <p className="text-gray-600 mb-6">
              {students.length === 0 
                ? t('parent.pendingApproval')
                : t('parent.selectChildMessage')
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  const completedHizbs = Array.from(
    { length: Math.max(0, student.currentHizb - 1) },
    (_, i) => i + 1
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">

        {/* Requests status panel */}
        {(myRequests.length > 0 || recoveryDone) && (
          <div className="mb-6" dir="rtl">
            <button
              onClick={() => {
                if (!requestsPanelOpen && unseenSet.size > 0) markAllSeen();
                setRequestsPanelOpen(v => !v);
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[var(--color-text)]">متابعة الطلبات</span>
                {unseenSet.size > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary text-[#1e4a4c]">
                    {unseenSet.size} جديد
                  </span>
                )}
                {myRequests.length > 0 && unseenSet.size === 0 && (
                  <span className="text-xs text-[var(--color-text)] opacity-50">{myRequests.length} طلب</span>
                )}
              </div>
              {requestsPanelOpen
                ? <ChevronUp className="w-4 h-4 text-[var(--color-text)] opacity-60" />
                : <ChevronDown className="w-4 h-4 text-[var(--color-text)] opacity-60" />}
            </button>

            {requestsPanelOpen && (
              <div className="mt-1 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                {/* Submitted-but-not-yet-fetched: show pending row */}
                {recoveryDone && myRequests.length === 0 && (
                  <div className="flex items-center gap-4 px-4 py-3 border-b border-white/10">
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)] leading-tight">
                        {recoveryDone === 'addChild' ? 'طلب إضافة طفل' : 'طلب تغيير الحلقة'}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300">
                      قيد المراجعة
                    </span>
                  </div>
                )}

                {myRequests.map((req, idx) => {
                  const isUnseen = unseenSet.has(`${req.id}_${req.status}`);
                  const childName = `${req.studentFirstName} ${req.studentLastName}`.trim();
                  const typeLabel =
                    req.source === 'halaqah_change_authenticated' ? 'تغيير الحلقة'
                    : req.source === 'add_child_authenticated' ? 'إضافة طفل'
                    : 'طلب التسجيل';
                  const dateStr = new Date(req.createdAt).toLocaleDateString('ar-DZ', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  });

                  return (
                    <div
                      key={req.id}
                      className={`flex items-start gap-3 px-4 py-3 ${
                        idx < myRequests.length - 1 ? 'border-b border-white/10' : ''
                      } ${
                        isUnseen ? 'border-r-2 border-r-secondary bg-secondary/5' : ''
                      }`}
                    >
                      {/* Status indicator dot */}
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        req.status === 'pending' ? 'bg-amber-400'
                        : req.status === 'approved' ? 'bg-emerald-400'
                        : 'bg-red-400'
                      }`} />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text)] leading-tight">
                          {childName}
                          <span className="ms-2 text-[11px] font-normal opacity-60">{typeLabel}</span>
                        </p>
                        <p className="text-[11px] text-[var(--color-text)] opacity-50 mt-0.5">
                          {req.className || ''}{req.className ? ' · ' : ''}{dateStr}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isUnseen && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary/20 text-secondary">جديد</span>
                        )}
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          req.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-300'
                            : req.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-red-500/15 text-red-300'
                        }`}>
                          {req.status === 'pending' ? 'قيد المراجعة'
                            : req.status === 'approved' ? 'تمت الموافقة'
                            : 'تم الرفض'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Child Selector + Action buttons */}
        {(students.length > 1 || true) && (
          <div className="mb-6 flex flex-wrap items-start gap-4 justify-between">
            <div className="flex-1">
              {students.length > 1 && (
                <>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    {t('parent.selectChild')}
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {students.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`
                          px-6 py-3 rounded-lg font-semibold transition-all
                          ${s.id === selectedStudentId
                            ? 'bg-primary text-[#e8dcc8] shadow-lg scale-105'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-600 hover:border-primary'
                          }
                        `}
                      >
                        {s.firstName} {s.lastName}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0 mt-1">
              <button
                onClick={() => { setShowAddChildModal(true); setRecoveryError(''); loadHalaqahClasses(); }}
                className="flex items-center gap-2 px-4 py-2 bg-white/15 text-[var(--color-text)] border border-white/30 rounded-lg text-sm font-semibold hover:bg-white/25 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                {t('parent.addNewChild')}
              </button>
            </div>
          </div>
        )}

        {/* Student Profile Card */}
        <div className="card mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.firstName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {student.firstName[0]}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-primary">
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-gray-600">
                {studentClass?.name || `${t('parent.class')} ${student.classId}`}
                {studentClass?.classType === 'talqin' && (
                  <span className="ms-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    حلقة التلقين
                  </span>
                )}
              </p>
              <button
                onClick={() => { setShowHalaqahModal(true); setRecoveryError(''); loadHalaqahClasses(); }}
                className="mt-2 flex items-center gap-1.5 text-xs text-primary border border-primary/30 bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-all font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('parent.changeHalaqah')}
              </button>
            </div>
          </div>
        </div>

        {/* Conditional rendering based on class type */}
        {studentClass?.classType === 'talqin' ? (
          <TalqinParentView 
            studentId={student.id} 
            studentName={`${student.firstName} ${student.lastName}`}
            student={student}
            classRanking={classRanking}
            globalRanking={globalRanking}
          />
        ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hizb Progress */}
            <div className="card">
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-secondary" />
                {t('parent.hizbProgress')}
              </h3>
              
              <div className="mb-4 p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {t('parent.currentProgress')}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {t('parent.hizb')} {student.currentHizb} / 60
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(student.currentHizb / 60) * 100}%` }}
                  ></div>
                </div>
                
                {currentHizbSurahs.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {t('parent.surah')}{currentHizbSurahs.length > 1 ? 's' : ''} ({t('parent.hizb')} {student.currentHizb})
                      </span>
                      <div className="text-end flex-1 ms-3">
                        {currentHizbSurahs.map((surah) => (
                          <div key={surah.number} className="mb-1">
                            <div className="font-semibold text-primary text-sm">{surah.name}</div>
                            {surah.nameArabic && (
                              <div className="text-xs text-gray-600">{surah.nameArabic}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t('parent.page')} {student.currentPage}
                    </div>
                  </div>
                )}
              </div>

              <HizbGrid
                hizbs={[]}
                currentHizb={student.currentHizb}
                completedHizbs={completedHizbs}
                className="mt-4"
              />

              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span>{t('parent.completed')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-400 ring-2 ring-yellow-600"></div>
                  <span>{t('parent.inProgress')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-200"></div>
                  <span>{t('parent.notStarted')}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-secondary" />
                {t('parent.recentActivity')}
                {recentActivity.length > 0 && (
                  <span className="ms-auto text-xs font-normal text-gray-400">
                    {recentActivity.length} {t('parent.sessions') || 'جلسة'}
                  </span>
                )}
              </h3>

              {(() => {
                const totalPages = Math.ceil(recentActivity.length / ACTIVITY_PER_PAGE);
                const pageItems = recentActivity.slice(
                  (activityPage - 1) * ACTIVITY_PER_PAGE,
                  activityPage * ACTIVITY_PER_PAGE
                );

                // Build page numbers: 1 … prev current next … last
                const buildPages = (): (number | '…')[] => {
                  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
                  const pages: (number | '…')[] = [1];
                  if (activityPage > 3) pages.push('…');
                  for (let i = Math.max(2, activityPage - 1); i <= Math.min(totalPages - 1, activityPage + 1); i++) {
                    pages.push(i);
                  }
                  if (activityPage < totalPages - 2) pages.push('…');
                  pages.push(totalPages);
                  return pages;
                };

                return (
                  <>
                    <div className="space-y-3">
                      {pageItems.length > 0 ? (
                        pageItems.map((activity, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {activity.pagesMemorized > 0 && `${activity.pagesMemorized} ${t('parent.pagesMemorized')}`}
                                {activity.pagesRevised > 0 && activity.pagesMemorized > 0 && ' - '}
                                {activity.pagesRevised > 0 && `${activity.pagesRevised} ${t('parent.pagesRevised')}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(activity.date).toLocaleDateString('fr-FR')} - {activity.attendance === 'present' ? t('teacher.present') : t('teacher.absent')}
                                {activity.concentration && ` - ${t('parent.concentration')} ${activity.concentration === 'high' ? t('parent.concentrationHigh') : activity.concentration === 'medium' ? t('parent.concentrationMedium') : t('parent.concentrationLow')}`}
                              </p>
                              {activity.notes && (
                                <p className="text-sm text-gray-700 mt-2 p-2 bg-blue-50 border-s-2 border-primary rounded italic">
                                  {t('parent.note')}: {activity.notes}
                                </p>
                              )}
                            </div>
                            <span className="text-secondary font-bold flex-shrink-0">+{activity.pointsEarned}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">{t('parent.noActivity')}</p>
                      )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-5 pt-4 border-t border-secondary/10 flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Prev */}
                        <button
                          onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                          disabled={activityPage === 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-secondary/20 text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Previous"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {buildPages().map((pg, i) =>
                          pg === '…' ? (
                            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center">
                              <span className="flex items-end gap-0.5 pb-1">
                                <span className="w-1 h-1 bg-secondary/40 rounded-full" />
                                <span className="w-1 h-1 bg-secondary/40 rounded-full" />
                                <span className="w-1 h-1 bg-secondary/40 rounded-full" />
                              </span>
                            </span>
                          ) : (
                            <button
                              key={pg}
                              onClick={() => setActivityPage(pg as number)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all border ${
                                activityPage === pg
                                  ? 'bg-primary text-[#f0e6c8] border-primary shadow-sm'
                                  : 'border-secondary/15 text-gray-600 hover:bg-primary/5 hover:border-primary/30'
                              }`}
                            >
                              {pg}
                            </button>
                          )
                        )}

                        {/* Next */}
                        <button
                          onClick={() => setActivityPage(p => Math.min(totalPages, p + 1))}
                          disabled={activityPage === totalPages}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-secondary/20 text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Next"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Points Display */}
            <PointsDisplay student={student} showDetails />

            {/* Ranking Card */}
            <div className="card">
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-secondary" />
                {t('parent.ranking')}
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">
                    {t('parent.classRanking')}
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {classRanking.length > 0 
                      ? `#${classRanking.find(r => r.studentId === student?.id)?.rank || '-'}`
                      : '-'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {t('parent.on')} {classRanking.length} {classRanking.length > 1 ? t('parent.students') : t('parent.student')}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">
                    {t('parent.globalRanking')}
                  </div>
                  <div className="text-3xl font-bold text-secondary">
                    {globalRanking.length > 0 
                      ? `#${globalRanking.find(r => r.studentId === student?.id)?.rank || '-'}`
                      : '-'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {t('parent.on')} {globalRanking.length} {globalRanking.length > 1 ? t('parent.students') : t('parent.student')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      <ContactAdminButton />

      {/* Add Child Modal */}
      {showAddChildModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800" dir="rtl">{t('parent.addNewChild')}</h3>
              <button onClick={() => { setShowAddChildModal(false); setRecoveryError(''); }}><X className="w-5 h-5 text-gray-500 hover:text-gray-700" /></button>
            </div>
            <div className="space-y-3" dir="rtl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('registration.newChildFirstName')} *</label>
                <input type="text" value={newChildName} onChange={(e) => setNewChildName(e.target.value)} className="input-field" placeholder={t('registration.childFirstNamePlaceholder')} dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('registration.selectClass')} *</label>
                <select value={newChildClassId} onChange={(e) => setNewChildClassId(Number(e.target.value))} className="input-field" dir="rtl">
                  <option value="">{t('registration.chooseClass')}</option>
                  {halaqahClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {recoveryError && (
                <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{recoveryError}</p>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowAddChildModal(false); setNewChildName(''); setNewChildClassId(''); setRecoveryError(''); }} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleAddChildSubmit} disabled={recoveryLoading} className="flex-1 btn-primary py-2">
                {recoveryLoading ? t('common.loading') : t('registration.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Halaqah Change Modal */}
      {showHalaqahModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800" dir="rtl">{t('parent.changeHalaqah')}</h3>
              <button onClick={() => setShowHalaqahModal(false)}><X className="w-5 h-5 text-gray-500 hover:text-gray-700" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4 text-right" dir="rtl">
              {student.firstName} {student.lastName}
            </p>
            <div dir="rtl">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('registration.newHalaqah')} *</label>
              <select value={selectedNewClassId} onChange={(e) => setSelectedNewClassId(Number(e.target.value))} className="input-field" dir="rtl">
                <option value="">{t('registration.chooseClass')}</option>
                {halaqahClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {recoveryError && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{recoveryError}</p>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowHalaqahModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleHalaqahSubmit} disabled={recoveryLoading} className="flex-1 btn-primary py-2">
                {recoveryLoading ? t('common.loading') : t('registration.sendRecovery')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
