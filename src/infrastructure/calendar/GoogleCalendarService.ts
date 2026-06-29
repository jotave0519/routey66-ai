import { google, calendar_v3 } from 'googleapis'
import * as fs from 'fs'
import * as path from 'path'
import { ICalendarService, CalendarSlot, CreateEventInput } from '../../domain/services/ICalendarService'
import { BusinessSettings } from '../../domain/entities/BusinessSettings'

const DAY_MAP: Record<number, string> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
}

// Returns "YYYY-MM-DD" in Brazil timezone regardless of server timezone
function toBRTDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

// Returns the JS day-of-week (0=Sun) for a given date interpreted in BRT
function getBRTDayOfWeek(date: Date): number {
  const iso = toBRTDateStr(date)
  return new Date(`${iso}T12:00:00-03:00`).getDay()
}

function buildAuth() {
  let credentials: object

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  } else {
    const saPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
    if (!saPath) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_PATH must be set')
    const resolved = path.resolve(saPath)
    if (!fs.existsSync(resolved)) throw new Error(`Service account file not found: ${resolved}`)
    credentials = JSON.parse(fs.readFileSync(resolved, 'utf8'))
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
}

export class GoogleCalendarService implements ICalendarService {
  private calendar: calendar_v3.Calendar
  private calendarId: string

  constructor() {
    const calendarId = process.env.GOOGLE_CALENDAR_ID
    if (!calendarId) throw new Error('GOOGLE_CALENDAR_ID must be set')
    this.calendarId = calendarId

    const auth = buildAuth()
    this.calendar = google.calendar({ version: 'v3', auth })
  }

  async getAvailableSlots(
    from: Date,
    to: Date,
    slotMinutes: number,
    settings?: BusinessSettings,
  ): Promise<CalendarSlot[]> {
    const { data } = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        items: [{ id: this.calendarId }],
      },
    })

    const busy = (data.calendars?.[this.calendarId]?.busy ?? []).map((b) => ({
      start: new Date(b.start!),
      end: new Date(b.end!),
    }))

    const slots: CalendarSlot[] = []
    const openingHours = settings?.openingHours

    // Iterate day by day within [from, to] using BRT dates
    const cursor = new Date(from)

    while (cursor < to) {
      const dateStrBRT = toBRTDateStr(cursor)
      const dayKey = DAY_MAP[getBRTDayOfWeek(cursor)]
      const dayHours = openingHours?.[dayKey as keyof typeof openingHours]

      if (dayHours) {
        // Build open/close times explicitly in BRT (-03:00) — never uses server TZ
        const dayOpen = new Date(`${dateStrBRT}T${dayHours.open}:00-03:00`)
        const dayClose = new Date(`${dateStrBRT}T${dayHours.close}:00-03:00`)

        // Generate slots aligned to the schedule grid starting at dayOpen
        const slotStart = new Date(dayOpen)

        while (slotStart < dayClose) {
          const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60_000)
          if (slotEnd > dayClose) break

          // Only offer slots that start at or after `from` (skip past slots for today)
          if (slotStart >= from) {
            const overlaps = busy.some((b) => slotStart < b.end && slotEnd > b.start)
            if (!overlaps) {
              slots.push({ start: new Date(slotStart), end: new Date(slotEnd) })
            }
          }

          slotStart.setTime(slotStart.getTime() + slotMinutes * 60_000)
        }
      }

      // Advance to midnight BRT of the next day
      const nextDateStr = new Date(`${dateStrBRT}T00:00:00-03:00`)
      nextDateStr.setDate(nextDateStr.getDate() + 1)
      const nextDayBRT = toBRTDateStr(nextDateStr)
      cursor.setTime(new Date(`${nextDayBRT}T00:00:00-03:00`).getTime())
    }

    return slots
  }

  async createEvent(input: CreateEventInput): Promise<string> {
    const { data } = await this.calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: {
        summary: input.title,
        description: input.description,
        start: { dateTime: input.start.toISOString(), timeZone: 'America/Sao_Paulo' },
        end: { dateTime: input.end.toISOString(), timeZone: 'America/Sao_Paulo' },
      },
    })

    if (!data.id) throw new Error('Google Calendar did not return an event ID')
    return data.id
  }

  async updateEvent(eventId: string, input: Partial<CreateEventInput>): Promise<void> {
    const patch: calendar_v3.Schema$Event = {}
    if (input.title) patch.summary = input.title
    if (input.description) patch.description = input.description
    if (input.start) patch.start = { dateTime: input.start.toISOString(), timeZone: 'America/Sao_Paulo' }
    if (input.end) patch.end = { dateTime: input.end.toISOString(), timeZone: 'America/Sao_Paulo' }

    await this.calendar.events.patch({
      calendarId: this.calendarId,
      eventId,
      requestBody: patch,
    })
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.calendar.events.delete({ calendarId: this.calendarId, eventId })
  }
}
