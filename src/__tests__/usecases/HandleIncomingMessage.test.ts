import { HandleIncomingMessage } from '../../application/usecases/HandleIncomingMessage'
import { Customer } from '../../domain/entities/Customer'
import { Conversation } from '../../domain/entities/Conversation'

const mockCustomer: Customer = {
  id: 'cust-1', name: 'Maria Silva', phone: '5511999999999',
  createdAt: new Date(), updatedAt: new Date(),
}

const mockConversation: Conversation = {
  id: 'conv-1', customerId: 'cust-1', status: 'ACTIVE',
  startedAt: new Date(),
}

const makeCustomerRepo = (existing: Customer | null = mockCustomer) => ({
  findByPhone: jest.fn().mockResolvedValue(existing),
  findById: jest.fn().mockResolvedValue(existing),
  create: jest.fn().mockResolvedValue(mockCustomer),
  update: jest.fn().mockResolvedValue(mockCustomer),
  list: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(0),
})

const makeConversationRepo = () => ({
  findActiveByCustomerId: jest.fn().mockResolvedValue(mockConversation),
  findById: jest.fn().mockResolvedValue(mockConversation),
  create: jest.fn().mockResolvedValue(mockConversation),
  updateStatus: jest.fn().mockResolvedValue(undefined),
  finish: jest.fn().mockResolvedValue(undefined),
  getMessages: jest.fn().mockResolvedValue([]),
  saveMessage: jest.fn().mockResolvedValue({ id: 'msg-1' }),
  list: jest.fn().mockResolvedValue([]),
})

const makeMessagingService = () => ({
  sendText: jest.fn().mockResolvedValue(undefined),
  sendTyping: jest.fn().mockResolvedValue(undefined),
})

const makeAgentService = (reply = 'Olá! Como posso ajudar?') => ({
  processMessage: jest.fn().mockResolvedValue({
    reply,
    transferredToHuman: false,
  }),
})

describe('HandleIncomingMessage', () => {
  it('deve atender cliente existente sem criar novo cadastro', async () => {
    const customerRepo = makeCustomerRepo(mockCustomer)
    const conversationRepo = makeConversationRepo()
    const messagingService = makeMessagingService()
    const agentService = makeAgentService()

    const useCase = new HandleIncomingMessage(
      customerRepo as never,
      conversationRepo as never,
      messagingService as never,
      agentService as never,
    )

    await useCase.execute({ phone: '5511999999999', text: 'Olá' })

    expect(customerRepo.findByPhone).toHaveBeenCalledWith('5511999999999')
    expect(customerRepo.create).not.toHaveBeenCalled()
    expect(messagingService.sendText).toHaveBeenCalledWith('5511999999999', 'Olá! Como posso ajudar?')
  })

  it('deve criar novo cliente quando número não existe', async () => {
    const customerRepo = makeCustomerRepo(null)
    const conversationRepo = makeConversationRepo()
    const messagingService = makeMessagingService()
    const agentService = makeAgentService()

    const useCase = new HandleIncomingMessage(
      customerRepo as never,
      conversationRepo as never,
      messagingService as never,
      agentService as never,
    )

    await useCase.execute({ phone: '5511888888888', text: 'Oi', whatsappName: 'João' })

    expect(customerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '5511888888888', whatsappName: 'João' }),
    )
  })

  it('deve salvar mensagem do cliente antes de chamar o agente', async () => {
    const customerRepo = makeCustomerRepo(mockCustomer)
    const conversationRepo = makeConversationRepo()
    const messagingService = makeMessagingService()
    const agentService = makeAgentService()

    const useCase = new HandleIncomingMessage(
      customerRepo as never,
      conversationRepo as never,
      messagingService as never,
      agentService as never,
    )

    await useCase.execute({ phone: '5511999999999', text: 'Quero agendar' })

    expect(conversationRepo.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({ sender: 'customer', content: 'Quero agendar' }),
    )
    expect(agentService.processMessage).toHaveBeenCalled()
  })

  it('deve atualizar status da conversa ao transferir para humano', async () => {
    const customerRepo = makeCustomerRepo(mockCustomer)
    const conversationRepo = makeConversationRepo()
    const messagingService = makeMessagingService()
    const agentService = {
      processMessage: jest.fn().mockResolvedValue({
        reply: 'Transferindo...',
        transferredToHuman: true,
        transferReason: 'Reclamação',
      }),
    }

    const useCase = new HandleIncomingMessage(
      customerRepo as never,
      conversationRepo as never,
      messagingService as never,
      agentService as never,
    )

    await useCase.execute({ phone: '5511999999999', text: 'Quero falar com atendente' })

    expect(conversationRepo.updateStatus).toHaveBeenCalledWith('conv-1', 'TRANSFERRED', 'Reclamação')
  })

  it('deve criar nova conversa quando não houver ativa', async () => {
    const customerRepo = makeCustomerRepo(mockCustomer)
    const conversationRepo = {
      ...makeConversationRepo(),
      findActiveByCustomerId: jest.fn().mockResolvedValue(null),
    }
    const messagingService = makeMessagingService()
    const agentService = makeAgentService()

    const useCase = new HandleIncomingMessage(
      customerRepo as never,
      conversationRepo as never,
      messagingService as never,
      agentService as never,
    )

    await useCase.execute({ phone: '5511999999999', text: 'Olá' })

    expect(conversationRepo.create).toHaveBeenCalledWith('cust-1')
  })
})
