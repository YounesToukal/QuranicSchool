import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { classApi, studentApi, progressApi, talqinApi } from '@/lib/api';
import type { Student, Class } from '@/types';
import Header from '@/components/common/Header';
import SmartLogInterface from '@/components/teacher/SmartLogInterface';
import TalqinTeacherInterface from '@/components/teacher/TalqinTeacherInterface';
import ContactAdminButton from '@/components/common/ContactAdminButton';
import { Users, BookOpen, CheckCircle2, TrendingUp, Award } from 'lucide-react';

export default function TeacherDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [myClass, setMyClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentsLoggedToday, setStudentsLoggedToday] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'logged' | 'not-logged'>('all');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Load teacher's class
      const classesResponse = await classApi.getAll();
      const teacherClass = classesResponse.data.find(
        (c: Class) => c.teacherId === user!.id
      );
      
      if (teacherClass) {
        setMyClass(teacherClass);
        
        // Load students in this class
        const studentsResponse = await studentApi.getByClass(teacherClass.id);
        setStudents(studentsResponse.data);

        // Check which students have progress logged today
        await checkTodayProgress(studentsResponse.data, teacherClass.classType);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayProgress = async (studentsList: Student[], classType?: string) => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const loggedSet = new Set<number>();

    await Promise.all(
      studentsList.map(async (student) => {
        try {
          if (classType === 'talqin') {
            const response = await talqinApi.getStudentProgress(student.id, 30);
            if (response.data && response.data.length > 0) {
              const hasToday = response.data.some((record: any) =>
                String(record.date).slice(0, 10) === todayStr
              );
              if (hasToday) loggedSet.add(student.id);
            }
          } else {
            const response = await progressApi.getByStudent(student.id, {
              startDate: todayStr,
              endDate: todayStr
            });
            if (response.data && response.data.length > 0) {
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

  if (!myClass) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="card text-center">
            <h2 className="text-2xl font-bold text-primary mb-4">
              {t('teacher.noClassAssigned')}
            </h2>
            <p className="text-gray-600">
              {t('teacher.contactAdmin')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Talqin classes use dedicated interface
  if (myClass.classType === 'talqin') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          {/* Class Info Header */}
          <div className="card mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-primary mb-2">
                  {myClass.name}
                </h1>
                <p className="text-sm text-gray-500 mb-2">
                  حلقة التلقين - {t('teacher.recitationClass')}
                </p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {students.length} {students.length > 1 ? t('parent.students') : t('parent.student')}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {/* Class info */}
              </div>
            </div>
          </div>

          {/* Quick Stats — Talqin */}
          {students.length > 0 && (() => {
            const totalPoints = students.reduce((a, s) => a + (s.monthlyPoints || 0), 0);
            const attendanceRate = Math.round((studentsLoggedToday.size / students.length) * 100);
            const allLogged = studentsLoggedToday.size === students.length;
            const statItems = [
              {
                label: i18n.language === 'ar' ? 'إجمالي الطلاب' : 'Total élèves',
                value: String(students.length),
                icon: <Users className="w-4 h-4" />,
                dot: null,
              },
              {
                label: i18n.language === 'ar' ? 'سُجِّل اليوم' : 'Enregistrés auj.',
                value: `${studentsLoggedToday.size} / ${students.length}`,
                icon: <CheckCircle2 className="w-4 h-4" />,
                dot: allLogged ? 'bg-green-500' : 'bg-amber-400',
              },
              {
                label: i18n.language === 'ar' ? 'نقاط الشهر' : 'Points ce mois',
                value: totalPoints.toLocaleString(),
                icon: <Award className="w-4 h-4" />,
                dot: null,
              },
              {
                label: i18n.language === 'ar' ? 'معدل الحضور' : 'Présence (auj.)',
                value: `${attendanceRate}%`,
                icon: <TrendingUp className="w-4 h-4" />,
                dot: attendanceRate >= 80 ? 'bg-green-500' : attendanceRate >= 50 ? 'bg-amber-400' : 'bg-gray-300',
              },
            ];
            return (
              <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {statItems.map((stat) => (
                  <div
                    key={stat.label}
                    className="card py-3 px-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      {stat.icon}
                      <span>{stat.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stat.dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stat.dot}`} />}
                      <p className="text-2xl font-bold text-primary leading-none">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          <TalqinTeacherInterface classId={myClass.id} onProgressLogged={loadData} />
        </div>

        <ContactAdminButton />
      </div>
    );
  }

  // Hifz classes use SmartLogInterface
  if (selectedStudent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <SmartLogInterface
          student={selectedStudent}
          onBack={() => setSelectedStudent(null)}
          onSave={() => {
            setSelectedStudent(null);
            loadData();
          }}
        />

        <ContactAdminButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Class Info Header */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-primary mb-2">
                {myClass.name}
              </h1>
              <p className="text-gray-600 flex items-center gap-2 mb-3">
                <Users className="w-4 h-4" />
                {students.length} {students.length > 1 ? t('parent.students') : t('parent.student')}
              </p>
              
              {/* Progress Today */}
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  <span className="font-semibold text-green-600">{studentsLoggedToday.size}</span>
                  <span className="text-gray-600"> / {students.length} {t('teacher.filledToday')}</span>
                </div>
                <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${students.length > 0 ? (studentsLoggedToday.size / students.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {/* Class info - code display removed */}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {students.length > 0 && (() => {
          const avgHizb = Math.round(students.reduce((a, s) => a + (s.currentHizb || 0), 0) / students.length);
          const totalPoints = students.reduce((a, s) => a + (s.monthlyPoints || 0), 0);
          const attendanceRate = Math.round((studentsLoggedToday.size / students.length) * 100);
          const allLogged = studentsLoggedToday.size === students.length;
          const statItems = [
            {
              label: i18n.language === 'ar' ? 'إجمالي الطلاب' : 'Total élèves',
              value: String(students.length),
              icon: <Users className="w-4 h-4" />,
              dot: null,
            },
            {
              label: i18n.language === 'ar' ? 'سُجِّل اليوم' : 'Enregistrés auj.',
              value: `${studentsLoggedToday.size} / ${students.length}`,
              icon: <CheckCircle2 className="w-4 h-4" />,
              dot: allLogged ? 'bg-green-500' : 'bg-amber-400',
            },
            {
              label: i18n.language === 'ar' ? 'متوسط الحفظ' : 'Hizb moyen',
              value: `${avgHizb} / 60`,
              icon: <BookOpen className="w-4 h-4" />,
              dot: null,
            },
            {
              label: i18n.language === 'ar' ? 'نقاط الشهر' : 'Points ce mois',
              value: totalPoints.toLocaleString(),
              icon: <Award className="w-4 h-4" />,
              dot: null,
            },
            {
              label: i18n.language === 'ar' ? 'معدل الحضور' : 'Présence (auj.)',
              value: `${attendanceRate}%`,
              icon: <TrendingUp className="w-4 h-4" />,
              dot: attendanceRate >= 80 ? 'bg-green-500' : attendanceRate >= 50 ? 'bg-amber-400' : 'bg-gray-300',
            },
          ];
          return (
            <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {statItems.map((stat) => (
                <div
                  key={stat.label}
                  className="card py-3 px-4 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    {stat.icon}
                    <span>{stat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {stat.dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stat.dot}`} />}
                    <p className="text-2xl font-bold text-primary leading-none">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Students Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-secondary" />
              {t('teacher.students')}
            </h2>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary text-[#e8dcc8]'
                    : 'bg-white/10 text-[var(--color-text)] hover:bg-white/20'
                }`}
              >
                {t('teacher.all')} ({students.length})
              </button>
              <button
                onClick={() => setFilter('logged')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  filter === 'logged'
                    ? 'bg-green-600 text-[#e8dcc8]'
                    : 'bg-white/10 text-[var(--color-text)] hover:bg-white/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('teacher.filled')} ({studentsLoggedToday.size})
              </button>
              <button
                onClick={() => setFilter('not-logged')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'not-logged'
                    ? 'bg-orange-600 text-[#e8dcc8]'
                    : 'bg-white/10 text-[var(--color-text)] hover:bg-white/20'
                }`}
              >
                {t('teacher.notFilled')} ({students.length - studentsLoggedToday.size})
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students
              .filter((student) => {
                if (filter === 'logged') return studentsLoggedToday.has(student.id);
                if (filter === 'not-logged') return !studentsLoggedToday.has(student.id);
                return true;
              })
              .map((student) => {
                const isLoggedToday = studentsLoggedToday.has(student.id);
                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`card hover:shadow-lg transition-all text-start hover:scale-[1.02] active:scale-[0.98] relative ${
                      isLoggedToday ? 'border-2 border-green-500' : ''
                    }`}
                  >
                    {isLoggedToday && (
                      <div className="absolute -top-2 -end-2 bg-green-500 text-[#e8dcc8] rounded-full p-1 shadow-lg">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        {student.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            alt={student.firstName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-primary">
                            {student.firstName[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {t('parent.hizb')} {student.currentHizb} / 60
                        </p>
                        <p className="text-sm font-semibold text-secondary">
                          {student.monthlyPoints} {t('teacher.pointsThisMonth')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                        style={{ width: `${(student.currentHizb / 60) * 100}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Empty state when filter has no results */}
          {students.filter((student) => {
            if (filter === 'logged') return studentsLoggedToday.has(student.id);
            if (filter === 'not-logged') return !studentsLoggedToday.has(student.id);
            return true;
          }).length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {filter === 'logged' && t('teacher.noStudentsFilled')}
                {filter === 'not-logged' && t('teacher.allStudentsFilled')}
              </p>
            </div>
          )}
        </div>
      </div>

      <ContactAdminButton />
    </div>
  );
}
