-- ============================================
-- CONVERSATIONS & CHAT SCHEMA
-- Run this in Supabase SQL Editor to enable two-way messaging
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CONVERSATIONS TABLE (for one-to-one chat threads)
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL,
  user_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for conversations
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON public.conversations;

-- RLS Policies for conversations
CREATE POLICY "conversations_select_policy"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "conversations_insert_policy"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "conversations_update_policy"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id)
  WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "conversations_delete_policy"
  ON public.conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_property_id ON public.conversations(property_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_1_id ON public.conversations(user_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_2_id ON public.conversations(user_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant ON public.conversations(user_1_id, user_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- ============================================
-- CONVERSATION MESSAGES TABLE (messages within a conversation)
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for conversation_messages
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for conversation_messages
DROP POLICY IF EXISTS "conversation_messages_select_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_insert_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_update_policy" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_delete_policy" ON public.conversation_messages;

-- RLS Policies for conversation_messages - users in the conversation can read
CREATE POLICY "conversation_messages_select_policy"
  ON public.conversation_messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE auth.uid() = user_1_id OR auth.uid() = user_2_id
    )
  );

-- RLS Policies for conversation_messages - only conversation participants can insert
CREATE POLICY "conversation_messages_insert_policy"
  ON public.conversation_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id 
    AND conversation_id IN (
      SELECT id FROM public.conversations
      WHERE auth.uid() = user_1_id OR auth.uid() = user_2_id
    )
  );

-- RLS Policies for conversation_messages - only participant can update
CREATE POLICY "conversation_messages_update_policy"
  ON public.conversation_messages
  FOR UPDATE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE auth.uid() = user_1_id OR auth.uid() = user_2_id
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE auth.uid() = user_1_id OR auth.uid() = user_2_id
    )
  );

-- RLS Policies for conversation_messages - delete by sender or participant
CREATE POLICY "conversation_messages_delete_policy"
  ON public.conversation_messages
  FOR DELETE
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR conversation_id IN (
      SELECT id FROM public.conversations
      WHERE auth.uid() = user_1_id OR auth.uid() = user_2_id
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender_id ON public.conversation_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON public.conversation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_is_read ON public.conversation_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_read_at ON public.conversation_messages(read_at);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_delivered_at ON public.conversation_messages(delivered_at);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Conversation update trigger
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update conversation's last_message_at when a message is sent
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NOW(), updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp on new message
DROP TRIGGER IF EXISTS conversation_message_sent ON public.conversation_messages;
CREATE TRIGGER conversation_message_sent
  AFTER INSERT ON public.conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to confirm tables were created successfully:
-- SELECT to_regclass('public.conversations');
-- SELECT to_regclass('public.conversation_messages');
-- Both should return the table OID, indicating successful creation.
