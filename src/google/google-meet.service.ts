import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface GoogleMeetEventInput {
  /** 既存の予定ID。あれば日時を更新し、同じ Meet URL を使い続ける */
  eventId?: string | null;
  summary: string;
  description?: string;
  start: Date;
  attendeeEmail?: string;
}

export interface GoogleMeetEventResult {
  eventId: string;
  meetingUrl: string;
}

interface CalendarEvent {
  id: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: { entryPointType?: string; uri?: string }[];
  };
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

/**
 * Google カレンダーに面接予定を作成し、Google Meet の URL を発行する。
 *
 * 教室の Google アカウントで発行した OAuth リフレッシュトークンを使う
 * （個人の Gmail アカウントでも利用可能。サービスアカウントは Workspace の
 * ドメイン全体の委任がないと Meet を発行できないため使わない）。
 */
@Injectable()
export class GoogleMeetService {
  private readonly logger = new Logger(GoogleMeetService.name);

  isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN,
    );
  }

  private get calendarId(): string {
    return process.env.GOOGLE_CALENDAR_ID || 'primary';
  }

  private get durationMinutes(): number {
    const value = Number(process.env.INTERVIEW_DURATION_MINUTES ?? 30);
    return Number.isFinite(value) && value > 0 ? value : 30;
  }

  async createOrUpdateMeeting(
    input: GoogleMeetEventInput,
  ): Promise<GoogleMeetEventResult> {
    const accessToken = await this.fetchAccessToken();
    const end = new Date(input.start.getTime() + this.durationMinutes * 60_000);
    const body: Record<string, unknown> = {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start.toISOString(), timeZone: 'Asia/Tokyo' },
      end: { dateTime: end.toISOString(), timeZone: 'Asia/Tokyo' },
      ...(input.attendeeEmail
        ? { attendees: [{ email: input.attendeeEmail }] }
        : {}),
    };

    const calendarPath = `${CALENDAR_API}/calendars/${encodeURIComponent(this.calendarId)}/events`;
    let event: CalendarEvent;
    if (input.eventId) {
      event = await this.request<CalendarEvent>(
        `${calendarPath}/${encodeURIComponent(input.eventId)}?conferenceDataVersion=1&sendUpdates=all`,
        accessToken,
        'PATCH',
        body,
      );
    } else {
      body.conferenceData = {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
      event = await this.request<CalendarEvent>(
        `${calendarPath}?conferenceDataVersion=1&sendUpdates=all`,
        accessToken,
        'POST',
        body,
      );
    }

    let meetingUrl = this.extractMeetUrl(event);
    if (!meetingUrl) {
      // 会議の作成が非同期で完了する場合があるため、一度だけ取り直す
      const refreshed = await this.request<CalendarEvent>(
        `${calendarPath}/${encodeURIComponent(event.id)}`,
        accessToken,
        'GET',
      );
      meetingUrl = this.extractMeetUrl(refreshed);
    }
    if (!meetingUrl) {
      throw new Error('Google Meet の URL を取得できませんでした');
    }

    return { eventId: event.id, meetingUrl };
  }

  private extractMeetUrl(event: CalendarEvent): string | undefined {
    return (
      event.hangoutLink ??
      event.conferenceData?.entryPoints?.find(
        (entry) => entry.entryPointType === 'video',
      )?.uri
    );
  }

  private async fetchAccessToken(): Promise<string> {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN ?? '',
      }).toString(),
    });
    if (!response.ok) {
      this.logger.error(`Google token refresh failed: ${response.status}`);
      throw new Error(`Google token refresh failed: ${response.status}`);
    }
    const json = (await response.json()) as { access_token: string };
    return json.access_token;
  }

  private async request<T>(
    url: string,
    accessToken: string,
    method: 'GET' | 'POST' | 'PATCH',
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error(
        `Google Calendar API ${method} failed: ${response.status} ${text}`,
      );
      throw new Error(`Google Calendar API failed: ${response.status}`);
    }
    return (await response.json()) as T;
  }
}
