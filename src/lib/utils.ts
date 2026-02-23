import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale = 'fr-FR'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatPhoneNumber(phone: string): string {
  // Format: +33 6 12 34 56 78
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]} ${match[6]}`;
  }
  return phone;
}

export function generateClassCode(): string {
  const prefix = 'MOSQ';
  const number = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}-${number}`;
}

export function calculateStreak(attendances: Array<{ date: string; status: string }>): number {
  let streak = 0;
  const sorted = [...attendances].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (const attendance of sorted) {
    if (attendance.status === 'present') {
      streak++;
    } else if (attendance.status === 'absent') {
      break;
    }
  }

  return streak;
}

export function getHizbFromPage(page: number): number {
  // Each Hizb has approximately 10 pages (604 pages / 60 hizbs)
  return Math.ceil(page / 10);
}

export function getSurahName(surahNumber: number, language: 'ar' | 'fr' = 'fr'): string {
  // This would normally come from the database
  // Placeholder implementation
  const surahs: Record<number, { ar: string; fr: string }> = {
    1: { ar: 'الفاتحة', fr: 'Al-Fatiha' },
    2: { ar: 'البقرة', fr: 'Al-Baqara' },
    // ... etc
  };
  
  return surahs[surahNumber]?.[language] || `Surah ${surahNumber}`;
}
