import { TeacherApplication, TeacherApplicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** 面接日程調整の対象になる選考ステータス */
export const INTERVIEW_OPEN_STATUSES: TeacherApplicationStatus[] = [
  TeacherApplicationStatus.PENDING,
  TeacherApplicationStatus.INTERVIEW,
];

export type WeeklyInterviewApplication = TeacherApplication & {
  /** 対象週の中で最も早い面接候補日（YYYY-MM-DD） */
  earliestCandidateDate: string;
};

/**
 * 対象週（月〜日）に面接候補日がある選考中の応募者を、候補日の早い順に返す。
 * 月曜のリマインド送信と管理画面「面接日程調整」ページで共通に使う。
 */
export async function findWeeklyInterviewApplications(
  prisma: PrismaService,
  weekDates: string[],
): Promise<WeeklyInterviewApplication[]> {
  const weekSet = new Set(weekDates);
  const openStatuses = new Set(INTERVIEW_OPEN_STATUSES);
  const records = await prisma.teacherApplication.findMany({
    where: {
      status: { in: INTERVIEW_OPEN_STATUSES },
      interviewCandidateDates: { hasSome: weekDates },
    },
  });

  return records
    .filter((record) => openStatuses.has(record.status))
    .map((record) => ({
      ...record,
      earliestCandidateDate:
        record.interviewCandidateDates
          .filter((date) => weekSet.has(date))
          .sort()[0] ?? '',
    }))
    .filter((record) => record.earliestCandidateDate)
    .sort((a, b) =>
      a.earliestCandidateDate === b.earliestCandidateDate
        ? a.nameKanji.localeCompare(b.nameKanji, 'ja')
        : a.earliestCandidateDate.localeCompare(b.earliestCandidateDate),
    );
}
