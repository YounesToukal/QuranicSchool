import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { registrationApi, classApi, adminStatsApi, messageApi, adminApi } from '@/lib/api';
import type { RegistrationRequest, Class, RecoveryRequest, AdminStudent } from '@/types';
import Header from '@/components/common/Header';
import AdminMessagesPanel from '@/components/admin/AdminMessagesPanel';
import { Users, BookOpen, CheckCircle, XCircle, Plus, Eye, X, Award, Calendar, Activity, BarChart3, BookMarked, Clock, MessageCircle, Download, UserCheck, UserX, RefreshCw, Trash2, Edit2, ShieldAlert } from 'lucide-react';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'classes' | 'messages' | 'users' | 'students' | 'recovery'>('overview');
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationRequest | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClass, setNewClass] = useState({ teacherId: null as number | null, classType: 'hifz' as 'hifz' | 'talqin' });
  const [advancedStats, setAdvancedStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  // New state for CRUD tabs
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminStudents, setAdminStudents] = useState<AdminStudent[]>([]);
  const [recoveryRequests, setRecoveryRequests] = useState<RecoveryRequest[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '' });
  const [suspendModal, setSuspendModal] = useState<{ userId: number; name: string; currentlySuspended: boolean } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [pendingRecoveryCount, setPendingRecoveryCount] = useState(0);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => {
    loadData();
    loadUnreadCount();
    loadPendingRecoveryCount();
  }, []);

  const loadPendingRecoveryCount = async () => {
    try {
      const res = await adminApi.getRecoveryRequests();
      setPendingRecoveryCount((res.data as any[]).filter((r: any) => r.status === 'pending').length);
    } catch { /* silent */ }
  };

  const loadData = async () => {
    try {
      const [regsRes, classesRes] = await Promise.all([
        registrationApi.getAll(),
        classApi.getAll(),
      ]);
      setRegistrations(regsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await messageApi.getUnreadCount();
      setUnreadMessageCount(response.data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadAdvancedStats = async () => {
    if (advancedStats) return; // Already loaded
    setStatsLoading(true);
    try {
      const response = await adminStatsApi.getOverview();
      setAdvancedStats(response.data);
    } catch (error) {
      console.error('Failed to load advanced stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await adminApi.getUsers();
      setAdminUsers(res.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadAdminStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await adminApi.getStudents();
      setAdminStudents(res.data);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const loadRecoveryRequests = async () => {
    setRecoveryLoading(true);
    try {
      const res = await adminApi.getRecoveryRequests();
      setRecoveryRequests(res.data);
      setPendingRecoveryCount((res.data as any[]).filter((r: any) => r.status === 'pending').length);
    } catch (error) {
      console.error('Failed to load recovery requests:', error);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleSuspendToggle = async () => {
    if (!suspendModal) return;
    try {
      await adminApi.suspendUser(suspendModal.userId, !suspendModal.currentlySuspended, suspendReason);
      setSuspendModal(null);
      setSuspendReason('');
      loadAdminUsers();
    } catch (error) {
      console.error('Failed to suspend/activate user:', error);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`${t('admin.deleteConfirm')} "${name}"?`)) return;
    try {
      await adminApi.deleteUser(id);
      loadAdminUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleDeleteStudent = async (id: number, name: string) => {
    if (!confirm(`${t('admin.deleteConfirm')} "${name}"?`)) return;
    try {
      await adminApi.deleteStudent(id);
      loadAdminStudents();
    } catch (error) {
      console.error('Failed to delete student:', error);
    }
  };

  const handleDeleteClass = async (id: number, name: string) => {
    if (!confirm(`${t('admin.deleteConfirm')} "${name}"?`)) return;
    try {
      await adminApi.deleteClass(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || t('common.errorDeleting'));
    }
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;
    try {
      await adminApi.updateClass(editingClass.id, {
        name: editingClass.name,
        teacherId: editingClass.teacherId ?? null,
      });
      setEditingClass(null);
      loadData();
    } catch (error) {
      console.error('Failed to update class:', error);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    try {
      await adminApi.updateStudent(editingStudent.id, {
        firstName: editingStudent.firstName,
        lastName: editingStudent.lastName,
        classId: editingStudent.classId,
      });
      setEditingStudent(null);
      loadAdminStudents();
    } catch (error) {
      console.error('Failed to update student:', error);
    }
  };

  const handleRecoveryAction = async (id: number, action: 'approve' | 'suspend' | 'reject', notes?: string) => {
    try {
      if (action === 'approve') await adminApi.approveRecovery(id, notes);
      else if (action === 'suspend') await adminApi.suspendViaRecovery(id, notes);
      else await adminApi.rejectRecovery(id, notes);
      loadRecoveryRequests();
      if (action === 'approve') addToast('تمت الموافقة على الطلب بنجاح');
      else if (action === 'reject') addToast('تم رفض الطلب');
      else addToast('تم تعليق الحساب');
    } catch (error) {
      console.error('Failed to process recovery request:', error);
      addToast('فشل في معالجة الطلب', 'error');
    }
  };

  // Load advanced stats when switching to overview tab
  useEffect(() => {
    if (activeTab === 'overview' && !advancedStats) {
      loadAdvancedStats();
    } else if (activeTab === 'users') {
      loadAdminUsers();
    } else if (activeTab === 'classes') {
      loadAdminUsers();
    } else if (activeTab === 'students') {
      loadAdminStudents();
    } else if (activeTab === 'recovery') {
      loadRecoveryRequests();
    }
    // Refresh unread count when switching between tabs
    loadUnreadCount();
  }, [activeTab]);

  const handleApprove = async (id: number) => {
    try {
      await registrationApi.approve(id);
      loadData();
      addToast('تمت الموافقة على الطلب بنجاح');
    } catch (error) {
      console.error('Failed to approve:', error);
      addToast('فشل في الموافقة على الطلب', 'error');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await registrationApi.reject(id);
      loadData();
      addToast('تم رفض الطلب');
    } catch (error) {
      console.error('Failed to reject:', error);
      addToast('فشل في رفض الطلب', 'error');
    }
  };

  const handleCreateTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.password) {
      alert(t('common.requiredFields'));
      return;
    }
    try {
      await adminApi.createTeacher(newTeacher);
      setNewTeacher({ name: '', email: '', password: '' });
      setShowCreateTeacher(false);
      loadData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || t('common.errorCreating');
      alert(msg);
    }
  };

  const handleCreateClass = async () => {
    if (!newClass.teacherId) {
      alert(t('admin.sheikhRequired'));
      return;
    }
    try {
      const selectedTeacher = adminUsers.find(u => u.id === newClass.teacherId);
      const className = `Halaqat Sheikh ${selectedTeacher?.name || ''}`;
      await classApi.create({
        name: className,
        teacherId: newClass.teacherId,
        classType: newClass.classType
      });
      setNewClass({ teacherId: null, classType: 'hifz' });
      setShowCreateClass(false);
      loadData();
    } catch (error) {
      console.error('Failed to create class:', error);
      alert(t('common.errorCreating'));
    }
  };

  const generateReport = () => {
    const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);
    const totalTeachers = classes.length;
    const pendingCount = pendingRegistrations.length;
    const approvedCount = registrations.filter(r => r.status === 'approved').length;
    const currentDate = new Date();
    
    // Extract translations for the report
    const translations = {
      reportTitle: t('admin.printReport'),
      overview: t('admin.overview'),
      activeClasses: t('admin.activeClasses'),
      studentsEnrolled: t('admin.totalStudents'),
      approved: t('admin.approved'),
      pending: t('admin.pending'),
      progressStats: t('admin.statistics'),
      pagesMemorized: t('progress.memorization'),
      pagesRevised: t('progress.revision'),
      distributionByClass: t('admin.distributionByHalaqah'),
      className: t('admin.className'),
      type: t('admin.classType'),
      teacher: t('common.teacher'),
      numberOfStudents: t('admin.numberOfStudents'),
      notAssigned: t('admin.notAssigned'),
      teacherActivity: t('admin.teacherActivitySection'),
      teacherName: t('admin.teacherName'),
      sessionsRecorded: t('admin.sessionsRecorded'),
      studentsTaught: t('admin.studentsTaught'),
      totalPages: t('admin.totalPages'),
      registrationHistory: t('admin.registrationHistory'),
      studentName: t('admin.studentName'),
      requestedClass: t('admin.requestedClass'),
      requestDate: t('admin.requestDate'),
      status: t('admin.statusLabel'),
      validatedStatus: t('admin.approved'),
      pendingStatus: t('admin.pending'),
      rejectedStatus: t('admin.rejected'),
      quranicSchool: t('admin.quranicSchool'),
      statisticReport: t('admin.statisticReport'),
      documentGenerated: t('admin.documentGenerated'),
      at: t('admin.at'),
      allRightsReserved: t('admin.allRightsReserved'),
      activeStudents: t('admin.activeStudents'),
      totalSessions: t('admin.totalSessions'),
      documentGeneratedOn: t('admin.documentGenerated')
    };
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${translations.statisticReport} - ${translations.quranicSchool}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #000;
          background: #fff;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
          margin-bottom: 40px;
        }
        .header h1 {
          color: #000;
          font-size: 24px;
          margin-bottom: 8px;
          font-weight: bold;
        }
        .header .date {
          color: #000;
          font-size: 12px;
          font-style: italic;
        }
        .section {
          margin-bottom: 30px;
          break-inside: avoid;
        }
        .section-title {
          background: #000;
          color: #fff;
          padding: 8px 15px;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 15px;
          text-transform: uppercase;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: #fff;
          border: 1px solid #000;
          padding: 15px;
          text-align: center;
        }
        .stat-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #000;
          margin-bottom: 5px;
        }
        .stat-card .label {
          color: #000;
          font-size: 11px;
          font-weight: normal;
          text-transform: uppercase;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          margin-bottom: 10px;
        }
        .table th {
          background: #f5f5f5;
          padding: 8px 12px;
          text-align: left;
          font-weight: bold;
          color: #000;
          border: 1px solid #000;
          font-size: 12px;
          text-transform: uppercase;
        }
        .table td {
          padding: 8px 12px;
          border: 1px solid #000;
          font-size: 11px;
        }
        .table tr:nth-child(even) {
          background: #f9f9f9;
        }
        .status {
          padding: 2px 8px;
          border: 1px solid #000;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status.approved {
          background: #fff;
          color: #000;
        }
        .status.pending {
          background: #f0f0f0;
          color: #000;
        }
        .status.rejected {
          background: #e0e0e0;
          color: #000;
        }
        .arabic { 
          font-family: Arial, sans-serif; 
          font-size: 12px; 
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #000;
          color: #000;
          font-size: 10px;
        }
        .bold { font-weight: bold; }
        .text-center { text-align: center; }
        h2 {
          font-size: 16px;
          font-weight: bold;
          margin: 20px 0 10px 0;
          color: #000;
        }
        h3 {
          font-size: 14px;
          font-weight: bold;
          margin: 15px 0 8px 0;
          color: #000;
        }
        p {
          margin-bottom: 8px;
          font-size: 11px;
        }
        @media print {
          body { padding: 20px; }
          .section { page-break-inside: avoid; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${translations.statisticReport.toUpperCase()} - ${translations.quranicSchool.toUpperCase()}</h1>
        <div class="date">${translations.documentGeneratedOn} ${currentDate.toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', {
          day: 'numeric',
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</div>
      </div>

      <div class="section">
        <div class="section-title">${translations.overview}</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="value">${totalTeachers}</div>
            <div class="label">${translations.activeClasses}</div>
          </div>
          <div class="stat-card">
            <div class="value">${totalStudents}</div>
            <div class="label">${translations.studentsEnrolled}</div>
          </div>
          <div class="stat-card">
            <div class="value">${approvedCount}</div>
            <div class="label">${translations.approved}</div>
          </div>
          <div class="stat-card">
            <div class="value">${pendingCount}</div>
            <div class="label">${translations.pending}</div>
          </div>
        </div>
      </div>

      ${advancedStats ? `
      <div class="section">
        <div class="section-title">${translations.progressStats}</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="value">${advancedStats.progressStats?.totalPagesMemorized || 0}</div>
            <div class="label">${translations.pagesMemorized}</div>
          </div>
          <div class="stat-card">
            <div class="value">${advancedStats.progressStats?.totalPagesRevised || 0}</div>
            <div class="label">${translations.pagesRevised}</div>
          </div>
          <div class="stat-card">
            <div class="value">${advancedStats.progressStats?.activeStudents || 0}</div>
            <div class="label">${translations.activeStudents}</div>
          </div>
          <div class="stat-card">
            <div class="value">${advancedStats.progressStats?.totalSessions || 0}</div>
            <div class="label">${translations.totalSessions}</div>
          </div>
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">${translations.distributionByClass}</div>
        <table class="table">
          <thead>
            <tr>
              <th>${translations.className}</th>
              <th>${translations.type}</th>
              <th>${translations.teacher}</th>
              <th>${translations.numberOfStudents}</th>
            </tr>
          </thead>
          <tbody>
            ${classes.map(c => {
              const type = c.classType === 'talqin' ? 'تلقين' : 'حفظ';
              return `
              <tr>
                <td><span class="bold">${c.name}</span></td>
                <td class="text-center"><span class="arabic">${type}</span></td>
                <td>${c.teacherName || translations.notAssigned}</td>
                <td class="text-center bold">${c.studentCount || 0}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>

      ${advancedStats?.teacherActivity?.length > 0 ? `
      <div class="section">
        <div class="section-title">${translations.teacherActivity}</div>
        <table class="table">
          <thead>
            <tr>
              <th>${translations.teacherName}</th>
              <th>${translations.sessionsRecorded}</th>
              <th>${translations.studentsTaught}</th>
              <th>${translations.totalPages}</th>
            </tr>
          </thead>
          <tbody>
            ${advancedStats.teacherActivity.map((teacher: any) => `
            <tr>
              <td><span class="bold">${teacher.teacherName || translations.notAssigned}</span></td>
              <td class="text-center">${teacher.logCount || 0}</td>
              <td class="text-center">${teacher.studentsTaught || 0}</td>
              <td class="text-center bold">${teacher.totalPagesLogged || 0}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${registrations.length > 0 ? `
      <div class="section">
        <div class="section-title">${translations.registrationHistory}</div>
        <table class="table">
          <thead>
            <tr>
              <th>${translations.studentName}</th>
              <th>${translations.requestedClass}</th>
              <th>${translations.requestDate}</th>
              <th>${translations.status}</th>
            </tr>
          </thead>
          <tbody>
            ${registrations.slice(0, 15).map(reg => {
              const statusClass = reg.status === 'approved' ? 'approved' : reg.status === 'pending' ? 'pending' : 'rejected';
              const statusText = reg.status === 'approved' ? translations.validatedStatus : reg.status === 'pending' ? translations.pendingStatus : translations.rejectedStatus;
              return `
              <tr>
                <td><span class="bold">${reg.studentFirstName} ${reg.studentLastName}</span></td>
                <td>${reg.className || translations.notAssigned}</td>
                <td class="text-center">${new Date(reg.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR')}</td>
                <td class="text-center"><span class="status ${statusClass}">${statusText}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="footer">
        <p><strong>${translations.quranicSchool} - ${translations.statisticReport}</strong></p>
        <p>${translations.documentGenerated} ${currentDate.toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR')} ${translations.at} ${currentDate.toLocaleTimeString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR')}</p>
        <p>© ${currentDate.getFullYear()} ${translations.quranicSchool} - ${translations.allRightsReserved}</p>
      </div>
    </body>
    </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  const pendingRegistrations = registrations.filter(r => r.status === 'pending');

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-8">
          {t('admin.dashboard')}
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-white/20 overflow-x-auto">
          {[
            { id: 'overview', label: t('admin.overview'), icon: Users },
            { id: 'registrations', label: t('admin.registrations'), icon: CheckCircle },
            { id: 'classes', label: t('admin.classes'), icon: BookOpen },
            { id: 'users', label: t('admin.users'), icon: UserCheck },
            { id: 'students', label: t('admin.studentsTab'), icon: Award },
            { id: 'recovery', label: t('admin.recoveryRequests'), icon: RefreshCw },
            { id: 'messages', label: t('admin.messagesTab'), icon: MessageCircle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`
                flex items-center gap-2 px-4 py-3 font-semibold transition-all whitespace-nowrap flex-shrink-0
                ${activeTab === id
                  ? 'text-secondary border-b-2 border-secondary'
                  : 'text-[var(--color-text)] opacity-60 hover:opacity-90 hover:text-secondary'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {label}
              {id === 'registrations' && pendingRegistrations.length > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingRegistrations.length > 9 ? '9+' : pendingRegistrations.length}
                </span>
              )}
              {id === 'recovery' && pendingRecoveryCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingRecoveryCount > 9 ? '9+' : pendingRecoveryCount}
                </span>
              )}
              {id === 'messages' && unreadMessageCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Report Generation Button */}
            <div className="flex justify-end">
              <button
                onClick={generateReport}
                className="btn-primary flex items-center gap-2 px-3 py-2 text-sm font-medium shadow-md hover:shadow-lg transition-all"
                title={t('admin.printReport')}
              >
                <Download className="w-4 h-4" />
                {t('admin.printReport')}
              </button>
            </div>

            {/* Main Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="card bg-gradient-to-br from-primary to-primary/90 text-[#e8dcc8] p-6 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium opacity-90 mb-1">{t('admin.activeClasses')}</h3>
                    <p className="text-3xl font-bold">{classes.length}</p>
                  </div>
                  <BookOpen className="w-10 h-10 opacity-70" />
                </div>
                <p className="text-xs opacity-80 mt-2">{t('admin.availableHalaqat')}</p>
              </div>

              <div className="card bg-gradient-to-br from-secondary to-secondary/90 text-[#e8dcc8] p-6 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium opacity-90 mb-1">{t('admin.students')}</h3>
                    <p className="text-3xl font-bold">
                      {classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
                    </p>
                  </div>
                  <Users className="w-10 h-10 opacity-70" />
                </div>
                <p className="text-xs opacity-80 mt-2">{t('admin.totalEnrolled')}</p>
              </div>

              <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-[#e8dcc8] p-6 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium opacity-90 mb-1">{t('admin.pending')}</h3>
                    <p className="text-3xl font-bold">{pendingRegistrations.length}</p>
                  </div>
                  <Clock className="w-10 h-10 opacity-70" />
                </div>
                <p className="text-xs opacity-80 mt-2">{t('admin.requestsToProcess')}</p>
              </div>

              <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-[#e8dcc8] p-6 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium opacity-90 mb-1">{t('admin.registrations')}</h3>
                    <p className="text-3xl font-bold">
                      {registrations.length}
                    </p>
                  </div>
                  <CheckCircle className="w-10 h-10 opacity-70" />
                </div>
                <p className="text-xs opacity-80 mt-2">{t('admin.totalRequests')}</p>
              </div>
            </div>

            {/* Two Column Layout for Registration and Classes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Recent Registrations */}
              <div className="card p-5 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-primary">{t('admin.recentRegistrations')}</h3>
                </div>
                <div className="space-y-2.5 max-h-80 overflow-y-auto pe-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {registrations.length > 0 ? (
                    registrations.slice(0, 8).map((reg) => (
                      <div key={reg.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary/40 hover:shadow-sm transition-all">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          reg.status === 'approved' ? 'bg-green-500 shadow-sm shadow-green-400' :
                          reg.status === 'pending' ? 'bg-orange-500 shadow-sm shadow-orange-400' : 
                          'bg-red-500 shadow-sm shadow-red-400'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm">
                            {reg.studentFirstName} {reg.studentLastName}
                            {reg.source === 'add_child_authenticated' && (
                              <span className="ms-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">إضافة طفل</span>
                            )}
                            {reg.source === 'halaqah_change_authenticated' && (
                              <span className="ms-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">تغيير حلقة</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {reg.className || t('admin.notAssigned')} • {new Date(reg.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex-shrink-0 ${
                          reg.status === 'approved' ? 'bg-green-100 text-green-700' :
                          reg.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {reg.status === 'approved' ? t('admin.approved') : reg.status === 'pending' ? t('admin.pendingStatus') : t('admin.rejected')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{t('admin.noRegistrations')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Class Distribution */}
              <div className="card p-5 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Award className="w-5 h-5 text-secondary" />
                  </div>
                  <h3 className="text-base font-bold text-secondary">{t('admin.distributionByHalaqah')}</h3>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto pe-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {classes.length > 0 ? (
                    classes.map((classItem) => {
                      const total = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);
                      const percentage = total > 0 ? Math.round(((classItem.studentCount || 0) / total) * 100) : 0;
                      const isTalqin = classItem.classType === 'talqin';
                      
                      return (
                        <div key={classItem.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-secondary/40 hover:shadow-sm transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <p className="font-semibold text-gray-800 text-sm">
                                {classItem.name}
                              </p>
                              <span className={`px-2 py-1 rounded text-xs font-bold flex-shrink-0 ${
                                isTalqin ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {isTalqin ? 'تلقين' : 'حفظ'}
                              </span>
                            </div>
                            <div className="text-end ms-3">
                              <p className="font-bold text-xl text-secondary">{classItem.studentCount || 0}</p>
                              <p className="text-xs text-gray-500">{percentage}%</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {classItem.teacherName || t('admin.notAssigned')}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                isTalqin ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-primary to-secondary'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{t('admin.noClasses')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Statistics Section */}
            {statsLoading ? (
              <div className="card text-center py-10 shadow-md">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">{t('common.loading')}</p>
              </div>
            ) : advancedStats && (
              <>
                {/* Progress Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="card text-center bg-gradient-to-br from-blue-500 to-blue-600 text-[#e8dcc8] p-5 shadow-md hover:shadow-lg transition-all">
                    <BookMarked className="w-9 h-9 mx-auto mb-3 opacity-90" />
                    <p className="text-3xl font-bold mb-1">{advancedStats.progressStats.totalPagesMemorized}</p>
                    <p className="text-xs opacity-90">{t('admin.pagesMemorized')}</p>
                  </div>

                  <div className="card text-center bg-gradient-to-br from-purple-500 to-purple-600 text-[#e8dcc8] p-5 shadow-md hover:shadow-lg transition-all">
                    <BookOpen className="w-9 h-9 mx-auto mb-3 opacity-90" />
                    <p className="text-3xl font-bold mb-1">{advancedStats.progressStats.totalPagesRevised}</p>
                    <p className="text-xs opacity-90">{t('admin.pagesRevised')}</p>
                  </div>

                  <div className="card text-center bg-gradient-to-br from-teal-500 to-teal-600 text-[#e8dcc8] p-5 shadow-md hover:shadow-lg transition-all">
                    <Users className="w-9 h-9 mx-auto mb-3 opacity-90" />
                    <p className="text-3xl font-bold mb-1">{advancedStats.progressStats.activeStudents}</p>
                    <p className="text-xs opacity-90">{t('admin.activeStudents')}</p>
                  </div>

                  <div className="card text-center bg-gradient-to-br from-indigo-500 to-indigo-600 text-[#e8dcc8] p-5 shadow-md hover:shadow-lg transition-all">
                    <Clock className="w-9 h-9 mx-auto mb-3 opacity-90" />
                    <p className="text-3xl font-bold mb-1">{advancedStats.progressStats.totalSessions}</p>
                    <p className="text-xs opacity-90">{t('admin.totalSessions')}</p>
                  </div>
                </div>

                {/* Two Column Layout for Teacher Activity and Hizb Progress */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Teacher Contribution */}
                  <div className="card p-5 shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-base font-bold text-primary">{t('admin.teacherActivitySection')}</h3>
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto pe-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {advancedStats.teacherActivity.length > 0 ? (
                        advancedStats.teacherActivity.map((teacher: any, index: number) => {
                          const maxLogs = Math.max(...advancedStats.teacherActivity.map((t: any) => t.logCount), 1);
                          const percentage = (teacher.logCount / maxLogs) * 100;
                          
                          return (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-gray-800 text-sm">
                                  {teacher.teacherName}
                                </p>
                                <p className="font-bold text-xl text-primary">{teacher.logCount}</p>
                              </div>
                              <p className="text-xs text-gray-500 mb-2">
                                {teacher.studentsTaught} {t('admin.students')} • {teacher.totalPagesLogged} {t('admin.pagesLoggedLabel')}
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">{t('admin.noActivity')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hizb Progress */}
                  <div className="card p-5 shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <BookOpen className="w-5 h-5 text-secondary" />
                      </div>
                      <h3 className="text-base font-bold text-secondary">{t('admin.hizbProgressTitle')}</h3>
                    </div>
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pe-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {advancedStats.hizbProgress.length > 0 ? (
                        advancedStats.hizbProgress.map((hizb: any, index: number) => {
                          const maxStudents = Math.max(...advancedStats.hizbProgress.map((h: any) => h.studentCount), 1);
                          const percentage = (hizb.studentCount / maxStudents) * 100;
                          
                          return (
                            <div key={index} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                              <div className="w-11 h-11 flex-shrink-0 rounded-full bg-secondary/20 flex items-center justify-center">
                                <span className="text-sm font-bold text-secondary">H{hizb.hizb}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-sm font-semibold text-gray-700">{t('progress.hizb')} {hizb.hizb}</span>
                                  <span className="text-base font-bold text-secondary">{hizb.studentCount} {t('admin.students')}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div 
                                    className="bg-gradient-to-r from-secondary to-primary h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">{t('admin.noHizbProgress')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Activity and Average Progress - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Recent Activity Timeline */}
                  <div className="card p-4 shadow-md lg:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <Activity className="w-4 h-4 text-green-600" />
                      </div>
                      <h3 className="text-sm font-bold text-green-600">{t('admin.last7Days')}</h3>
                    </div>
                    <div className="space-y-2">
                      {advancedStats.recentActivity.length > 0 ? (
                        advancedStats.recentActivity.map((activity: any, index: number) => {
                          const date = new Date(activity.date);
                          const locale = i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR';
                          const dayName = date.toLocaleDateString(locale, { weekday: 'short' });
                          const dateStr = date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
                          const maxSessions = Math.max(...advancedStats.recentActivity.map((a: any) => a.sessions), 1);
                          const percentage = (activity.sessions / maxSessions) * 100;
                          
                          return (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <div className="w-14 flex-shrink-0">
                                <p className="text-xs font-bold text-gray-800 capitalize">{dayName}</p>
                                <p className="text-[10px] text-gray-500">{dateStr}</p>
                              </div>
                              <div className="flex-1">
                                <div className="flex gap-2 text-xs text-gray-600 mb-1">
                                  <span className="font-medium">{activity.sessions} {t('admin.sessions')}</span>
                                  <span className="text-green-600 font-medium">{activity.pagesMemorized} {t('admin.memorizedLabel')}</span>
                                  <span className="text-blue-600 font-medium">{activity.pagesRevised} {t('admin.revisedLabel')}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">{t('admin.noRecentActivity')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Average Progress */}
                  <div className="card bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 p-4 shadow-md lg:col-span-1">
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-3 text-center">{t('admin.avgProgressTitle')}</h3>
                    <div className="space-y-4">
                      <div className="text-center p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg">
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                          {advancedStats.avgProgress.avgPage.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{t('admin.avgPageLabel')}</p>
                      </div>
                      <div className="text-center p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg">
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                          {advancedStats.avgProgress.avgHizb.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{t('progress.hizb')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--color-text)]">
                {t('admin.pendingRegistrations')}
              </h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold">
                {pendingRegistrations.length} {t('admin.pending').toLowerCase()}
              </span>
            </div>

            <div className="space-y-4">
              {pendingRegistrations.map((registration) => (
                <div key={registration.id} className={`rounded-xl border bg-white shadow-sm overflow-hidden border-l-4 ${
                  registration.source === 'halaqah_change_authenticated'
                    ? 'border-gray-100 border-l-purple-400'
                    : registration.source === 'add_child_authenticated'
                    ? 'border-gray-100 border-l-blue-400'
                    : 'border-gray-100 border-l-amber-400'
                }`}>
                  {/* Card Header */}
                  <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          registration.source === 'halaqah_change_authenticated' ? 'bg-purple-50'
                          : registration.source === 'add_child_authenticated' ? 'bg-blue-50'
                          : 'bg-amber-50'
                        }`}>
                        <Users className={`w-4 h-4 ${
                          registration.source === 'halaqah_change_authenticated' ? 'text-purple-600'
                          : registration.source === 'add_child_authenticated' ? 'text-blue-600'
                          : 'text-amber-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-base leading-tight">
                          {registration.studentFirstName} {registration.studentLastName}
                        </p>
                        <span className={`text-xs font-semibold uppercase tracking-wide ${
                          registration.source === 'halaqah_change_authenticated'
                            ? 'text-purple-600'
                            : registration.source === 'add_child_authenticated'
                            ? 'text-blue-600'
                            : 'text-amber-600'
                        }`}>
                          {registration.source === 'halaqah_change_authenticated'
                            ? 'تغيير حلقة — ' + (registration.parentName || '')
                            : registration.source === 'add_child_authenticated'
                            ? 'إضافة طفل — ' + (registration.parentName || '')
                            : t('admin.pendingRegistrations')}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      registration.source === 'halaqah_change_authenticated'
                        ? 'bg-purple-50 text-purple-700 border border-purple-100'
                        : registration.source === 'add_child_authenticated'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {t('admin.pending')}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    {(registration.parentName || registration.parentPhone) && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{t('admin.parentNameLabel')}</span>
                        <span className="font-semibold text-gray-800">{registration.parentName || t('admin.notSpecified')}</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{t('admin.parentPhone')}</span>
                      <span className="font-mono font-bold text-gray-800 tracking-wider">{registration.parentPhone}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{t('landing.halaqah')}</span>
                      <span className="font-semibold text-primary">{registration.className || '—'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{t('common.date')}</span>
                      <span className="text-gray-600">{new Date(registration.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedRegistration(registration)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-sm font-semibold transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      {t('common.details')}
                    </button>
                    <button
                      onClick={() => handleApprove(registration.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('admin.approveRequest')}
                    </button>
                    <button
                      onClick={() => handleReject(registration.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 text-sm font-semibold transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      {t('admin.rejectRequest')}
                    </button>
                  </div>
                </div>
              ))}

              {pendingRegistrations.length === 0 && (
                <div className="card text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {t('admin.noRequestsPending')}
                  </h3>
                  <p className="text-gray-600">
                    {t('admin.allRequestsProcessed')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--color-text)]">
                {t('admin.classes')}
              </h2>
              <button 
                onClick={() => setShowCreateClass(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {t('admin.createClass')}
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => {
                const isTalqin = classItem.classType === 'talqin';
                
                return (
                  <div key={classItem.id} className="card">
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-primary">
                          {classItem.name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          isTalqin ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {isTalqin ? 'حلقة التلقين' : 'حلقة الحفظ'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t('admin.assignedTeacher')}: {classItem.teacherName || t('admin.notAssigned')}
                      </p>
                    </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                      {classItem.studentCount || 0} {t('parent.student')}{(classItem.studentCount || 0) > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2 flex-wrap">
                    <button 
                      onClick={() => setSelectedClass(classItem)}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />{t('admin.viewDetails')}
                    </button>
                    <button
                      onClick={() => setEditingClass({ ...classItem })}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />{t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteClass(classItem.id, classItem.name)}
                      className="text-sm text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />{t('common.delete')}
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <AdminMessagesPanel onCountChange={loadUnreadCount} />
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--color-text)]">{t('admin.users')}</h2>
              <button
                onClick={() => setShowCreateTeacher(true)}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                إضافة أستاذ
              </button>
            </div>

            {/* Create Teacher Modal */}
            {showCreateTeacher && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">إضافة أستاذ جديد</h3>
                    <button onClick={() => setShowCreateTeacher(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">الاسم الكامل</label>
                      <input
                        type="text"
                        value={newTeacher.name}
                        onChange={e => setNewTeacher(p => ({ ...p, name: e.target.value }))}
                        placeholder="الشيخ محمد..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={newTeacher.email}
                        onChange={e => setNewTeacher(p => ({ ...p, email: e.target.value }))}
                        placeholder="sheikh@example.com"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">كلمة المرور</label>
                      <input
                        type="password"
                        value={newTeacher.password}
                        onChange={e => setNewTeacher(p => ({ ...p, password: e.target.value }))}
                        placeholder="6 أحرف على الأقل"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={handleCreateTeacher}
                      className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
                    >
                      إنشاء الحساب
                    </button>
                    <button
                      onClick={() => setShowCreateTeacher(false)}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {usersLoading ? (
              <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
            ) : (
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left">
                      <th className="py-3 px-4 text-gray-600 font-semibold">{t('common.parent')}</th>
                      <th className="py-3 px-4 text-gray-600 font-semibold">{t('auth.phoneNumber')}</th>
                      <th className="py-3 px-4 text-gray-600 font-semibold">{t('common.email')}</th>
                      <th className="py-3 px-4 text-gray-600 font-semibold text-center">تسجيلات الدخول</th>
                      <th className="py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">{t('common.actions')}</th>
                      <th className="py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">{t('common.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((user) => (
                      <tr key={user.id} className={`border-b border-gray-100 transition-colors ${user.isSuspended ? 'bg-red-50 hover:bg-red-100' : 'bg-white hover:bg-gray-50'}`}>
                        <td className="py-3 px-4 font-semibold text-gray-800">{user.name}</td>
                        <td className="py-3 px-4 font-mono text-gray-700">{user.phone}</td>
                        <td className="py-3 px-4 text-gray-500">{user.email || '—'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                            user.loginCount > 0 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {user.loginCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSuspendModal({ userId: user.id, name: user.name, currentlySuspended: user.isSuspended })}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium border ${
                                user.isSuspended
                                  ? 'border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'border-orange-300 bg-orange-500 text-white hover:bg-orange-600'
                              }`}
                            >
                              {user.isSuspended ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                              {user.isSuspended ? t('admin.activateUser') : t('admin.suspendUser')}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium border border-red-700"
                            >
                              <Trash2 className="w-3 h-3" />{t('common.delete')}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {user.isSuspended ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 font-semibold px-2 py-1 rounded-full border border-red-200">
                              <ShieldAlert className="w-3 h-3" />{t('admin.suspended')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-1 rounded-full border border-emerald-200">
                              {t('admin.active')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6">{t('admin.studentsTab')}</h2>
            {studentsLoading ? (
              <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
            ) : (
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left">
                      <th className="py-3 px-4 text-gray-600 font-semibold">{t('registration.childFirstName')}</th>
                      <th className="py-3 px-4 text-gray-600 font-semibold">{t('registration.childLastName')}</th>
                      <th className="py-3 px-4 text-gray-600 font-semibold">{t('common.parent')}</th>
                      <th className="py-3 px-4 text-gray-600 font-semibold">{t('admin.classes')}</th>
                      <th className="py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminStudents.map((student) => (
                      <tr key={student.id} className="border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-gray-800">{student.firstName}</td>
                        <td className="py-3 px-4 text-gray-700">{student.lastName}</td>
                        <td className="py-3 px-4 text-gray-600">{student.parentName}</td>
                        <td className="py-3 px-4 text-gray-600">{student.className}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingStudent({ ...student })}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary text-white hover:bg-primary/90 font-medium border border-primary/80"
                            >
                              <Edit2 className="w-3 h-3" />{t('common.edit')}
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium border border-red-700"
                            >
                              <Trash2 className="w-3 h-3" />{t('common.delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recovery Requests Tab */}
        {activeTab === 'recovery' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--color-text)]">{t('admin.recoveryRequests')}</h2>
              {pendingRecoveryCount > 0 && (
                <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold rounded-full">
                  {pendingRecoveryCount} {t('admin.pending')}
                </span>
              )}
            </div>
            {recoveryLoading ? (
              <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
            ) : recoveryRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <RefreshCw className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">{t('common.noDataAvailable')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recoveryRequests.map((req) => {
                  const typeLabels: Record<string, string> = {
                    wrong_number: t('admin.wrongNumber'),
                    add_child: t('admin.addChild'),
                    halaqah_change: t('admin.halaqahChange'),
                  };
                  const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
                    pending:  { label: t('admin.pending'),  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-l-amber-400' },
                    approved: { label: t('admin.approved'), bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-l-emerald-400' },
                    rejected: { label: t('admin.rejected'), bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-l-red-400' },
                    suspended:{ label: t('admin.suspended'), bg: 'bg-gray-50', text: 'text-gray-600',  border: 'border-l-gray-300' },
                  };
                  const sc = statusConfig[req.status] ?? statusConfig.suspended;
                  return (
                    <div key={req.id} className={`rounded-xl border border-gray-100 border-l-4 ${sc.border} bg-white shadow-sm overflow-hidden`}>
                      {/* Card Header */}
                      <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${sc.bg}`}>
                            <RefreshCw className={`w-4 h-4 ${sc.text}`} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-base leading-tight">{req.requesterName}</p>
                            <span className={`text-xs font-semibold uppercase tracking-wide ${sc.text}`}>
                              {typeLabels[req.requestType] || req.requestType}
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${sc.bg} ${sc.text} border border-current/10`}>
                          {sc.label}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        {req.childNameForLookup && (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{t('admin.childLookup')}</span>
                            <span className="font-semibold text-gray-800">{req.childNameForLookup}</span>
                          </div>
                        )}
                        {req.newPhone && (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{t('registration.newPhoneCorrect')}</span>
                            <span className="font-mono font-bold text-gray-800 tracking-wider">{req.newPhone}</span>
                          </div>
                        )}
                        {req.newClassName && (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{t('registration.newHalaqah')}</span>
                            <span className="font-semibold text-gray-800">{req.newClassName}</span>
                          </div>
                        )}
                        {req.newChildFirstName && (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{t('registration.newChildFirstName')}</span>
                            <span className="font-semibold text-gray-800">{req.newChildFirstName}</span>
                          </div>
                        )}
                        {req.currentPhone && (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{t('auth.phoneNumber')}</span>
                            <span className="font-mono text-gray-600">{req.currentPhone}</span>
                          </div>
                        )}
                      </div>

                      {req.adminNotes && (
                        <div className="mx-5 mb-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
                          <span className="font-semibold text-xs uppercase tracking-wide text-amber-600 block mb-1">{t('admin.adminNotes')}</span>
                          {req.adminNotes}
                        </div>
                      )}

                      {/* Actions */}
                      {req.status === 'pending' && (
                        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-2">
                          <button
                            onClick={() => handleRecoveryAction(req.id, 'approve')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {t('admin.approveRequest')}
                          </button>
                          <button
                            onClick={() => handleRecoveryAction(req.id, 'suspend')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-semibold transition-colors"
                          >
                            <UserX className="w-4 h-4" />
                            {t('admin.suspendUser')}
                          </button>
                          <button
                            onClick={() => handleRecoveryAction(req.id, 'reject')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 text-sm font-semibold transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            {t('admin.rejectRequest')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Registration Details Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto text-gray-800">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">{t('admin.viewDetails')}</h2>
              <button
                onClick={() => setSelectedRegistration(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('admin.studentInfo')}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('registration.childFirstName')}:</span>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedRegistration.studentFirstName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('registration.childLastName')}:</span>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedRegistration.studentLastName}</p>
                  </div>
                </div>
              </div>

              {/* Parent Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('admin.parentInfo')}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('admin.parentNameLabel')}:</span>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedRegistration.parentName || t('admin.notSpecified')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('auth.phoneNumber')}:</span>
                    <p className="font-semibold font-mono text-gray-900 dark:text-gray-100">{selectedRegistration.parentPhone}</p>
                  </div>
                </div>
              </div>

              {/* Class Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('admin.halaqahInfo')}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('landing.halaqah')}:</span>
                    <p className="font-semibold text-primary">{selectedRegistration.className || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('admin.requestDate')}:</span>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{new Date(selectedRegistration.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('admin.statusLabel')}:</span>
                    <p className="font-semibold">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedRegistration.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                        selectedRegistration.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {selectedRegistration.status === 'pending' ? t('admin.pending') :
                         selectedRegistration.status === 'approved' ? t('admin.approved') : t('admin.rejected')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedRegistration.status === 'pending' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex gap-3">
                  <button
                    onClick={() => {
                      handleApprove(selectedRegistration.id);
                      setSelectedRegistration(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-[#e8dcc8] rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {t('admin.approveRequest')}
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedRegistration.id);
                      setSelectedRegistration(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-[#e8dcc8] rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    {t('admin.rejectRequest')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Class Details Modal */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto text-gray-800">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">{t('admin.classDetailsTitle')}</h2>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-primary mb-2">{selectedClass.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('admin.assignedTeacher')}:</span>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedClass.teacherName || t('admin.notAssigned')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('admin.numberOfStudents')}:</span>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedClass.studentCount || 0}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{t('admin.parentsCanSelect')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto text-gray-800">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">{t('admin.createClassTitle')}</h2>
              <button
                onClick={() => {
                  setShowCreateClass(false);
                  setNewClass({ teacherId: null, classType: 'hifz' });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <form className="space-y-5">
                {/* Class Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('admin.classType')} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewClass({ ...newClass, classType: 'hifz' })}
                      className={`p-4 rounded-lg border-2 transition-all text-start ${
                        newClass.classType === 'hifz'
                          ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <BookMarked className="w-5 h-5 text-primary" />
                        <span className="font-bold text-primary">حلقة الحفظ</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('admin.hifzDescription')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('admin.hifzDetails')}</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setNewClass({ ...newClass, classType: 'talqin' })}
                      className={`p-4 rounded-lg border-2 transition-all text-start ${
                        newClass.classType === 'talqin'
                          ? 'border-secondary bg-secondary/5 dark:bg-secondary/10 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-secondary" />
                        <span className="font-bold text-secondary">حلقة التلقين</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('admin.talqinDescription')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('admin.talqinDetails')}</p>
                    </button>
                  </div>
                </div>

                {/* Teacher Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.sheikhNameLabel')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newClass.teacherId ?? ''}
                    onChange={(e) => setNewClass({ ...newClass, teacherId: e.target.value ? Number(e.target.value) : null })}
                    className="input-field"
                    required
                  >
                    <option value="">{t('admin.selectTeacher') || '-- اختر الأستاذ --'}</option>
                    {adminUsers.filter(u => u.role === 'teacher').map(teacher => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </select>

                  {/* Auto-generated Class Name Preview */}
                  {newClass.teacherId && (() => {
                    const selectedTeacher = adminUsers.find(u => u.id === newClass.teacherId);
                    return (
                      <div className={`mt-3 p-3 rounded-lg border ${
                        newClass.classType === 'hifz'
                          ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30'
                          : 'bg-secondary/5 dark:bg-secondary/10 border-secondary/20 dark:border-secondary/30'
                      }`}>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('admin.className')}:</p>
                        <p className={`text-lg font-semibold ${
                          newClass.classType === 'hifz' ? 'text-primary' : 'text-secondary'
                        }`}>
                          {newClass.classType === 'hifz' ? t('landing.hifzTitle') : t('landing.talqinTitle')} - {t('admin.sheikhPrefix')} {selectedTeacher?.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {newClass.classType === 'hifz' ? t('admin.hifzDescription') : t('admin.talqinDescription')} {t('admin.sheikhPrefix')} {selectedTeacher?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {t('admin.autoCreated')}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateClass(false);
                      setNewClass({ teacherId: null, classType: 'hifz' });
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateClass}
                    className="flex-1 px-4 py-3 bg-primary text-[#e8dcc8] rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-lg shadow-primary/20"
                  >
                    {t('admin.createClass')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">{t('common.edit')} - {t('admin.classes')}</h3>
              <button onClick={() => setEditingClass(null)}><X className="w-5 h-5 text-gray-500 hover:text-gray-700" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.className')}</label>
                <input type="text" value={editingClass.name} onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.teacherName')}</label>
                <select
                  value={editingClass.teacherId ?? ''}
                  onChange={(e) => {
                    const teacher = adminUsers.find(u => u.id === Number(e.target.value));
                    setEditingClass({ ...editingClass, teacherId: teacher?.id ?? 0, teacherName: teacher?.name ?? '' });
                  }}
                  className="input-field"
                >
                  <option value="">{t('admin.selectTeacher') || '-- اختر الأستاذ --'}</option>
                  {adminUsers.filter(u => u.role === 'teacher').map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingClass(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleUpdateClass} className="flex-1 btn-primary py-2">{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">{t('common.edit')} - {t('admin.studentsTab')}</h3>
              <button onClick={() => setEditingStudent(null)}><X className="w-5 h-5 text-gray-500 hover:text-gray-700" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('registration.childFirstName')}</label>
                <input type="text" value={editingStudent.firstName} onChange={(e) => setEditingStudent({ ...editingStudent, firstName: e.target.value })} className="input-field" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('registration.childLastName')}</label>
                <input type="text" value={editingStudent.lastName} onChange={(e) => setEditingStudent({ ...editingStudent, lastName: e.target.value })} className="input-field" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.transferClass')}</label>
                <select value={editingStudent.classId} onChange={(e) => setEditingStudent({ ...editingStudent, classId: Number(e.target.value) })} className="input-field">
                  <option value="">{t('registration.chooseClass')}</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingStudent(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleUpdateStudent} className="flex-1 btn-primary py-2">{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend/Activate User Modal */}
      {suspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {suspendModal.currentlySuspended ? t('admin.activateUser') : t('admin.suspendUser')}
              </h3>
              <button onClick={() => { setSuspendModal(null); setSuspendReason(''); }}>
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{suspendModal.name}</p>
            {!suspendModal.currentlySuspended && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.suspendReason')}</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder={t('admin.suspendReason')}
                />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setSuspendModal(null); setSuspendReason(''); }} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
              <button
                onClick={handleSuspendToggle}
                className={`flex-1 py-2 rounded-lg font-semibold text-white ${suspendModal.currentlySuspended ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {suspendModal.currentlySuspended ? t('admin.activateUser') : t('admin.suspendUser')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white min-w-[240px] pointer-events-auto ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="opacity-75 hover:opacity-100 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
