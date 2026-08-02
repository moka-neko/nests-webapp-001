import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TeacherApplicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 開発環境の起動時に、動作確認用のテストデータ（先生応募・生徒応募）を
 * 一括登録するサービス。
 *
 * - 本番環境（NODE_ENV=production）では絶対に実行しない
 * - テスト実行時（NODE_ENV=test）は既定で無効。SEED_DEV_DATA=true で明示的に有効化可能
 * - SEED_DEV_DATA=false を指定すると、開発環境でも無効化できる
 * - 各レコードは固定 ID を持つため、再起動しても重複登録されない（冪等）
 */
@Injectable()
export class DevSeedService implements OnModuleInit {
  private readonly logger = new Logger(DevSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    if (!this.isSeedEnabled()) {
      return;
    }

    const [teacherCount, studentCount] = await Promise.all([
      this.seedTeacherApplications(),
      this.seedStudentApplications(),
    ]);

    if (teacherCount > 0 || studentCount > 0) {
      this.logger.log(
        `開発用テストデータを登録しました（先生応募: ${teacherCount}件, 生徒応募: ${studentCount}件）`,
      );
    }
  }

  private isSeedEnabled(): boolean {
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    if (nodeEnv === 'production') {
      return false;
    }

    const flag = process.env.SEED_DEV_DATA?.trim().toLowerCase();
    if (flag === 'false' || flag === '0') {
      return false;
    }
    if (nodeEnv === 'test' && flag !== 'true' && flag !== '1') {
      return false;
    }
    return true;
  }

  /** 先生の応募テストデータを一括登録する（既存の場合はスキップ） */
  private async seedTeacherApplications(): Promise<number> {
    const teacherApplications = [
      {
        id: 'a0000000-0000-4000-8000-000000000001',
        email: 'yamada.taro@example.com',
        nameKanji: '山田 太郎',
        nameKatakana: 'ヤマダ タロウ',
        age: 25,
        workLocation: '東京都渋谷区',
        resumeUrl: 'https://drive.google.com/file/d/seed-teacher-1',
        questions: '交通費支給はありますか？',
        status: TeacherApplicationStatus.PENDING,
      },
      {
        id: 'a0000000-0000-4000-8000-000000000002',
        email: 'sato.hanako@example.com',
        nameKanji: '佐藤 花子',
        nameKatakana: 'サトウ ハナコ',
        age: 31,
        workLocation: '大阪府大阪市',
        resumeUrl: 'https://drive.google.com/file/d/seed-teacher-2',
        questions: null,
        status: TeacherApplicationStatus.PENDING,
      },
      {
        id: 'a0000000-0000-4000-8000-000000000003',
        email: 'suzuki.ichiro@example.com',
        nameKanji: '鈴木 一郎',
        nameKatakana: 'スズキ イチロウ',
        age: 28,
        workLocation: '神奈川県横浜市',
        resumeUrl: 'https://drive.google.com/file/d/seed-teacher-3',
        questions: '週何コマ担当できますか？',
        status: TeacherApplicationStatus.INTERVIEW,
        meetingUrl: 'https://example.com/meeting/seed-teacher-3',
      },
      {
        id: 'a0000000-0000-4000-8000-000000000004',
        email: 'takahashi.misaki@example.com',
        nameKanji: '高橋 美咲',
        nameKatakana: 'タカハシ ミサキ',
        age: 34,
        workLocation: '愛知県名古屋市',
        resumeUrl: 'https://drive.google.com/file/d/seed-teacher-4',
        questions: null,
        status: TeacherApplicationStatus.HIRED,
        lineDisplayName: '高橋みさき',
        lineUserId: 'seed-line-user-teacher-4',
      },
      {
        id: 'a0000000-0000-4000-8000-000000000005',
        email: 'watanabe.kenji@example.com',
        nameKanji: '渡辺 健二',
        nameKatakana: 'ワタナベ ケンジ',
        age: 42,
        workLocation: '福岡県福岡市',
        resumeUrl: 'https://drive.google.com/file/d/seed-teacher-5',
        questions: '土日のみの勤務は可能ですか？',
        status: TeacherApplicationStatus.REJECTED,
      },
    ];

    const result = await this.prisma.teacherApplication.createMany({
      data: teacherApplications,
      skipDuplicates: true,
    });
    return result.count;
  }

  /** 生徒の応募テストデータを一括登録する（既存の場合はスキップ） */
  private async seedStudentApplications(): Promise<number> {
    const studentApplications = [
      {
        id: 'b0000000-0000-4000-8000-000000000001',
        email: 'tanaka.mei@example.com',
        name: '田中 芽依',
        phoneNumber: '090-1111-1111',
        nationality: '日本',
        questions: '週に何回授業を受けられますか？',
      },
      {
        id: 'b0000000-0000-4000-8000-000000000002',
        email: 'kim.minji@example.com',
        name: 'キム ミンジ',
        phoneNumber: '090-2222-2222',
        nationality: '韓国',
        questions: null,
      },
      {
        id: 'b0000000-0000-4000-8000-000000000003',
        email: 'nguyen.linh@example.com',
        name: 'グエン リン',
        phoneNumber: '090-3333-3333',
        nationality: 'ベトナム',
        questions: 'オンライン授業に対応していますか？',
      },
      {
        id: 'b0000000-0000-4000-8000-000000000004',
        email: 'ito.sora@example.com',
        name: '伊藤 そら',
        phoneNumber: '090-4444-4444',
        nationality: '日本',
        questions: null,
      },
      {
        id: 'b0000000-0000-4000-8000-000000000005',
        email: 'chen.wei@example.com',
        name: 'チェン ウェイ',
        phoneNumber: '090-5555-5555',
        nationality: '中国',
        questions: '教材費はいくらですか？',
      },
    ];

    const result = await this.prisma.studentApplication.createMany({
      data: studentApplications,
      skipDuplicates: true,
    });
    return result.count;
  }
}
