import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/**
 * 履歴書の学歴・職歴・資格などの1行分（年月 + 内容）
 */
export class ResumeHistoryEntryDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'yearMonth は YYYY-MM 形式で入力してください',
  })
  @ApiPropertyOptional({ description: '年月（YYYY-MM）', example: '2018-04' })
  yearMonth: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @ApiPropertyOptional({
    description: '内容',
    example: '○○大学 教育学部 入学',
  })
  description: string;
}

/**
 * 履歴書の入力内容（ファイルではなくフォームに直接入力する）。
 * 項目は一般的な履歴書に準拠。全項目任意。
 */
export class TeacherResumeInputDto {
  @IsUrl()
  @IsOptional()
  @ApiPropertyOptional({
    description:
      '顔写真URL（POST /api/v1/teachers/applications/photo でアップロードした画像の公開URL）',
    example:
      'https://xxxx.supabase.co/storage/v1/object/public/teacher-photos/photos/xxxx.jpg',
  })
  photoUrl?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'birthDate は YYYY-MM-DD 形式で入力してください',
  })
  @ApiPropertyOptional({
    description: '生年月日（YYYY-MM-DD）',
    example: '2000-04-01',
  })
  birthDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @ApiPropertyOptional({ description: '性別（任意回答）', example: '男性' })
  gender?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @ApiPropertyOptional({ description: '電話番号', example: '090-1234-5678' })
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  @ApiPropertyOptional({ description: '郵便番号', example: '150-0002' })
  postalCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  @ApiPropertyOptional({
    description: '現住所',
    example: '東京都渋谷区渋谷1-2-3',
  })
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @ApiPropertyOptional({ description: '最寄り駅', example: 'JR山手線 渋谷駅' })
  nearestStation?: string;

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ResumeHistoryEntryDto)
  @IsOptional()
  @ApiPropertyOptional({
    description: '学歴（年月順）',
    type: [ResumeHistoryEntryDto],
  })
  education?: ResumeHistoryEntryDto[];

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ResumeHistoryEntryDto)
  @IsOptional()
  @ApiPropertyOptional({
    description: '職歴（年月順）',
    type: [ResumeHistoryEntryDto],
  })
  workHistory?: ResumeHistoryEntryDto[];

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ResumeHistoryEntryDto)
  @IsOptional()
  @ApiPropertyOptional({
    description: '免許・資格（年月順）',
    type: [ResumeHistoryEntryDto],
  })
  qualifications?: ResumeHistoryEntryDto[];

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @ApiPropertyOptional({
    description: '志望動機',
    example: '子どもに教えることが好きで…',
  })
  motivation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @ApiPropertyOptional({
    description: '自己PR',
    example: '大学時代に塾講師のアルバイトを3年間…',
  })
  selfPromotion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ApiPropertyOptional({ description: '趣味・特技', example: '読書、水泳' })
  hobbies?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @ApiPropertyOptional({
    description: '本人希望記入欄',
    example: '週3日勤務を希望します',
  })
  requests?: string;
}

/**
 * 履歴書のレスポンス
 */
export class TeacherResumeResponseDto {
  @ApiPropertyOptional({ type: 'string', nullable: true })
  photoUrl: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  birthDate: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  gender: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  phoneNumber: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  postalCode: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  address: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  nearestStation: string | null;

  @ApiPropertyOptional({ type: [ResumeHistoryEntryDto], nullable: true })
  education: ResumeHistoryEntryDto[] | null;

  @ApiPropertyOptional({ type: [ResumeHistoryEntryDto], nullable: true })
  workHistory: ResumeHistoryEntryDto[] | null;

  @ApiPropertyOptional({ type: [ResumeHistoryEntryDto], nullable: true })
  qualifications: ResumeHistoryEntryDto[] | null;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  motivation: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  selfPromotion: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  hobbies: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  requests: string | null;
}
