import { Student } from '@/types';
import { Trophy, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PointsDisplayProps {
  student: Student;
  showDetails?: boolean;
  className?: string;
}

export default function PointsDisplay({ 
  student, 
  showDetails = false,
  className = ''
}: PointsDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
          <Trophy className="w-5 h-5 text-secondary" />
          {t('points.barakah')}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 p-4 rounded-lg">
          <div className="text-3xl font-bold text-secondary">
            {student.totalPoints}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {t('parent.totalPoints')}
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg">
          <div className="text-3xl font-bold text-primary flex items-center gap-1">
            {student.monthlyPoints}
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {t('parent.monthlyPoints')}
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('points.memorizationPoints')}</span>
            <span className="font-semibold">+100 {t('points.perPage')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('points.revisionPoints')}</span>
            <span className="font-semibold">+40 {t('points.perPage')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('points.attendancePoints')}</span>
            <span className="font-semibold">+10 {t('points.perDay')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('points.bonusPoints')}</span>
            <span className="font-semibold text-secondary">+500 {t('points.perHizb')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
