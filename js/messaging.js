/**
 * FarmPilot Community Direct Messaging Platform & Permission Gateway
 * Provides:
 * 1. User Directory & Multi-Field Search (Farmer name, @username, role, farm, crop)
 * 2. 1-on-1 Direct Messaging Platform
 * 3. First-Time Message Request Authorization:
 *    - Initial contact enters 'PENDING' state
 *    - Recipient is prompted with [✓ Accept] or [✕ Reject]
 *    - Communication flow unlocks ONLY after acceptance
 * 4. LocalStorage & Server API synchronization
 */

(function () {
  // Master Community User Directory
  const DIRECTORY_USERS = [
    {
      username: 'siddharth',
      full_name: 'Siddharth Saladi',
      role: 'OWNER',
      roleLabel: 'Farm Owner & Executive',
      farm_name: 'Green Valley Farm',
      location: 'Machilipatnam, AP',
      crop: 'Paddy (BPT-5204 Samba Mahsuri)',
      avatar: 'S',
      avatar_bg: '#059669',
      verified: true
    },
    {
      username: 'anita',
      full_name: 'Dr. Anita Rao',
      role: 'CONSULTANT',
      roleLabel: 'Principal Agronomist & Advisory Lead',
      farm_name: 'Delta Agronomy Advisory',
      location: 'Krishna District, AP',
      crop: 'Precision Agronomy & AWD',
      avatar: 'A',
      avatar_bg: '#7E22CE',
      verified: true
    },
    {
      username: 'rajesh',
      full_name: 'Rajesh Patel',
      role: 'MANAGER',
      roleLabel: 'Estate Operations Manager',
      farm_name: 'Green Valley Farm',
      location: 'Machilipatnam, AP',
      crop: 'Paddy & Black Gram',
      avatar: 'R',
      avatar_bg: '#2563EB',
      verified: true
    },
    {
      username: 'ramu',
      full_name: 'Ravi Kumar',
      role: 'WORKER',
      roleLabel: 'Field Operations Operator',
      farm_name: 'Green Valley Farm',
      location: 'North Block, Plot A',
      crop: 'Field Machinery & AWD Sluice',
      avatar: 'K',
      avatar_bg: '#D97706',
      verified: true
    },
    {
      username: 'venkat',
      full_name: 'Venkat Reddy',
      role: 'OWNER',
      roleLabel: 'Progressive Farmer & Seed Grower',
      farm_name: 'Krishna Delta Farm',
      location: 'Tenali, Guntur, AP',
      crop: 'Organic Samba & Pulses',
      avatar: 'V',
      avatar_bg: '#047857',
      verified: true
    },
    {
      username: 'laxmi',
      full_name: 'Laxmi Devi',
      role: 'CONSULTANT',
      roleLabel: 'Horticulture & Soil Health Specialist',
      farm_name: 'Godavari Organic Estate',
      location: 'Rajahmundry, AP',
      crop: 'Alluvial Basin Crops & IPM',
      avatar: 'L',
      avatar_bg: '#9333EA',
      verified: true
    },
    {
      username: 'kiran',
      full_name: 'Kiran Varma',
      role: 'MANAGER',
      roleLabel: 'Custom Hire Machinery Contractor',
      farm_name: 'Diviseema Implements Hub',
      location: 'Avanigadda, AP',
      crop: 'Laser Levelers & Transplanters',
      avatar: 'K',
      avatar_bg: '#0284C7',
      verified: true
    },
    {
      username: 'subba',
      full_name: 'Subba Rao',
      role: 'OWNER',
      roleLabel: 'Certified Seed Bank Producer',
      farm_name: 'Divi Seed Farm',
      location: 'Challapalli, AP',
      crop: 'Certified BPT-5204 & MTU-1010',
      avatar: 'S',
      avatar_bg: '#16A34A',
      verified: true
    }
  ];

  // Storage Keys & Safe Access Helper
  const STORAGE_CONVS = 'farmpilot_direct_conversations';
  const STORAGE_MSGS = 'farmpilot_direct_messages';

  function getStorage() {
    if (typeof localStorage !== 'undefined') return localStorage;
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    return {
      _d: {},
      getItem(k) { return this._d[k] || null; },
      setItem(k, v) { this._d[k] = String(v); }
    };
  }

  // Seed default conversations if empty (includes a pending request from @venkat to @siddharth)
  function ensureSeedData() {
    let convs = [];
    try {
      convs = JSON.parse(getStorage().getItem(STORAGE_CONVS) || '[]');
    } catch (e) {
      convs = [];
    }

    if (!convs || convs.length === 0) {
      const initialConvs = [
        {
          id: 'conv-venkat-siddharth',
          initiator_username: 'venkat',
          recipient_username: 'siddharth',
          status: 'PENDING', // Waiting for Siddharth to Accept or Reject
          last_message: 'Namaste Siddharth garu! I saw your Machilipatnam Mandi rate post for BPT-5204. Which miller is paying ₹2,550 spot delivery?',
          last_message_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        },
        {
          id: 'conv-anita-siddharth',
          initiator_username: 'siddharth',
          recipient_username: 'anita',
          status: 'ACCEPTED', // Already accepted connection
          last_message: 'Noted Siddharth. AWD water depth is safe at -4 cm. Apply Zinc Sulfate 21% before the 40th day.',
          last_message_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
          accepted_at: new Date(Date.now() - 1000 * 60 * 590).toISOString()
        }
      ];

      const initialMsgs = [
        {
          id: 'msg-01',
          conversation_id: 'conv-venkat-siddharth',
          sender_username: 'venkat',
          recipient_username: 'siddharth',
          content: 'Namaste Siddharth garu! I saw your Machilipatnam Mandi rate post for BPT-5204. We have 40 tonnes harvested from Tenali plot. Which miller is paying ₹2,550 spot delivery?',
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        },
        {
          id: 'msg-02',
          conversation_id: 'conv-anita-siddharth',
          sender_username: 'siddharth',
          recipient_username: 'anita',
          content: 'Dr. Anita, our North Block Paddy is on Day 38. Soil moisture is at 31% with slight leaf tip discoloration. Should we proceed with foliar spray today?',
          created_at: new Date(Date.now() - 1000 * 60 * 150).toISOString()
        },
        {
          id: 'msg-03',
          conversation_id: 'conv-anita-siddharth',
          sender_username: 'anita',
          recipient_username: 'siddharth',
          content: 'Noted Siddharth. AWD water depth is safe at -4 cm. Apply Zinc Sulfate 21% before the 40th day.',
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        }
      ];

      getStorage().setItem(STORAGE_CONVS, JSON.stringify(initialConvs));
      getStorage().setItem(STORAGE_MSGS, JSON.stringify(initialMsgs));
    }
  }

  ensureSeedData();

  // Helper methods
  function getStoredConvs() {
    try {
      return JSON.parse(getStorage().getItem(STORAGE_CONVS) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveStoredConvs(convs) {
    getStorage().setItem(STORAGE_CONVS, JSON.stringify(convs));
  }

  function getStoredMsgs() {
    try {
      return JSON.parse(getStorage().getItem(STORAGE_MSGS) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveStoredMsgs(msgs) {
    getStorage().setItem(STORAGE_MSGS, JSON.stringify(msgs));
  }

  function getCurrentUsername() {
    const user = window.FarmPilotAuth ? window.FarmPilotAuth.getUser() : null;
    return (user?.username || 'siddharth').replace(/^@/, '').toLowerCase();
  }

  function safeDispatchEvent(name, detail) {
    try {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        const Evt = (typeof CustomEvent !== 'undefined') ? CustomEvent : (window.CustomEvent || null);
        if (Evt) {
          window.dispatchEvent(new Evt(name, { detail }));
        }
      }
    } catch (e) {}
  }

  // --- PUBLIC API ---
  const FarmPilotMessaging = {
    // 1. User Directory & Search
    getUsers(query = '') {
      const q = (query || '').trim().toLowerCase().replace(/^@/, '');
      if (!q) return DIRECTORY_USERS;

      return DIRECTORY_USERS.filter(u => {
        return (
          u.username.toLowerCase().includes(q) ||
          u.full_name.toLowerCase().includes(q) ||
          u.farm_name.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          u.roleLabel.toLowerCase().includes(q) ||
          u.crop.toLowerCase().includes(q) ||
          u.location.toLowerCase().includes(q)
        );
      });
    },

    getUser(username) {
      if (!username) return null;
      const clean = username.replace(/^@/, '').toLowerCase();
      return DIRECTORY_USERS.find(u => u.username.toLowerCase() === clean) || {
        username: clean,
        full_name: clean.charAt(0).toUpperCase() + clean.slice(1),
        role: 'FARMER',
        roleLabel: 'Community Farmer',
        farm_name: 'Regional Ag Plot',
        location: 'Coastal Andhra',
        crop: 'Commercial Crop',
        avatar: clean.charAt(0).toUpperCase(),
        avatar_bg: '#059669',
        verified: false
      };
    },

    // 2. Conversations
    getConversations(forUsername = null) {
      const me = (forUsername || getCurrentUsername()).toLowerCase();
      const convs = getStoredConvs();
      return convs.filter(c => {
        return (
          c.initiator_username.toLowerCase() === me ||
          c.recipient_username.toLowerCase() === me
        );
      }).sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
    },

    getPendingRequests(forUsername = null) {
      const me = (forUsername || getCurrentUsername()).toLowerCase();
      const convs = this.getConversations(me);
      // Return conversations where status is PENDING and I am the recipient
      return convs.filter(c => c.status === 'PENDING' && c.recipient_username.toLowerCase() === me);
    },

    getConversationBetween(userA, userB) {
      const a = userA.toLowerCase().replace(/^@/, '');
      const b = userB.toLowerCase().replace(/^@/, '');
      const convs = getStoredConvs();

      return convs.find(c => {
        const init = c.initiator_username.toLowerCase();
        const recip = c.recipient_username.toLowerCase();
        return (init === a && recip === b) || (init === b && recip === a);
      });
    },

    getMessages(conversationId) {
      const msgs = getStoredMsgs();
      return msgs.filter(m => m.conversation_id === conversationId)
                 .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    },

    // 3. Send Message with First-Time Request Logic
    sendMessage({ from, to, content }) {
      const sender = (from || getCurrentUsername()).toLowerCase().replace(/^@/, '');
      const recipient = to.toLowerCase().replace(/^@/, '');
      const text = (content || '').trim();

      if (!text) throw new Error('Message content cannot be empty.');
      if (sender === recipient) throw new Error('Cannot send a direct message to yourself.');

      let conv = this.getConversationBetween(sender, recipient);
      const convs = getStoredConvs();
      const msgs = getStoredMsgs();
      let isFirstTime = false;

      if (!conv) {
        // First-time contact: Initialize in PENDING state
        isFirstTime = true;
        conv = {
          id: `conv-${sender}-${recipient}-${Date.now()}`,
          initiator_username: sender,
          recipient_username: recipient,
          status: 'PENDING', // Requires recipient approval
          last_message: text,
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        convs.unshift(conv);
      } else {
        // Existing conversation: Check status
        if (conv.status === 'REJECTED') {
          throw new Error('This message request was declined. Communication is closed.');
        }

        if (conv.status === 'PENDING') {
          // If pending and recipient hasn't approved yet, sender cannot spam
          if (conv.initiator_username.toLowerCase() === sender) {
            // Let sender append an update to their request, but it remains pending
          } else {
            // Recipient is replying: this implies acceptance!
            conv.status = 'ACCEPTED';
            conv.accepted_at = new Date().toISOString();
          }
        }

        conv.last_message = text;
        conv.last_message_at = new Date().toISOString();

        // Update in list
        const idx = convs.findIndex(c => c.id === conv.id);
        if (idx !== -1) convs[idx] = conv;
      }

      // Create new message
      const newMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        conversation_id: conv.id,
        sender_username: sender,
        recipient_username: recipient,
        content: text,
        created_at: new Date().toISOString()
      };

      msgs.push(newMsg);

      saveStoredConvs(convs);
      saveStoredMsgs(msgs);

      // Try server dispatch
      try {
        fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMsg)
        }).catch(() => {});
      } catch (e) {}

      // Broadcast event for live UI update
      safeDispatchEvent('farmpilot:message-sent', {
        conversation: conv,
        message: newMsg,
        isFirstTime
      });

      return {
        conversation: conv,
        message: newMsg,
        isFirstTime,
        status: conv.status
      };
    },

    // 4. Accept or Reject Flow (The Core Requirement)
    respondToRequest(conversationId, action) {
      const convs = getStoredConvs();
      const conv = convs.find(c => c.id === conversationId);
      if (!conv) throw new Error('Conversation not found.');

      const currentMe = getCurrentUsername();
      const isRecipient = conv.recipient_username.toLowerCase() === currentMe;

      if (!['ACCEPT', 'REJECT'].includes(action)) {
        throw new Error('Action must be ACCEPT or REJECT.');
      }

      const msgs = getStoredMsgs();

      if (action === 'ACCEPT') {
        conv.status = 'ACCEPTED';
        conv.accepted_at = new Date().toISOString();

        // Add system message
        const sysMsg = {
          id: `msg-sys-${Date.now()}`,
          conversation_id: conv.id,
          sender_username: 'system',
          recipient_username: conv.initiator_username,
          content: `✓ @${conv.recipient_username} accepted the message request. Direct communication is now active.`,
          created_at: new Date().toISOString(),
          is_system: true
        };
        msgs.push(sysMsg);
      } else {
        conv.status = 'REJECTED';
        conv.rejected_at = new Date().toISOString();

        const sysMsg = {
          id: `msg-sys-${Date.now()}`,
          conversation_id: conv.id,
          sender_username: 'system',
          recipient_username: conv.initiator_username,
          content: `✕ @${conv.recipient_username} declined the message request.`,
          created_at: new Date().toISOString(),
          is_system: true
        };
        msgs.push(sysMsg);
      }

      saveStoredConvs(convs);
      saveStoredMsgs(msgs);

      // Dispatch event
      safeDispatchEvent('farmpilot:message-request-responded', {
        conversation: conv,
        action
      });

      return conv;
    },

    // 5. Helper to switch simulated active testing user
    setSimulatedUser(username) {
      if (!window.FarmPilotAuth) return;
      const clean = username.replace(/^@/, '').toLowerCase();
      const u = this.getUser(clean);
      if (u) {
        window.FarmPilotAuth.setUser({
          ...u,
          id: `sim-${clean}`
        });
        safeDispatchEvent('farmpilot:active-user-switched', u);
      }
    }
  };

  window.FarmPilotMessaging = FarmPilotMessaging;
})();
