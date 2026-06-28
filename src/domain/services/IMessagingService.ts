export interface IMessagingService {
  sendText(phone: string, text: string): Promise<void>
  sendTyping(phone: string): Promise<void>
}
