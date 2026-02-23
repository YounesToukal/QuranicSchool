import { useTranslation } from 'react-i18next';

interface VerseDisplayProps {
  verseKey: string;
  className?: string;
}

export default function VerseDisplay({ verseKey, className = '' }: VerseDisplayProps) {
  const { t } = useTranslation();

  const arabic = t(`verses.${verseKey}.arabic`);
  const french = t(`verses.${verseKey}.french`);

  return (
    <div className={`text-center space-y-3 ${className}`}>
      <p className="verse-text text-2xl md:text-3xl leading-relaxed" dir="rtl">
        {arabic}
      </p>
      <p className="text-primary/80 text-sm md:text-base italic">
        {french}
      </p>
    </div>
  );
}
