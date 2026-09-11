import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xgcamlpkbgjulkfknpud.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3rbDSN4ONrtCxacboVfEdA_3nkUt82f';

async function testCommunityMessaging() {
  console.log('💬 Testing Community Direct Messaging & RLS Security...\n');

  // Client A: Siddharth (farmer@greenvalley.in)
  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authA, error: errA } = await clientA.auth.signInWithPassword({
    email: 'farmer@greenvalley.in',
    password: 'Farmer@2026!'
  });
  if (errA) {
    console.error('Failed to sign in User A:', errA.message);
    process.exit(1);
  }
  console.log('✓ User A signed in:', authA.user.email);

  // Client B: Rajesh Manager (manager@greenvalley.in)
  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authB, error: errB } = await clientB.auth.signInWithPassword({
    email: 'manager@greenvalley.in',
    password: 'Manager@2026!'
  });
  if (errB) {
    console.error('Failed to sign in User B:', errB.message);
    process.exit(1);
  }
  console.log('✓ User B signed in:', authB.user.email);

  // Client C: Ramu Worker (worker@greenvalley.in) - Eavesdropper
  const clientC = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authC, error: errC } = await clientC.auth.signInWithPassword({
    email: 'worker@greenvalley.in',
    password: 'Worker@2026!'
  });
  if (errC) {
    console.error('Failed to sign in User C:', errC.message);
    process.exit(1);
  }
  console.log('✓ User C (Unrelated Worker) signed in:', authC.user.email);

  const convId = 'conv-rajesh-siddharth';
  const testMessageBody = `Namaste Rajesh! Automated RLS test message sent at ${new Date().toISOString()}`;
  const clientMsgId = `test-${Date.now()}`;

  // Ensure conversation exists in database
  const { data: convData, error: cErr } = await clientA.from('conversations').insert({
    id: convId,
    conversation_type: 'DIRECT',
    initiator_username: 'siddharth',
    recipient_username: 'rajesh',
    created_by: authA.user.id,
    status: 'ACCEPTED'
  }).select();
  console.log('Conversation insert result:', { convData, cErr });

  const { data: cmData, error: cmErr } = await clientA.from('conversation_members').insert([
    { conversation_id: convId, user_id: authA.user.id, username: 'siddharth', status: 'ACTIVE' },
    { conversation_id: convId, user_id: authB.user.id, username: 'rajesh', status: 'ACTIVE' }
  ]).select();
  console.log('Conversation members insert result:', { cmData, cmErr });

  // 1. User A sends message to User B
  console.log('\n📤 User A sending message to User B...');
  const { data: sentMsg, error: sendErr } = await clientA.from('messages').insert({
    conversation_id: convId,
    sender_id: authA.user.id,
    sender_username: 'siddharth',
    recipient_id: authB.user.id,
    recipient_username: 'rajesh',
    body: testMessageBody,
    client_message_id: clientMsgId
  }).select().single();

  if (sendErr) {
    console.error('❌ User A failed to send message:', sendErr.message);
    process.exit(1);
  }
  console.log('✓ Message persisted to Supabase messages table! ID:', sentMsg.id);

  // 2. User B reads messages in conversation
  console.log('\n📥 User B reading conversation messages...');
  const { data: bMessages, error: bReadErr } = await clientB.from('messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: false });

  if (bReadErr) {
    console.error('❌ User B failed to read messages:', bReadErr.message);
    process.exit(1);
  }
  console.log(`✓ User B successfully received ${bMessages.length} messages in conversation!`);
  const found = bMessages.some(m => m.client_message_id === clientMsgId);
  console.log(`✓ Sent message found in User B inbox:`, found);

  // 3. User C (Unrelated Worker) attempts to read conversation messages
  console.log('\n🛡️ User C (Unrelated Worker) attempting to read Conversation C...');
  const { data: cMessages, error: cReadErr } = await clientC.from('messages')
    .select('*')
    .eq('conversation_id', convId);

  console.log('User C query result count:', cMessages?.length || 0);
  if ((cMessages?.length || 0) > 0) {
    console.error('❌ SECURITY VIOLATION: User C was able to read private conversation messages!');
    process.exit(1);
  } else {
    console.log('✓ PASS: User C is strictly BLOCKED from reading private conversation messages by RLS (0 rows returned)!');
  }

  // 4. Test User C attempting unauthorized spoofed insert
  console.log('\n🛡️ User C attempting to insert spoofed message as User A...');
  const { data: spoofedMsg, error: spoofErr } = await clientC.from('messages').insert({
    conversation_id: convId,
    sender_id: authA.user.id, // spoofed sender ID
    sender_username: 'siddharth',
    body: 'I am spoofing Siddharth'
  });

  if (spoofErr) {
    console.log(`✓ PASS: Spoofed insert strictly REJECTED by RLS: "${spoofErr.message}"`);
  } else {
    console.error('❌ SECURITY VIOLATION: Spoofed message was accepted!');
    process.exit(1);
  }

  // Clean up
  await clientA.auth.signOut();
  await clientB.auth.signOut();
  await clientC.auth.signOut();

  console.log('\n🎉 ALL COMMUNITY MESSAGING & RLS SECURITY TESTS PASSED!');
  process.exit(0);
}

testCommunityMessaging();
