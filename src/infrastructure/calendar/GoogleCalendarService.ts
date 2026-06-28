import { google, calendar_v3 } from 'googleapis'
import * as fs from 'fs'
import * as path from 'path'
import { ICalendarService, CalendarSlot, CreateEventInput } from '../../domain/services/ICalendarService'
import { BusinessSettings } from '../../domain/entities/BusinessSettings'

const PT_DAYS: Record<string, string> = {
  monday: 'segunda', tuesday: 'terça', wednesday: 'quarta',
  thursday: 'quinta', friday: 'sexta', saturday: 'sábado', sunday: 'domingo',
}

const DAY_MAP: Record<number, string> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
}

function formatLabel(date: Date): string {
  const day = DAY_MAP[date.getDay()]
  const ptDay = PT_DAYS[day] ?? day
  const datePart = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const timePart = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${ptDay.charAt(0).toUpperCase() + ptDay.slice(1)}, ${datePart} às ${timePart}`
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
    const cursor = new Date(from)
    const openingHours = settings?.openingHours

    while (cursor < to) {
      const dayKey = DAY_MAP[cursor.getDay()]
      const dayHours = openingHours?.[dayKey as keyof typeof openingHours]

      if (dayHours) {
        const [openH, openM] = dayHours.open.split(':').map(Number)
        const [closeH, closeM] = dayHours.close.split(':').map(Number)

        const dayOpen = new Date(cursor)
        dayOpen.setHours(openH, openM, 0, 0)

        const dayClose = new Date(cursor)
        dayClose.setHours(closeH, closeM, 0, 0)

        const slotStart = cursor < dayOpen ? new Date(dayOpen) : new Date(cursor)

        while (slotStart < dayClose) {
          const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60_000)
          if (slotEnd > dayClose) break

          const overlaps = busy.some((b) => slotStart < b.end && slotEnd > b.start)
          if (!overlaps) {
            slots.push({
              start: new Date(slotStart),
              end: new Date(slotEnd),
              label: formatLabel(slotStart),
            })
          }

          slotStart.setTime(slotStart.getTime() + slotMinutes * 60_000)
        }
      }

      cursor.setDate(cursor.getDate() + 1)
      cursor.setHours(0, 0, 0, 0)
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
