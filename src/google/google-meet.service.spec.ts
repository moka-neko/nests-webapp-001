import { GoogleMeetService } from './google-meet.service';

describe('GoogleMeetService', () => {
  const service = new GoogleMeetService();
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  const json = (body: unknown, ok = true, status = 200) =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    });

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    process.env.GOOGLE_CLIENT_ID = 'client';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    process.env.GOOGLE_REFRESH_TOKEN = 'refresh';
    delete process.env.GOOGLE_CALENDAR_ID;
    delete process.env.INTERVIEW_DURATION_MINUTES;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('環境変数が揃っていれば設定済みと判定する', () => {
    expect(service.isConfigured()).toBe(true);
    delete process.env.GOOGLE_REFRESH_TOKEN;
    expect(service.isConfigured()).toBe(false);
  });

  it('新規作成時は Meet 付きの予定を作成し URL を返す', async () => {
    fetchMock
      .mockReturnValueOnce(json({ access_token: 'token' }))
      .mockReturnValueOnce(
        json({ id: 'event-1', hangoutLink: 'https://meet.google.com/aaa' }),
      );

    const result = await service.createOrUpdateMeeting({
      summary: '面接',
      start: new Date('2026-10-21T05:00:00.000Z'),
      attendeeEmail: 'yamada@example.com',
    });

    expect(result).toEqual({
      eventId: 'event-1',
      meetingUrl: 'https://meet.google.com/aaa',
    });
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
    );
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string) as {
      end: { dateTime: string };
      attendees: { email: string }[];
      conferenceData: {
        createRequest: { conferenceSolutionKey: { type: string } };
      };
    };
    expect(body.end.dateTime).toBe('2026-10-21T05:30:00.000Z');
    expect(body.attendees).toEqual([{ email: 'yamada@example.com' }]);
    expect(body.conferenceData.createRequest.conferenceSolutionKey).toEqual({
      type: 'hangoutsMeet',
    });
  });

  it('予定IDがあれば PATCH で日時を更新し、URL 未確定なら取り直す', async () => {
    fetchMock
      .mockReturnValueOnce(json({ access_token: 'token' }))
      .mockReturnValueOnce(json({ id: 'event-1' }))
      .mockReturnValueOnce(
        json({
          id: 'event-1',
          conferenceData: {
            entryPoints: [
              { entryPointType: 'video', uri: 'https://meet.google.com/bbb' },
            ],
          },
        }),
      );

    const result = await service.createOrUpdateMeeting({
      eventId: 'event-1',
      summary: '面接',
      start: new Date('2026-10-21T05:00:00.000Z'),
    });

    expect(result.meetingUrl).toBe('https://meet.google.com/bbb');
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toContain('/events/event-1?');
    expect(init.method).toBe('PATCH');
  });

  it('API エラー時は例外を投げる', async () => {
    fetchMock.mockReturnValueOnce(json({}, false, 400));
    await expect(
      service.createOrUpdateMeeting({ summary: 'x', start: new Date() }),
    ).rejects.toThrow('Google token refresh failed: 400');
  });
});
