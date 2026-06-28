export interface DayHours {
  open: string   // "HH:MM"
  close: string  // "HH:MM"
}

export type OpeningHours = {
  monday?: DayHours | null
  tuesday?: DayHours | null
  wednesday?: DayHours | null
  thursday?: DayHours | null
  friday?: DayHours | null
  saturday?: DayHours | null
  sunday?: DayHours | null
}

export interface BusinessSettings {
  id: string
  companyName: string
  address: string
  phone?: string | null
  openingHours: OpeningHours
  welcomeMessage: string
  slotDurationMinutes: number
  updatedAt: Date
}
