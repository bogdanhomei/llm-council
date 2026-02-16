/*
  # Create conversations and messages tables

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `title` (text, default 'New Conversation')
      - `created_at` (timestamptz, default now())
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to conversations)
      - `role` (text, 'user' or 'assistant')
      - `content` (text, for user messages)
      - `stage1` (jsonb, for assistant stage 1 responses)
      - `stage2` (jsonb, for assistant stage 2 rankings)
      - `stage3` (jsonb, for assistant stage 3 synthesis)
      - `metadata` (jsonb, for label_to_model and aggregate_rankings)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for anon role access (no auth required for this app)

  3. Indexes
    - Index on messages.conversation_id for fast lookups
    - Index on conversations.created_at for sorted listing
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text,
  stage1 jsonb,
  stage2 jsonb,
  stage3 jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon to read conversations"
  ON conversations FOR SELECT
  TO anon
  USING (auth.role() = 'anon');

CREATE POLICY "Allow anon to insert conversations"
  ON conversations FOR INSERT
  TO anon
  WITH CHECK (auth.role() = 'anon');

CREATE POLICY "Allow anon to update conversations"
  ON conversations FOR UPDATE
  TO anon
  USING (auth.role() = 'anon')
  WITH CHECK (auth.role() = 'anon');

CREATE POLICY "Allow anon to delete conversations"
  ON conversations FOR DELETE
  TO anon
  USING (auth.role() = 'anon');

CREATE POLICY "Allow anon to read messages"
  ON messages FOR SELECT
  TO anon
  USING (auth.role() = 'anon');

CREATE POLICY "Allow anon to insert messages"
  ON messages FOR INSERT
  TO anon
  WITH CHECK (auth.role() = 'anon');

CREATE POLICY "Allow anon to update messages"
  ON messages FOR UPDATE
  TO anon
  USING (auth.role() = 'anon')
  WITH CHECK (auth.role() = 'anon');

CREATE POLICY "Allow anon to delete messages"
  ON messages FOR DELETE
  TO anon
  USING (auth.role() = 'anon');
