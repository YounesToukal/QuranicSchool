import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { progressApi, quranApi, studentApi } from '@/lib/api';
import { useOfflineStore } from '@/store/offlineStore';
import type { Student, Surah, Hizb } from '@/types';
import { ChevronLeft, Plus, Minus, Save } from 'lucide-react';

interface SmartLogInterfaceProps {
  student: Student;
  onBack: () => void;
  onSave: () => void;
}

export default function SmartLogInterface({ student, onBack, onSave }: SmartLogInterfaceProps) {
  const { t } = useTranslation();
  const { isOnline, addPendingAction } = useOfflineStore();
  
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [hizbs, setHizbs] = useState<Hizb[]>([]);
  
  const [formData, setFormData] = useState({
    pagesMemorized: 0,
    pagesRevised: 0,
    attendance: '' as '' | 'present' | 'absent' | 'justified',
    concentration: 'medium' as 'low' | 'medium' | 'high',
    notes: '',
  });

  const [saving, setSaving] = useState(false);

  // Calculate current position based on student's current page and pages memorized today
  const getCurrentPage = () => student.currentPage + formData.pagesMemorized;
  const getCurrentHizb = () => Math.ceil(getCurrentPage() / 10); // Each hizb is ~10 pages
  const getPagesInCurrentHizb = () => getCurrentPage() % 10 || 10;
  
  // Get hizb status based on progress
  const getHizbStatus = (hizbNum: number) => {
    const currentHizbCalc = getCurrentHizb();
    const currentPageCalc = getCurrentPage();
    
    // Completed: hizb is fully done
    if (hizbNum < currentHizbCalc) return 'completed';
    
    // Current/In-progress: currently working on this hizb
    if (hizbNum === currentHizbCalc && currentPageCalc > 0) return 'in-progress';
    
    // Next hizb is accessible
    if (hizbNum === currentHizbCalc + 1) return 'next';
    
    // Locked: not yet accessible
    return 'locked';
  };

  useEffect(() => {
    loadQuranData();
  }, []);

  const loadQuranData = async () => {
    try {
      const [surahsRes, hizbsRes] = await Promise.all([
        quranApi.getSurahs(),
        quranApi.getHizbs(),
      ]);
      setSurahs(surahsRes.data);
      setHizbs(hizbsRes.data);
    } catch (error) {
      console.error('Failed to load Quran data:', error);
    }
  };

  const calculatePoints = () => {
    let points = 0;
    
    // Memorization points
    points += formData.pagesMemorized * 100;
    
    // Revision points
    points += formData.pagesRevised * 40;
    
    // Attendance points
    if (formData.attendance === 'present') {
      points += 10;
    } else if (formData.attendance === 'absent') {
      points -= 20;
    }
    
    // Concentration points
    if (formData.concentration === 'high') {
      points += 50;
    } else if (formData.concentration === 'medium') {
      points += 20;
    }
    
    return points;
  };

  const handleSave = async () => {
    // Validate attendance is selected
    if (!formData.attendance) {
      alert('Veuillez sélectionner la présence');
      return;
    }

    setSaving(true);

    const progressData = {
      studentId: student.id,
      date: new Date().toISOString(),
      // If absent/justified, set pages to 0
      pagesMemorized: formData.attendance === 'present' ? formData.pagesMemorized : 0,
      pagesRevised: formData.attendance === 'present' ? formData.pagesRevised : 0,
      attendance: formData.attendance,
      concentration: formData.attendance === 'present' ? formData.concentration : 'medium',
      pointsEarned: formData.attendance === 'present' ? calculatePoints() : 0,
      notes: formData.notes,
    };

    try {
      if (isOnline) {
        await progressApi.create(progressData);
        
        // Update student's current page, hizb, and surah if pages were memorized and present
        if (formData.attendance === 'present' && formData.pagesMemorized > 0) {
          const newCurrentPage = getCurrentPage();
          const newCurrentHizb = getCurrentHizb();
          
          // Find the surah that contains this page
          const currentSurah = surahs.find((s) => 
            newCurrentPage >= s.startPage && newCurrentPage <= s.endPage
          );
          
          await studentApi.update(student.id, {
            currentPage: newCurrentPage,
            currentHizb: newCurrentHizb,
            currentSurah: currentSurah?.number || student.currentSurah
          });
        }
        
        onSave();
      } else {
        // Store offline
        addPendingAction('createProgress', progressData);
        onSave();
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get current hizb surahs (all surahs in the hizb student is working on)
  const getCurrentHizbSurahs = () => {
    const currentHizbNum = getCurrentHizb();
    const currentHizb = hizbs.find(h => h.number === currentHizbNum);
    if (!currentHizb) return [];
    return surahs.filter(s => currentHizb.surahs.includes(s.number));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[var(--color-text)]"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-secondary">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-[var(--color-text)] opacity-70">{t('teacher.quickProgressEntry')}</p>
        </div>
        {!isOnline && (
          <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
            {t('teacher.offlineMode')}
          </div>
        )}
      </div>

      {/* Hizb Selection */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-primary mb-4">
          {t('teacher.hizbSelection')}
        </h2>
        
        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-900">
            {t('teacher.currentPosition')}: {t('teacher.page')} {getCurrentPage()} / Hizb {getCurrentHizb()}
            {getPagesInCurrentHizb() < 10 && (
              <span className="text-blue-600"> ({getPagesInCurrentHizb()}/10 {t('teacher.pages')})</span>
            )}
          </div>
          {getCurrentHizbSurahs().length > 0 && (
            <div className="text-sm text-blue-800 mt-1">
              {t('teacher.surahs')}: {' '}
              {getCurrentHizbSurahs().map((s, idx) => (
                <span key={s.number}>
                  {s.name}
                  {s.nameArabic && <span className="text-blue-600"> - {s.nameArabic}</span>}
                  {idx < getCurrentHizbSurahs().length - 1 && ' • '}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 xl:grid-cols-20 gap-1 md:gap-1.5">
          {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => {
            const status = getHizbStatus(num);
            
            return (
              <div
                key={num}
                className={`
                  hizb-cell
                  ${num === getCurrentHizb() ? 'ring-2 ring-primary ring-offset-2' : ''}
                  ${status === 'completed' ? 'bg-green-500 text-white' : ''}
                  ${status === 'in-progress' ? 'bg-yellow-400 text-gray-900 animate-pulse' : ''}
                  ${status === 'next' ? 'bg-blue-100 text-blue-900' : ''}
                  ${status === 'locked' ? 'bg-gray-200 text-gray-400' : ''}
                `}
              >
                {num}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>{t('teacher.completed')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span>{t('teacher.inProgress')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>{t('teacher.next')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span>{t('teacher.locked')}</span>
          </div>
        </div>

        {getCurrentHizbSurahs().length > 0 && (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">{t('teacher.surahsInHizb')} (Hizb {getCurrentHizb()}):</h3>
            <div className="space-y-1">
              {getCurrentHizbSurahs().map((surah) => (
                <div key={surah.id} className="text-sm">
                  {surah.number}. {surah.name}
                  {surah.nameArabic && <span className="text-gray-600"> - {surah.nameArabic}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attendance - FIRST */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-primary mb-4">
          <span>{t('teacher.attendance')}</span>
          <span className="text-red-500 ms-1">*</span>
        </h2>
        
        <div className="grid grid-cols-3 gap-3">
          {(['present', 'absent', 'justified'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFormData(prev => ({ ...prev, attendance: status }))}
              className={`
                p-4 rounded-lg border-2 transition-all font-semibold
                ${formData.attendance === status
                  ? status === 'present' ? 'border-green-600 bg-green-600 text-white'
                  : status === 'absent' ? 'border-red-600 bg-red-600 text-white'
                  : 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {t(`teacher.${status}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Show progress fields only if present */}
      {formData.attendance === 'present' && (
      <>
      {/* Quick Actions */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-primary mb-4">
          {t('teacher.quickActions')}
        </h2>

        {/* Pages Memorized */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('teacher.pageMemorized')}
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFormData(prev => ({ ...prev, pagesMemorized: Math.max(0, prev.pagesMemorized - 1) }))}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center">
              <div className="text-4xl font-bold text-primary">
                {formData.pagesMemorized}
              </div>
              <div className="text-sm text-gray-600">
                +{formData.pagesMemorized * 100} {t('teacher.points')}
              </div>
              {formData.pagesMemorized > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  → {t('teacher.page')} {getCurrentPage()} (Hizb {getCurrentHizb()})
                </div>
              )}
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, pagesMemorized: prev.pagesMemorized + 1 }))}
              className="p-3 bg-secondary hover:bg-secondary/90 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pages Revised */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('teacher.pageRevised')}
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFormData(prev => ({ ...prev, pagesRevised: Math.max(0, prev.pagesRevised - 1) }))}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center">
              <div className="text-4xl font-bold text-primary">
                {formData.pagesRevised}
              </div>
              <div className="text-sm text-gray-600">
                +{formData.pagesRevised * 40} {t('teacher.points')}
              </div>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, pagesRevised: prev.pagesRevised + 1 }))}
              className="p-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Concentration */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-primary mb-4">
          {t('teacher.concentration')}
        </h2>
        
        <div className="grid grid-cols-3 gap-3">
          {(['low', 'medium', 'high'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFormData(prev => ({ ...prev, concentration: level }))}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${formData.concentration === level
                  ? 'border-secondary bg-secondary text-white'
                  : 'border-gray-200 hover:border-secondary'
                }
              `}
            >
              <div className="font-semibold mb-1">
                {t(`teacher.concentration${level.charAt(0).toUpperCase() + level.slice(1)}`)}
              </div>
              <div className="text-sm opacity-80">
                +{level === 'high' ? 50 : level === 'medium' ? 20 : 0} pts
              </div>
            </button>
          ))}
        </div>
      </div>
      </>
      )}

      {/* Comments - Always visible */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-primary mb-4">
          {t('teacher.commentOptional')}
        </h2>
        
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder={t('teacher.addCommentForParents')}
          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none resize-none"
          rows={3}
          maxLength={500}
        />
        <div className="text-xs text-gray-500 mt-1 text-end">
          {formData.notes.length}/500 {t('teacher.characters')}
        </div>
      </div>

      {/* Summary & Save */}
      <div className="card bg-gradient-to-r from-primary to-secondary text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t('teacher.totalPoints')}</h2>
          <div className="text-4xl font-bold">
            {calculatePoints()}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full bg-white text-primary hover:bg-white/90"
        >
          {saving ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full inline-block me-2"></div>
              {t('teacher.saving')}
            </>
          ) : (
            <>
              <Save className="w-5 h-5 inline me-2" />
              {t('teacher.saveProgress')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
