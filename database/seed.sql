-- ============================================================
-- Seed inicial — Route'y 66
-- ============================================================

-- Configurações da oficina
INSERT INTO business_settings (
  company_name, address, phone, welcome_message, slot_duration_minutes
) VALUES (
  'Route''y 66',
  'Rua das Flores, 66 — Arujá, SP',
  '(11) 99999-9999',
  'Olá! 👋 Seja bem-vindo(a) à *Route''y 66*! Aqui cuidamos do seu carro com dedicação e qualidade. Como posso te ajudar hoje?',
  60
) ON CONFLICT (singleton) DO NOTHING;

-- Serviços iniciais
INSERT INTO services (name, description, active) VALUES
  ('Alinhamento',    'Alinhamento de direção e geometria do veículo',           TRUE),
  ('Balanceamento',  'Balanceamento de rodas e pneus',                          TRUE),
  ('Suspensão',      'Revisão e reparo de amortecedores e componentes',         TRUE),
  ('Freios',         'Revisão, reparo e troca de pastilhas e discos de freio',  TRUE),
  ('Pneus',          'Venda, troca e montagem de pneus',                        TRUE),
  ('Escapamento',    'Reparo e substituição de sistemas de escapamento',         TRUE)
ON CONFLICT DO NOTHING;

-- FAQ inicial
INSERT INTO faq (question, answer, active) VALUES
  ('Qual o endereço da oficina?',
   'Estamos localizados na Rua das Flores, 66 — Arujá, SP.',
   TRUE),
  ('Qual o horário de funcionamento?',
   'Funcionamos de segunda a sexta das 08h às 18h e sábados das 08h às 12h.',
   TRUE),
  ('Vocês trabalham com qual marca de pneu?',
   'Trabalhamos com as principais marcas do mercado: Bridgestone, Michelin, Pirelli, Goodyear e Good Year.',
   TRUE),
  ('Preciso agendar ou posso ir direto?',
   'Recomendamos o agendamento para garantir atendimento sem espera, mas também atendemos por ordem de chegada.',
   TRUE),
  ('Vocês emitem nota fiscal?',
   'Sim! Emitimos nota fiscal eletrônica para todos os serviços.',
   TRUE),
  ('Aceitam cartão de crédito?',
   'Sim, aceitamos todas as bandeiras de cartão de crédito e débito, além de PIX e dinheiro.',
   TRUE)
ON CONFLICT DO NOTHING;
