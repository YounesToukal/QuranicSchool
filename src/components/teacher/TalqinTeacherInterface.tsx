import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { talqinApi, quranApi, studentApi } from '@/lib/api';
import type { Student, Surah } from '@/types';
import { BookOpen, CheckCircle2, Calendar, Printer, Save } from 'lucide-react';

interface TalqinTeacherInterfaceProps {
  classId: number;
}

export default function TalqinTeacherInterface({ classId }: TalqinTeacherInterfaceProps) {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentsLoggedToday, setStudentsLoggedToday] = useState<Set<number>>(new Set());
  const [studentsWithAssignment, setStudentsWithAssignment] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'logged' | 'not-logged'>('all');

  const [progressForm, setProgressForm] = useState({
    surahPracticed: '',
    versesPracticed: '',
    pronunciationQuality: '' as '' | 'excellent' | 'good' | 'needs_improvement',
    tajweedQuality: '' as '' | 'excellent' | 'good' | 'needs_improvement',
    listeningAttention: '' as '' | 'high' | 'medium' | 'low',
    repetitionAccuracy: '' as '' | 'excellent' | 'good' | 'needs_improvement',
    attendance: '' as '' | 'present' | 'absent' | 'justified',
    notes: '',
  });

  const [assignmentForm, setAssignmentForm] = useState({
    surahId: '',
    versesToPrepare: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      const [studentsRes, surahsRes] = await Promise.all([
        studentApi.getByClass(classId),
        quranApi.getSurahs(),
      ]);
      const studentsList = studentsRes.data;
      setStudents(studentsList);
      setSurahs(surahsRes.data);
      
      await checkTodayProgress(studentsList);
      await checkActiveAssignments(studentsList);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const checkTodayProgress = async (studentsList: Student[]) => {
    const today = new Date();
    const loggedSet = new Set<number>();
    
    await Promise.all(
      studentsList.map(async (student) => {
        try {
          const response = await talqinApi.getStudentProgress(student.id, 10);
          if (response.data && response.data.length > 0) {
            const hasToday = response.data.some((record: any) => {
              // Convert the database date (which may be UTC) to local date
              const recordDate = new Date(record.date);
              const recordDateString = recordDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
              const todayLocal = today.toLocaleDateString('en-CA');
              return recordDateString === todayLocal;
            });
            if (hasToday) {
              loggedSet.add(student.id);
            }
          }
        } catch (error) {
          console.error(`Error checking progress for student ${student.id}:`, error);
        }
      })
    );
    
    setStudentsLoggedToday(loggedSet);
  };

  const checkActiveAssignments = async (studentsList: Student[]) => {
    const assignmentSet = new Set<number>();
    
    await Promise.all(
      studentsList.map(async (student) => {
        try {
          const response = await talqinApi.getStudentAssignments(student.id);
          if (response.data && response.data.length > 0) {
            const activeAssignments = response.data.filter(
              (a: any) => a.status === 'pending' || a.status === 'in_progress'
            );
            if (activeAssignments.length > 0) {
              assignmentSet.add(student.id);
            }
          }
        } catch (error) {
          console.error(`Error checking assignments for student ${student.id}:`, error);
        }
      })
    );
    
    setStudentsWithAssignment(assignmentSet);
  };

  const getNextMonday = () => {
    const today = new Date();
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    today.setDate(today.getDate() + daysUntilMonday);
    return today.toISOString().split('T')[0];
  };

  const calculateTalqinPoints = (): number => {
    if (progressForm.attendance === 'absent') return 0;
    if (progressForm.attendance === 'justified') return 5;
    if (progressForm.attendance !== 'present') return 0;

    let points = 20; // Présence

    // Prononciation
    if (progressForm.pronunciationQuality === 'excellent') points += 25;
    else if (progressForm.pronunciationQuality === 'good') points += 15;
    else if (progressForm.pronunciationQuality === 'needs_improvement') points += 5;

    // Tajweed
    if (progressForm.tajweedQuality === 'excellent') points += 20;
    else if (progressForm.tajweedQuality === 'good') points += 12;
    else if (progressForm.tajweedQuality === 'needs_improvement') points += 5;

    // Attention à l'écoute
    if (progressForm.listeningAttention === 'high') points += 15;
    else if (progressForm.listeningAttention === 'medium') points += 8;
    else if (progressForm.listeningAttention === 'low') points += 3;

    // Précision
    if (progressForm.repetitionAccuracy === 'excellent') points += 20;
    else if (progressForm.repetitionAccuracy === 'good') points += 12;
    else if (progressForm.repetitionAccuracy === 'needs_improvement') points += 5;

    // Bonus séance parfaite
    if (
      progressForm.pronunciationQuality === 'excellent' &&
      progressForm.tajweedQuality === 'excellent' &&
      progressForm.listeningAttention === 'high' &&
      progressForm.repetitionAccuracy === 'excellent'
    ) {
      points += 30;
    }

    return points;
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    // Validate attendance is selected
    if (!progressForm.attendance) {
      alert(t('common.pleaseSelectAttendance'));
      return;
    }

    // Validate all required quality fields only if present
    if (progressForm.attendance === 'present') {
      if (!progressForm.pronunciationQuality || !progressForm.tajweedQuality || 
          !progressForm.listeningAttention || !progressForm.repetitionAccuracy) {
        alert(t('teacher.pleaseSelectAllEvaluations'));
        return;
      }
    }

    setLoading(true);
    try {
      const progressData = {
        studentId: selectedStudent.id,
        date: new Date().toISOString().split('T')[0],
        surahPracticed: progressForm.surahPracticed || null,
        versesPracticed: progressForm.versesPracticed || null,
        attendance: progressForm.attendance,
        notes: progressForm.notes || null,
        // If present, include quality fields, otherwise set to null
        pronunciationQuality: progressForm.attendance === 'present' ? progressForm.pronunciationQuality : null,
        tajweedQuality: progressForm.attendance === 'present' ? progressForm.tajweedQuality : null,
        listeningAttention: progressForm.attendance === 'present' ? progressForm.listeningAttention : null,
        repetitionAccuracy: progressForm.attendance === 'present' ? progressForm.repetitionAccuracy : null,
        pointsEarned: calculateTalqinPoints(),
      };

      console.log('Sending progress data:', progressData);
      
      await talqinApi.createProgress(progressData);

      alert(t('common.progressSavedSuccess'));
      setShowProgressForm(false);
      setSelectedStudent(null);
      resetProgressForm();
      await checkTodayProgress(students);
    } catch (error) {
      console.error('Error saving progress:', error);
      alert(t('common.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedStudent) {
        await talqinApi.createAssignment({
          classId,
          studentId: selectedStudent.id,
          weekStartDate: getNextMonday(),
          ...assignmentForm,
        });
        alert(t('common.assignmentCreatedSuccess'));
      }

      setShowAssignmentForm(false);
      setSelectedStudent(null);
      resetAssignmentForm();
      await checkActiveAssignments(students);
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert(t('common.errorCreating'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = async () => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log('Generating report with:', { classId, startDate, endDate });

    try {
      const response = await talqinApi.getClassReport(classId, startDate, endDate);
      const reportData = response.data;

      console.log('Report data received:', reportData);

      if (!reportData || reportData.length === 0) {
        alert(t('common.noDataAvailable'));
        return;
      }

      // Create printable report
      const printWindow = window.open('', '', 'height=600,width=800');
      if (!printWindow) return;

      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>تقرير التلقين</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; color: #2563eb; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: center; }
              th { background-color: #2563eb; color: white; }
              tr:nth-child(even) { background-color: #f9fafb; }
              .header { text-align: center; margin-bottom: 30px; }
              .date { color: #6b7280; font-size: 14px; }
              @media print {
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>تقرير التلقين</h1>
              <p class="date">من ${startDate} إلى ${endDate}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>اسم الطالب</th>
                  <th>عدد الجلسات</th>
                  <th>الحضور</th>
                  <th>النطق الممتاز</th>
                  <th>التجويد الممتاز</th>
                  <th>متوسط الانتباه</th>
                  <th>متوسط الدقة</th>
                  <th>نقاط البركة</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.map((student: any) => `
                  <tr>
                    <td>${student.studentName}</td>
                    <td>${student.totalSessions}</td>
                    <td>${student.attendanceCount}</td>
                    <td>${student.excellentPronunciation}</td>
                    <td>${student.excellentTajweed}</td>
                    <td>${(parseFloat(student.avgAttention) || 0).toFixed(1)}/3</td>
                    <td>${(parseFloat(student.avgAccuracy) || 0).toFixed(1)}/3</td>
                    <td><strong>${student.totalPoints || 0}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top: 40px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">
                طباعة
              </button>
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
    } catch (error: any) {
      console.error('Error generating report:', error);
      const errorMessage = error?.response?.data?.message || error?.message || t('common.errorGenerating');
      alert(errorMessage);
    }
  };

  const resetProgressForm = () => {
    setProgressForm({
      surahPracticed: '',
      versesPracticed: '',
      pronunciationQuality: '',
      tajweedQuality: '',
      listeningAttention: '',
      repetitionAccuracy: '',
      attendance: '',
      notes: '',
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      surahId: '',
      versesToPrepare: '',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">حلقة التلقين</h2>
        <button
          onClick={handlePrintReport}
          className="btn-secondary flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          {t('admin.printReport')}
        </button>
      </div>

          {/* Filter Buttons */}
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-white/10 text-[var(--color-text)] hover:bg-white/20'
          }`}
        >
          {t('teacher.all')} ({students.length})
        </button>
        <button
          onClick={() => setFilter('logged')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            filter === 'logged'
              ? 'bg-green-600 text-white'
              : 'bg-white/10 text-[var(--color-text)] hover:bg-white/20'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {t('teacher.filled')} ({studentsLoggedToday.size})
        </button>
        <button
          onClick={() => setFilter('not-logged')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'not-logged'
              ? 'bg-orange-600 text-white'
              : 'bg-white/10 text-[var(--color-text)] hover:bg-white/20'
          }`}
        >
          {t('teacher.notFilled')} ({students.length - studentsLoggedToday.size})
        </button>
      </div>

      {/* Progress Bar */}
      {students.length > 0 && (
        <div className="bg-white p-4 rounded-lg border text-gray-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {t('teacher.dailyProgress')}
            </span>
            <span className="text-sm font-semibold text-primary">
              {studentsLoggedToday.size} / {students.length} {t('teacher.students')}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all"
              style={{
                width: `${(studentsLoggedToday.size / students.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Students Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {students
          .filter((student) => {
            if (filter === 'logged') return studentsLoggedToday.has(student.id);
            if (filter === 'not-logged') return !studentsLoggedToday.has(student.id);
            return true;
          })
          .map((student) => {
            const isLoggedToday = studentsLoggedToday.has(student.id);
            const hasAssignment = studentsWithAssignment.has(student.id);

            return (
              <button
                key={student.id}
                onClick={() => {
                  setSelectedStudent(student);
                  setShowProgressForm(true);
                }}
                className={`card hover:shadow-xl transition-all text-start relative ${
                  isLoggedToday ? 'border-2 border-green-500' : ''
                }`}
              >
                {isLoggedToday && (
                  <CheckCircle2 className="absolute -top-2 -end-2 w-6 h-6 bg-green-500 text-white rounded-full p-1" />
                )}
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">
                      {student.firstName[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{t('teacher.talqinStudent')}</p>
                  </div>
                </div>

                {hasAssignment && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">
                    <BookOpen className="w-4 h-4" />
                    {t('teacher.assignmentInProgress')}
                  </div>
                )}
              </button>
            );
          })}
      </div>

      {students.filter((student) => {
        if (filter === 'logged') return studentsLoggedToday.has(student.id);
        if (filter === 'not-logged') return !studentsLoggedToday.has(student.id);
        return true;
      }).length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{t('teacher.noCategoryStudents')}</p>
        </div>
      )}

      {/* Progress Form Modal */}
      {showProgressForm && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto text-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </h3>
              <button
                onClick={() => {
                  setShowProgressForm(false);
                  setSelectedStudent(null);
                  resetProgressForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setShowProgressForm(true);
                  setShowAssignmentForm(false);
                }}
                className={`p-4 rounded-lg border-2 font-medium transition-colors flex items-center justify-center gap-2 ${
                  showProgressForm && !showAssignmentForm
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                {t('teacher.recordSession')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProgressForm(false);
                  setShowAssignmentForm(true);
                }}
                className={`p-4 rounded-lg border-2 font-medium transition-colors flex items-center justify-center gap-2 ${
                  showAssignmentForm && !showProgressForm
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-5 h-5" />
                {t('teacher.assignHomework')}
              </button>
            </div>

          <form onSubmit={handleProgressSubmit} className="space-y-6">
            {/* Attendance - FIRST */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('teacher.attendance')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, attendance: 'present' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.attendance === 'present'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.present')}
                </button>
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, attendance: 'absent' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.attendance === 'absent'
                      ? 'border-red-600 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.absent')}
                </button>
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, attendance: 'justified' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.attendance === 'justified'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.justified')}
                </button>
              </div>
            </div>

            {/* Show quality fields only if present */}
            {progressForm.attendance === 'present' && (
            <>
            {/* Surah Selection - Using Dropdown for Hizb Amma */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('teacher.surahPracticed')}</label>
              <select
                value={progressForm.surahPracticed}
                onChange={(e) => setProgressForm({ ...progressForm, surahPracticed: e.target.value })}
                className="input-field"
              >
                <option value="">{t('teacher.selectSurah')}</option>
                {surahs
                  .filter((s) => s.number >= 78 && s.number <= 114)
                  .map((surah) => (
                    <option key={surah.id} value={surah.id}>
                      {surah.number}. {surah.name} - {surah.nameArabic}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('teacher.versesPracticed')}</label>
              <input
                type="text"
                value={progressForm.versesPracticed}
                onChange={(e) => setProgressForm({ ...progressForm, versesPracticed: e.target.value })}
                className="input-field"
                placeholder="Ex: 1-10"
              />
            </div>

            {/* Pronunciation Quality - Button Group */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('teacher.pronunciationQuality')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, pronunciationQuality: 'excellent' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.pronunciationQuality === 'excellent'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.excellent')}
                </button>
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, pronunciationQuality: 'good' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.pronunciationQuality === 'good'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.good')}
                </button>
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, pronunciationQuality: 'needs_improvement' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.pronunciationQuality === 'needs_improvement'
                      ? 'border-orange-600 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.needsImprovement')}
                </button>
              </div>
            </div>

            {/* Tajweed Quality - Button Group */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('teacher.tajweedQuality')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, tajweedQuality: 'excellent' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.tajweedQuality === 'excellent'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.excellent')}
                </button>
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, tajweedQuality: 'good' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.tajweedQuality === 'good'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.good')}
                </button>
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, tajweedQuality: 'needs_improvement' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.tajweedQuality === 'needs_improvement'
                      ? 'border-orange-600 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.needsImprovement')}
                </button>
              </div>
            </div>

            {/* Listening Attention - Button Group */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('teacher.listeningAttention')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, listeningAttention: 'high' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.listeningAttention === 'high'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.high')}
                </button>
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, listeningAttention: 'medium' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.listeningAttention === 'medium'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.medium')}
                </button>
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, listeningAttention: 'low' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.listeningAttention === 'low'
                      ? 'border-orange-600 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.low')}
                </button>
              </div>
            </div>

            {/* Repetition Accuracy - Button Group */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('teacher.repetitionAccuracy')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, repetitionAccuracy: 'excellent' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.repetitionAccuracy === 'excellent'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.excellent')}
                </button>
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, repetitionAccuracy: 'good' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.repetitionAccuracy === 'good'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.good')}
                </button>
                <button
                  type="button"
                  onClick={() => setProgressForm({ ...progressForm, repetitionAccuracy: 'needs_improvement' })}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                    progressForm.repetitionAccuracy === 'needs_improvement'
                      ? 'border-orange-600 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('teacher.needsImprovement')}
                </button>
              </div>
            </div>
            </>
            )}

            {/* Notes - Always visible */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('teacher.notes')}</label>
              <textarea
                value={progressForm.notes}
                onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })}
                className="input-field"
                rows={3}
                placeholder={t('teacher.additionalNotes')}
              />
            </div>

            {/* Live Barakah Points Preview */}
            {progressForm.attendance && (
              <div className={`rounded-lg border-2 p-4 ${
                progressForm.attendance === 'present'
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
                      {t('teacher.barakahPointsSession')}
                    </p>
                    {progressForm.attendance === 'present' && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        <span>{t('teacher.attendancePoints')} +20</span>
                        {progressForm.pronunciationQuality === 'excellent' && <span>{t('teacher.pronunciationPoints')} +25</span>}
                        {progressForm.pronunciationQuality === 'good' && <span>{t('teacher.pronunciationPoints')} +15</span>}
                        {progressForm.pronunciationQuality === 'needs_improvement' && <span>{t('teacher.pronunciationPoints')} +5</span>}
                        {progressForm.tajweedQuality === 'excellent' && <span>{t('teacher.tajweedPoints')} +20</span>}
                        {progressForm.tajweedQuality === 'good' && <span>{t('teacher.tajweedPoints')} +12</span>}
                        {progressForm.tajweedQuality === 'needs_improvement' && <span>{t('teacher.tajweedPoints')} +5</span>}
                        {progressForm.listeningAttention === 'high' && <span>{t('teacher.attentionPoints')} +15</span>}
                        {progressForm.listeningAttention === 'medium' && <span>{t('teacher.attentionPoints')} +8</span>}
                        {progressForm.listeningAttention === 'low' && <span>{t('teacher.attentionPoints')} +3</span>}
                        {progressForm.repetitionAccuracy === 'excellent' && <span>{t('teacher.precisionPoints')} +20</span>}
                        {progressForm.repetitionAccuracy === 'good' && <span>{t('teacher.precisionPoints')} +12</span>}
                        {progressForm.repetitionAccuracy === 'needs_improvement' && <span>{t('teacher.precisionPoints')} +5</span>}
                        {progressForm.pronunciationQuality === 'excellent' &&
                          progressForm.tajweedQuality === 'excellent' &&
                          progressForm.listeningAttention === 'high' &&
                          progressForm.repetitionAccuracy === 'excellent' && (
                            <span className="text-primary font-semibold">{t('teacher.perfectSession')} +30</span>
                          )}
                      </div>
                    )}
                    {progressForm.attendance === 'justified' && (
                      <p className="text-xs text-gray-500 mt-1">{t('teacher.justifiedAbsence')} +5</p>
                    )}
                    {progressForm.attendance === 'absent' && (
                      <p className="text-xs text-gray-500 mt-1">{t('teacher.unjustifiedAbsence')}</p>
                    )}
                  </div>
                  <div className="text-end">
                    <div className={`text-3xl font-bold ${calculateTalqinPoints() > 0 ? 'text-primary' : 'text-gray-400'}`}>
                      +{calculateTalqinPoints()}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{t('teacher.points')}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowProgressForm(false);
                  setSelectedStudent(null);
                  resetProgressForm();
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                {t('teacher.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading ? t('teacher.recordingSaving') : t('teacher.save')}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}

      {/* Assignment Form Modal */}
      {showAssignmentForm && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto text-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </h3>
              <button
                onClick={() => {
                  setShowAssignmentForm(false);
                  setSelectedStudent(null);
                  resetAssignmentForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setShowProgressForm(true);
                  setShowAssignmentForm(false);
                }}
                className="p-4 rounded-lg border-2 border-gray-200 text-gray-700 hover:border-gray-300 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                {t('teacher.recordSession')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProgressForm(false);
                  setShowAssignmentForm(true);
                }}
                className={`p-4 rounded-lg border-2 font-medium transition-colors flex items-center justify-center gap-2 ${
                  showAssignmentForm && !showProgressForm
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-5 h-5" />
                {t('teacher.assignHomework')}
              </button>
            </div>


          <form onSubmit={handleAssignmentSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <Calendar className="w-4 h-4 inline me-1" />
                {t('teacher.homeworkInfo')} {getNextMonday()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('teacher.surahToPrepare')}</label>
              <select
                value={assignmentForm.surahId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, surahId: e.target.value })}
                className="input-field"
                required
              >
                <option value="">{t('teacher.selectSurah')}</option>
                {surahs
                  .filter((s) => s.number >= 78 && s.number <= 114)
                  .map((surah) => (
                    <option key={surah.id} value={surah.id}>
                      {surah.number}. {surah.name} - {surah.nameArabic}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('teacher.versesToPrepare')}</label>
              <input
                type="text"
                value={assignmentForm.versesToPrepare}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, versesToPrepare: e.target.value })}
                className="input-field"
                placeholder="Ex: 1-15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('teacher.notesForParents')}</label>
              <textarea
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                className="input-field"
                rows={3}
                placeholder={t('teacher.instructionsOrNotes')}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAssignmentForm(false);
                  setSelectedStudent(null);
                  resetAssignmentForm();
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                {t('teacher.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading ? t('teacher.sending') : t('teacher.assign')}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}
    </div>
  );
}
