ALTER TABLE chat_sessions ADD COLUMN summary TEXT NOT NULL DEFAULT '';
ALTER TABLE chat_sessions ADD COLUMN summary_through_message_id TEXT NOT NULL DEFAULT '';
