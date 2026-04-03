# Real-time Message Sync & Delivery Status Setup

## Overview
This update adds real-time message synchronization between web and mobile, plus delivery/read receipt indicators (✓ sent, ✓✓ delivered, ✓✓ read in blue).

## Database Schema Changes

### Updated Columns in `conversation_messages` Table

Add two new columns to track message delivery and read status:

```sql
ALTER TABLE public.conversation_messages 
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.conversation_messages 
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_messages_read_at ON public.conversation_messages(read_at);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_delivered_at ON public.conversation_messages(delivered_at);
```

## Implementation Details

### Mobile (React Native/Expo)

**Real-time Subscriptions:**
- `app/conversation/[id].tsx`: Listens to `postgres_changes` on `conversation_messages` table
- `app/messages.tsx`: Subscribes to message updates to refresh unread counts

**Message Status Tracking:**
- When a message is sent: `delivered_at` is set to `NOW()`
- When a message is viewed: `read_at` is set to `NOW()` and `is_read = true`
- Messages from other users are auto-marked as read when the conversation loads

**UI Indicators (for sent messages):**
- Single tick (✓): Message sent (has `delivered_at` but no `read_at`)
- Double tick (✓✓): Message delivered (has `delivered_at`)
- Double blue tick (✓✓ in primary color): Message read (has `read_at`)

### Files Modified

1. **`backend/db/conversations_schema.sql`**
   - Added `delivered_at` and `read_at` columns
   - Added indexes for performance

2. **`backend/db/schema_fixed.sql`**
   - Same schema updates

3. **`app/conversation/[id].tsx`**
   - Real-time subscription to listen for new messages
   - Auto-mark received messages as read with `read_at` timestamp
   - Display delivery/read ticks based on message status
   - Removed polling, now fully real-time

4. **`app/messages.tsx`**
   - Real-time subscription to update unread counts
   - Refreshes when any message status changes

5. **`app/property/[id].tsx`**
   - Include `delivered_at` when sending messages

## Setup Instructions

1. **Run SQL in Supabase:**
   - Go to Supabase Dashboard → SQL Editor
   - Copy and paste the migration SQL above
   - Execute to add columns and indexes

2. **Build and Deploy:**
   ```bash
   npm run android  # or ios
   ```

3. **Test:**
   - List a property
   - Send message from different account (web or mobile)
   - Check that:
     - Message appears instantly on receiver's device
     - Tick marks show delivery status
     - Double blue tick appears when message is read
     - Web and mobile see the same message status

## Features

✅ **Instant Message Sync** — Web ↔ Mobile real-time updates  
✅ **Delivery Receipts** — ✓✓ shown when delivered  
✅ **Read Receipts** — ✓✓ in blue when message is read  
✅ **Auto-read on View** — Received messages marked as read when conversation opens  
✅ **Unread Badge** — Message count updates in real-time  

## Troubleshooting

**Messages not syncing:**
- Verify Supabase Realtime is enabled: `Project Settings → Realtime → Enable`
- Check that `conversation_messages` table has RLS enabled
- Verify network connectivity

**Ticks not showing:**
- Ensure `delivered_at` and `read_at` columns exist in database
- Rebuild app: `npm run android`

**Old messages not showing read status:**
- Run migration SQL to ensure columns exist
- Manually mark messages as read by viewing conversation

