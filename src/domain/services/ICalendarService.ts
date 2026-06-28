export interface CalendarSlot {
  start: Date
  end: Date
  label: string  // "Segunda, 14/07 às 10:00"
}

export interface CreateEventInput {
  title: string
  description: string
  start: Date
  end: Date
}

import { BusinessSettings } from '../entities/BusinessSettings'

export interface ICalendarService {
  getAvailableSlots(from: Date, to: Date, slotMinutes: number, settings?: BusinessSettings): Promise<CalendarSlot[]>
  createEvent(input: CreateEventInput): Promise<string>   // returns eventId
  updateEvent(eventId: string, input: Partial<CreateEventInput>): Promise<void>
  deleteEvent(eventId: string): Promise<void>
}
