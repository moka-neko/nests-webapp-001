import { Test, TestingModule } from '@nestjs/testing';
import { LineService } from '../line/line.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from './webhooks.service';

describe('WebhooksService', () => {
  let service: WebhooksService;

  const mockTeacher = {
    id: 'teacher-uuid-1',
    email: 'yamada@example.com',
    lineUserId: 'U123',
    meetingUrl: null,
  };

  const prismaMock = {
    teacherApplication: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const lineServiceMock = {
    pushMessage: jest.fn().mockResolvedValue(undefined),
    pushMessageToGroup: jest.fn().mockResolvedValue(undefined),
  };

  const webhookDto = {
    reservationId: 'trx-reservation-00123',
    calendarTitle: '先生面接（山田 太郎）',
    scheduledStartAt: '2026-06-10T14:00:00+09:00',
    scheduledEndAt: '2026-06-10T14:30:00+09:00',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    guestName: '山田 太郎',
    guestEmail: 'yamada@example.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LineService, useValue: lineServiceMock },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('receiveTimerex', () => {
    it('meetingUrlを保存しLINE通知を送信する', async () => {
      prismaMock.teacherApplication.findFirst.mockResolvedValue(mockTeacher);
      prismaMock.teacherApplication.update.mockResolvedValue({
        ...mockTeacher,
        meetingUrl: webhookDto.meetingUrl,
      });

      const result = await service.receiveTimerex(webhookDto);

      expect(result).toEqual({
        message: '予約通知を受け付けました。',
        reservationId: 'trx-reservation-00123',
      });
      expect(prismaMock.teacherApplication.update).toHaveBeenCalledWith({
        where: { id: 'teacher-uuid-1' },
        data: { meetingUrl: webhookDto.meetingUrl },
      });
      expect(lineServiceMock.pushMessage).toHaveBeenCalledWith(
        'U123',
        expect.stringContaining('meet.google.com'),
      );
      expect(lineServiceMock.pushMessageToGroup).toHaveBeenCalledWith(
        expect.stringContaining('面接予約完了'),
      );
    });

    it('応募者が見つからない場合も運営グループ通知は送信する', async () => {
      prismaMock.teacherApplication.findFirst.mockResolvedValue(null);

      const result = await service.receiveTimerex(webhookDto);

      expect(result.reservationId).toBe('trx-reservation-00123');
      expect(prismaMock.teacherApplication.update).not.toHaveBeenCalled();
      expect(lineServiceMock.pushMessage).not.toHaveBeenCalled();
      expect(lineServiceMock.pushMessageToGroup).toHaveBeenCalled();
    });

    it('lineUserIdがない場合は個別通知をスキップする', async () => {
      prismaMock.teacherApplication.findFirst.mockResolvedValue({
        ...mockTeacher,
        lineUserId: null,
      });
      prismaMock.teacherApplication.update.mockResolvedValue(mockTeacher);

      await service.receiveTimerex(webhookDto);

      expect(lineServiceMock.pushMessage).not.toHaveBeenCalled();
      expect(lineServiceMock.pushMessageToGroup).toHaveBeenCalled();
    });
  });
});
