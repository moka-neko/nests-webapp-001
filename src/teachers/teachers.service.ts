import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherApplicationDto } from './dto/create-teacher.dto';
import { UpdateTeacherApplicationDto } from './dto/update-teacher.dto';
import { UpdateTeacherStatusDto } from './dto/update-teacher-status.dto';
import { TeacherApplicationResponseDto } from './dto/teacher-application-response.dto';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  /** API #1: 先生の新規応募を受け付け、DBへ保存する */
  async create(
    dto: CreateTeacherApplicationDto,
  ): Promise<TeacherApplicationResponseDto> {
    return this.prisma.teacherApplication.create({ data: dto });
  }

  /** API #7: 先生の応募データ一覧を取得する */
  async findAll(): Promise<TeacherApplicationResponseDto[]> {
    return this.prisma.teacherApplication.findMany({
      orderBy: { submittedAt: 'desc' },
    });
  }

  /** API #2: 先生の選考ステータスを更新し、メール/LINE通知を行う */
  async updateStatus(
    id: string,
    dto: UpdateTeacherStatusDto,
  ): Promise<TeacherApplicationResponseDto> {
    await this.findOneOrFail(id);
    return this.prisma.teacherApplication.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  /** API #8: 先生の基本情報を更新する */
  async update(
    id: string,
    dto: UpdateTeacherApplicationDto,
  ): Promise<TeacherApplicationResponseDto> {
    await this.findOneOrFail(id);
    return this.prisma.teacherApplication.update({
      where: { id },
      data: dto,
    });
  }

  /** API #9: 指定した先生の応募データを削除する */
  async remove(id: string): Promise<void> {
    await this.findOneOrFail(id);
    await this.prisma.teacherApplication.delete({ where: { id } });
  }

  private async findOneOrFail(id: string) {
    const record = await this.prisma.teacherApplication.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`TeacherApplication id=${id} not found`);
    }
    return record;
  }
}
