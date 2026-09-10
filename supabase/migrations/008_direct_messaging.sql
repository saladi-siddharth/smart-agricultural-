-- ============================================================================
-- Migration 008: Community Direct Messaging & Permission Gateway
-- Supports 1-on-1 user search, message requests, and accept/reject authorization
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,
  initiator_username TEXT NOT NULL,
  recipient_username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  last_message TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(initiator_username, recipient_username);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_username TEXT NOT NULL,
  recipient_username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conv ON public.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON public.direct_messages(created_at ASC);

-- Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'conversations_select_policy') THEN
    CREATE POLICY conversations_select_policy ON public.conversations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'conversations_insert_policy') THEN
    CREATE POLICY conversations_insert_policy ON public.conversations FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'conversations_update_policy') THEN
    CREATE POLICY conversations_update_policy ON public.conversations FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'direct_messages_select_policy') THEN
    CREATE POLICY direct_messages_select_policy ON public.direct_messages FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'direct_messages_insert_policy') THEN
    CREATE POLICY direct_messages_insert_policy ON public.direct_messages FOR INSERT WITH CHECK (true);
  END IF;
END $$;
