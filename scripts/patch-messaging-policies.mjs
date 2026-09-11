import { query, dbPool } from '../services/data/db.js';

async function patchPolicies() {
  console.log('Applying perfected messaging RLS policies...');

  await query(`
    -- Drop existing messaging policies
    DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
    DROP POLICY IF EXISTS "conversations_insert_auth" ON public.conversations;
    DROP POLICY IF EXISTS "conversations_update_participant" ON public.conversations;
    DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;

    DROP POLICY IF EXISTS "conv_members_select" ON public.conversation_members;
    DROP POLICY IF EXISTS "conv_members_modify" ON public.conversation_members;
    DROP POLICY IF EXISTS "conv_members_insert" ON public.conversation_members;

    DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
    DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
    DROP POLICY IF EXISTS "messages_update_sender" ON public.messages;

    -- Security Definer helper to check conversation membership without RLS recursion
    CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conv_id TEXT, p_user_id UUID)
    RETURNS BOOLEAN
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public, auth, pg_temp
    AS $$
      SELECT EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_id = p_conv_id AND user_id = p_user_id
      ) OR EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = p_conv_id AND (
          created_by = p_user_id OR
          initiator_username = (SELECT username FROM public.profiles WHERE id = p_user_id) OR
          recipient_username = (SELECT username FROM public.profiles WHERE id = p_user_id)
        )
      );
    $$;

    -- 1. CONVERSATIONS (Direct row check, zero cross-table recursion)
    CREATE POLICY conversations_select_participant ON public.conversations
      FOR SELECT USING (
        created_by = auth.uid() OR
        initiator_username = (SELECT username FROM public.profiles WHERE id = auth.uid()) OR
        recipient_username = (SELECT username FROM public.profiles WHERE id = auth.uid())
      );

    CREATE POLICY conversations_insert_auth ON public.conversations
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
          created_by = auth.uid() OR
          initiator_username = (SELECT username FROM public.profiles WHERE id = auth.uid()) OR
          created_by IS NULL
        )
      );

    CREATE POLICY conversations_update_participant ON public.conversations
      FOR UPDATE USING (
        created_by = auth.uid() OR
        initiator_username = (SELECT username FROM public.profiles WHERE id = auth.uid()) OR
        recipient_username = (SELECT username FROM public.profiles WHERE id = auth.uid())
      ) WITH CHECK (
        created_by = auth.uid() OR
        initiator_username = (SELECT username FROM public.profiles WHERE id = auth.uid()) OR
        recipient_username = (SELECT username FROM public.profiles WHERE id = auth.uid())
      );

    -- 2. CONVERSATION MEMBERS (Using security definer helper)
    CREATE POLICY conv_members_select ON public.conversation_members
      FOR SELECT USING (
        user_id = auth.uid() OR
        public.is_conversation_member(conversation_id, auth.uid())
      );

    CREATE POLICY conv_members_modify ON public.conversation_members
      FOR ALL USING (
        user_id = auth.uid() OR
        public.is_conversation_member(conversation_id, auth.uid())
      ) WITH CHECK (
        user_id = auth.uid() OR
        public.is_conversation_member(conversation_id, auth.uid())
      );

    -- 3. MESSAGES (Using security definer helper)
    CREATE POLICY messages_select_participant ON public.messages
      FOR SELECT USING (
        sender_id = auth.uid() OR
        recipient_id = auth.uid() OR
        public.is_conversation_member(conversation_id, auth.uid())
      );

    CREATE POLICY messages_insert_sender ON public.messages
      FOR INSERT WITH CHECK (
        (sender_id = auth.uid() OR sender_username = (SELECT username FROM public.profiles WHERE id = auth.uid())) AND
        public.is_conversation_member(conversation_id, auth.uid())
      );

    CREATE POLICY messages_update_sender ON public.messages
      FOR UPDATE USING (sender_id = auth.uid())
      WITH CHECK (sender_id = auth.uid());
  `);

  console.log('✓ Messaging policies updated successfully!');
  if (dbPool) await dbPool.end();
  process.exit(0);
}

patchPolicies();
