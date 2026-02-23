export interface User {
  id: number;
  role: 'admin' | 'teacher' | 'parent';
  name: string;
  email?: string;
  phone?: string;
  isSuspended?: boolean;
  suspensionReason?: string;
  studentCount?: number;
  createdAt: string;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  parentId: number;
  classId: number;
  photoUrl?: string;
  totalPoints: number;
  monthlyPoints: number;
  currentHizb: number;
  currentSurah: number;
  currentPage: number;
  createdAt: string;
}

export interface Class {
  id: number;
  name: string;
  classType: 'hifz' | 'talqin';
  teacherId: number;
  teacherName?: string;
  studentCount?: number;
}

export interface Surah {
  id: number;
  number: number;
  name: string;
  nameArabic: string;
  englishName: string;
  totalVerses: number;
  revelationType: 'Meccan' | 'Medinan';
  startPage: number;
  endPage: number;
}

export interface Hizb {
  id: number;
  number: number;
  startSurah: number;
  startVerse: number;
  endSurah: number;
  endVerse: number;
  surahs: number[]; // List of surah numbers in this hizb
}

export interface Progress {
  id: number;
  studentId: number;
  date: string;
  pagesMemorized: number;
  pagesRevised: number;
  attendance: 'present' | 'absent' | 'justified';
  concentration: 'low' | 'medium' | 'high';
  pointsEarned: number;
  notes?: string;
  teacherId: number;
}

export interface RegistrationRequest {
  id: number;
  parentPhone: string;
  parentName?: string;
  studentFirstName: string;
  studentLastName: string;
  classId: number;
  className?: string;
  status: 'pending' | 'approved' | 'rejected';
  source?: string;
  existingStudentId?: number | null;
  createdAt: string;
}

export interface PointTransaction {
  id: number;
  studentId: number;
  type: 'memorization' | 'revision' | 'attendance' | 'concentration' | 'streak' | 'hizb_bonus';
  points: number;
  description: string;
  date: string;
}

export interface Verse {
  id: number;
  surahId: number;
  number: number;
  textArabic: string;
  textFrench?: string;
  page: number;
}

export interface Ranking {
  rank: number;
  studentId: number;
  studentName: string;
  points: number;
  classId?: number;
  className?: string;
}

export interface WeeklyAssignment {
  id: number;
  classId: number;
  studentId: number;
  weekStartDate: string;
  surahId: number;
  surahName?: string;
  surahNameArabic?: string;
  versesToPrepare?: string;
  notes?: string;
  status: 'assigned' | 'completed' | 'pending';
  parentAcknowledged: boolean;
  parentAcknowledgedAt?: string;
  teacherId: number;
  createdAt: string;
}

export interface TalqinProgress {
  id: number;
  studentId: number;
  date: string;
  surahPracticed?: number;
  surahName?: string;
  versesPracticed?: string;
  pronunciationQuality: 'excellent' | 'good' | 'needs_improvement';
  tajweedQuality: 'excellent' | 'good' | 'needs_improvement';
  listeningAttention: 'high' | 'medium' | 'low';
  repetitionAccuracy: 'excellent' | 'good' | 'needs_improvement';
  attendance: 'present' | 'absent' | 'justified';
  notes?: string;
  pointsEarned: number;
  teacherId: number;
}

export interface RecoveryRequest {
  id: number;
  requestType: 'wrong_number' | 'add_child' | 'halaqah_change';
  requesterName: string;
  currentPhone?: string;
  newPhone?: string;
  childNameForLookup: string;
  newChildFirstName?: string;
  newChildLastName?: string;
  newClassId?: number;
  newClassName?: string;
  existingStudentId?: number;
  existingStudentName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  adminNotes?: string;
  createdAt: string;
}

export interface AdminStudent {
  id: number;
  firstName: string;
  lastName: string;
  totalPoints: number;
  monthlyPoints: number;
  currentHizb: number;
  currentSurah: number;
  currentPage: number;
  createdAt: string;
  parentId: number;
  parentName: string;
  parentPhone: string;
  parentSuspended: boolean;
  classId: number;
  className: string;
  classType: 'hifz' | 'talqin';
}
