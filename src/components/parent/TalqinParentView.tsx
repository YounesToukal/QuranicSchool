import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { talqinApi } from '@/lib/api';
import type { Student, WeeklyAssignment, TalqinProgress } from '@/types';
import { BookOpen, Calendar, CheckCircle2, Clock, XCircle, FileText, TrendingUp, ChevronDown, ChevronUp, History } from 'lucide-react';
import PointsDisplay from '@/components/student/PointsDisplay';

interface TalqinParentViewProps {
  studentId: number;
  studentName: string;
  student: Student;
  classRanking: any[];
  globalRanking: any[];
}

export default function TalqinParentView({ studentId, student, classRanking, globalRanking }: TalqinParentViewProps) {
  const { t, i18n } = useTranslation();
  const [assignments, setAssignments] = useState<WeeklyAssignment[]>([]);
  const [progress, setProgress] = useState<TalqinProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, progressRes] = await Promise.all([
        talqinApi.getStudentAssignments(studentId),
        talqinApi.getStudentProgress(studentId, 15),
      ]);
      setAssignments(assignmentsRes.data);
      setProgress(progressRes.data);
    } catch (error) {
      console.error('Error loading Talqin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (assignmentId: number) => {
    setAcknowledging(assignmentId);
    try {
      await talqinApi.acknowledgeAssignment(assignmentId);
      setAssignments(prev =>
        prev.map(a =>
          a.id === assignmentId
            ? { ...a, parentAcknowledged: true, parentAcknowledgedAt: new Date().toISOString() }
            : a
        )
      );
    } catch (error) {
      console.error('Error acknowledging assignment:', error);
    } finally {
      setAcknowledging(null);
    }
  };

  const getAttendanceBadge = (attendance: string) => {
    switch (attendance) {
      case 'present':
        return (
          <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            {t('teacher.present')}
          </div>
        );
      case 'justified':
        return (
          <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            {t('teacher.justified')}
          </div>
        );
      case 'absent':
        return (
          <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            {t('teacher.absent')}
          </div>
        );
      default:
        return null;
    }
  };

  const getQualityBadge = (quality: string | null) => {
    if (!quality) return null;
    
    const configs: Record<string, { color: string; label: string }> = {
      excellent: { color: 'bg-green-100 text-green-700', label: t('teacher.excellent') },
      good: { color: 'bg-blue-100 text-blue-700', label: t('teacher.good') },
      needs_improvement: { color: 'bg-orange-100 text-orange-700', label: t('teacher.needsImprovement') },
      high: { color: 'bg-green-100 text-green-700', label: t('teacher.high') },
      medium: { color: 'bg-blue-100 text-blue-700', label: t('teacher.medium') },
      low: { color: 'bg-orange-100 text-orange-700', label: t('teacher.low') },
    };
    
    const config = configs[quality] || { color: 'bg-gray-100 text-gray-700', label: quality };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getStatusInfo = (status: string) => {
    const configs: Record<string, { color: string; label: string; icon: any }> = {
      completed: { color: 'bg-green-100 text-green-700 border-green-200', label: t('teacher.assignmentCompleted'), icon: CheckCircle2 },
      assigned: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: t('teacher.assignmentAssigned'), icon: Clock },
      pending: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: t('teacher.assignmentPending'), icon: FileText },
    };
    return configs[status] || configs.pending;
  };

  // Calculate statistics
  const stats = {
    totalSessions: progress.length,
    presentCount: progress.filter(p => p.attendance === 'present').length,
    excellentPronunciation: progress.filter(p => p.pronunciationQuality === 'excellent').length,
    excellentTajweed: progress.filter(p => p.tajweedQuality === 'excellent').length,
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left Column - Main Content */}
      <div className="lg:col-span-2 space-y-6 order-last lg:order-first">
        {/* Statistics Overview - Combined */}
        <div className="card bg-gradient-to-br from-primary/5 to-white border border-primary/20">
          <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {t('parent.talqinStatistics')}
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">{stats.totalSessions}</div>
              <div className="text-xs text-gray-500 mt-1">{t('parent.sessions')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.presentCount}</div>
              <div className="text-xs text-gray-500 mt-1">{t('parent.presences')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.excellentPronunciation}</div>
              <div className="text-xs text-gray-500 mt-1">{t('parent.pronunciationLabel')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{stats.excellentTajweed}</div>
              <div className="text-xs text-gray-500 mt-1">{t('parent.tajweedLabel')}</div>
            </div>
          </div>
        </div>

        {/* Recent Progress - Timeline with more spacing */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t('parent.recentProgress')}
          </h3>

          {progress.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t('parent.noProgressRecorded')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {progress.map((entry) => (
                <div
                  key={entry.id}
                  className="relative ps-8 pb-6 border-s-2 border-gray-200 last:border-transparent last:pb-0"
                >
                  {/* Timeline dot */}
                  <div className="absolute start-0 top-1.5 -translate-x-[9px] rtl:translate-x-[9px]">
                    {entry.attendance === 'present' ? (
                      <div className="w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow"></div>
                    ) : entry.attendance === 'justified' ? (
                      <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow"></div>
                    ) : (
                      <div className="w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow"></div>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-700">
                          {formatDate(entry.date)}
                        </span>
                        {getAttendanceBadge(entry.attendance)}
                      </div>
                      {entry.surahName && (
                        <div className="text-end">
                          <div className="font-medium text-gray-800">{entry.surahName}</div>
                          {entry.versesPracticed && (
                            <div className="text-xs text-gray-500">{t('parent.versesLabel')} {entry.versesPracticed}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Show quality fields only if present */}
                    {entry.attendance === 'present' && (
                      <div className="flex flex-wrap gap-2">
                        {entry.pronunciationQuality && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-500">{t('parent.pronunciationLabel')}:</span>
                            {getQualityBadge(entry.pronunciationQuality)}
                          </div>
                        )}
                        {entry.tajweedQuality && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-500">{t('parent.tajweedLabel')}:</span>
                            {getQualityBadge(entry.tajweedQuality)}
                          </div>
                        )}
                        {entry.listeningAttention && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-500">{t('parent.attentionLabel')}:</span>
                            {getQualityBadge(entry.listeningAttention)}
                          </div>
                        )}
                        {entry.repetitionAccuracy && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-500">{t('parent.precisionLabel')}:</span>
                            {getQualityBadge(entry.repetitionAccuracy)}
                          </div>
                        )}
                      </div>
                    )}

                    {entry.notes && (
                      <div className="mt-3 p-2 bg-gray-50 border-s-2 border-primary rounded text-xs text-gray-700">
                        <FileText className="w-3 h-3 inline me-1 text-primary" />
                        {entry.notes}
                      </div>
                    )}

                    {(entry.pointsEarned > 0) && (
                      <div className="mt-3 flex justify-end">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                          <span>+{entry.pointsEarned}</span>
                          <span className="text-xs font-normal opacity-75">نقاط</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


      </div>

      {/* Right Column - Assignments (TOP), Points, Ranking */}
      <div className="space-y-6 order-first lg:order-last">

        {/* Devoirs de la semaine */}
        {(() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const isOld = (a: WeeklyAssignment) => {
            const ws = new Date(a.weekStartDate);
            ws.setHours(0, 0, 0, 0);
            const we = new Date(ws);
            we.setDate(we.getDate() + 7);
            return today.getTime() > we.getTime();
          };

          const currentAssignments = assignments.filter(a => !isOld(a));
          const pastAssignments = assignments.filter(a => isOld(a));
          const pendingAssignments = currentAssignments.filter(a => !a.parentAcknowledged);
          const hasUnread = pendingAssignments.length > 0;

          return (
            <div className={`card border-2 transition-all ${
              hasUnread
                ? 'border-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.15)]'
                : 'border-primary/30'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t('parent.weeklyAssignments')}
                </h3>
                {hasUnread && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    {pendingAssignments.length} {t('parent.unconfirmed')}
                  </span>
                )}
              </div>

              {/* Current / this-week assignments */}
              {currentAssignments.length === 0 && pastAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">{t('parent.noAssignments')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentAssignments.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                      <p className="text-xs">{i18n.language === 'ar' ? 'لا واجب هذا الأسبوع' : 'Aucun devoir cette semaine'}</p>
                    </div>
                  ) : (
                    currentAssignments.map((assignment) => {
                      const isUnread = !assignment.parentAcknowledged;
                      const statusInfo = getStatusInfo(assignment.status);
                      return (
                        <div
                          key={assignment.id}
                          className={`rounded-xl border-2 overflow-hidden transition-all ${
                            isUnread ? 'border-amber-300 shadow-sm' : 'border-primary/25'
                          }`}
                        >
                          {/* NEW badge + Surah header */}
                          <div className={`px-4 py-3 ${
                            isUnread ? 'bg-amber-50' : 'bg-primary/5'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                    {t('teacher.surahToPrepare')}
                                  </p>
                                  {isUnread && (
                                    <span className="text-[10px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">
                                      {i18n.language === 'ar' ? 'جديد' : 'NEW'}
                                    </span>
                                  )}
                                </div>
                                <div className="font-bold text-gray-900">{assignment.surahName}</div>
                              </div>
                              <div className="text-end">
                                <div className="text-2xl font-bold text-primary" dir="rtl">
                                  {assignment.surahNameArabic}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="px-4 py-3 space-y-2">
                            {assignment.versesToPrepare && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                                <span><strong>{t('teacher.versesToPrepare')} :</strong> {assignment.versesToPrepare}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>{t('parent.weekOf')} {formatDate(assignment.weekStartDate)}</span>
                              <span className={`ms-auto px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            {assignment.notes && (
                              <div className="p-2.5 bg-primary/5 border-s-2 border-primary rounded text-xs text-gray-700 italic">
                                {assignment.notes}
                              </div>
                            )}
                          </div>

                          {/* Acknowledge footer */}
                          <div className={`px-4 py-3 border-t ${
                            isUnread ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-gray-50/50'
                          }`}>
                            {isUnread ? (
                              <button
                                onClick={() => handleAcknowledge(assignment.id)}
                                disabled={acknowledging === assignment.id}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                              >
                                {acknowledging === assignment.id ? (
                                  <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> {t('parent.confirming')}</>
                                ) : (
                                  <><CheckCircle2 className="w-4 h-4" /> {t('parent.acknowledgeHomework')}</>
                                )}
                              </button>
                            ) : (
                              <div className="flex items-center justify-center gap-2 text-green-700 text-sm font-medium py-1">
                                <CheckCircle2 className="w-4 h-4" />
                                {t('parent.confirmedOn')}{assignment.parentAcknowledgedAt ? ` ${formatDate(assignment.parentAcknowledgedAt)}` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* History toggle */}
                  {pastAssignments.length > 0 && (
                    <>
                      <button
                        onClick={() => setShowHistory(h => !h)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-medium transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5" />
                          {i18n.language === 'ar'
                            ? `سجل الواجبات (${pastAssignments.length})`
                            : `Historique des devoirs (${pastAssignments.length})`}
                        </span>
                        {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {showHistory && (
                        <div className="space-y-2 pt-1">
                          {pastAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50/80 opacity-80"
                            >
                              <div className="px-3 py-2.5 flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                                    {t('teacher.surahToPrepare')}
                                  </p>
                                  <div className="font-semibold text-gray-600 text-sm">{assignment.surahName}</div>
                                  {assignment.versesToPrepare && (
                                    <div className="text-xs text-gray-400 mt-0.5">{t('teacher.versesToPrepare')} : {assignment.versesToPrepare}</div>
                                  )}
                                </div>
                                <div className="text-end flex flex-col items-end gap-1">
                                  <div className="text-lg font-bold text-gray-400" dir="rtl">{assignment.surahNameArabic}</div>
                                  <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded">
                                    {i18n.language === 'ar' ? 'أسبوع منتهٍ' : 'Semaine passée'}
                                  </span>
                                </div>
                              </div>
                              <div className="px-3 py-2 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>{t('parent.weekOf')} {formatDate(assignment.weekStartDate)}</span>
                                <span className="ms-auto">
                                  {assignment.parentAcknowledged ? (
                                    <span className="flex items-center gap-1 text-green-600">
                                      <CheckCircle2 className="w-3 h-3" />
                                      {t('parent.confirmedOn')}{assignment.parentAcknowledgedAt ? ` ${formatDate(assignment.parentAcknowledgedAt)}` : ''}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">{i18n.language === 'ar' ? 'غير مؤكد' : 'Non confirmé'}</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Points */}
        <PointsDisplay student={student} showDetails={false} />

        {/* Ranking */}
        <div className="card">
          <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-secondary" />
            {t('parent.rankingTitle')}
          </h3>
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">{t('parent.halqaRanking')}</div>
              <div className="text-3xl font-bold text-primary">
                {classRanking.length > 0
                  ? `#${classRanking.find(r => r.studentId === student.id)?.rank || '-'}`
                  : '-'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {t('parent.on')} {classRanking.length} {classRanking.length !== 1 ? t('parent.students') : t('parent.student')}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">{t('parent.globalRanking')}</div>
              <div className="text-3xl font-bold text-secondary">
                {globalRanking.length > 0
                  ? `#${globalRanking.find(r => r.studentId === student.id)?.rank || '-'}`
                  : '-'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {t('parent.on')} {globalRanking.length} {globalRanking.length !== 1 ? t('parent.students') : t('parent.student')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
