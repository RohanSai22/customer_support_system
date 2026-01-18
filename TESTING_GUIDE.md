# 🧪 Testing Guide - AI Customer Support System

## 📊 System Status

✅ **All Services Running:**
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Database: PostgreSQL (customer_support_db)
- Drizzle Studio: http://localhost:4983

✅ **AI Model:** gemma-2-27b-it (supports tool calling)

---

## 🎯 Test Scenario: Invoice Query

### User: **Shari Torphy MD**
- **User ID:** `6bc9f0f1-54fa-4e93-ba75-920425d82809`
- **Email:** `Marge.Beatty@yahoo.com`

### Invoice: **INV-T7PW8U9M**
- **Amount:** $1,979.91
- **Status:** overdue
- **Order:** ORD-1AEB8VNI

---

## 📝 How to Test

### Step 1: Open Application
Navigate to http://localhost:3000

### Step 2: Select User
Find and select **"Shari Torphy MD"** from the dropdown

### Step 3: Test Billing Agent
Ask: "How much is invoice INV-T7PW8U9M?"

**Expected Result:**
- Agent routes to **Billing Agent**
- Calls `getInvoiceDetails` tool
- Returns: "$1,979.91" with status "overdue"

### Step 4: Test Order Agent
Ask: "What's the status of order ORD-1AEB8VNI?"

**Expected Result:**
- Agent routes to **Order Agent**
- Calls `getOrderDetails` tool
- Returns order status and details

---

## 👥 Sample Users in Database

| User ID | Name | Email | Orders | Invoices |
|---------|------|-------|--------|----------|
| `1582c832-60a1-493f-9836-60bf781a128c` | Simon Schinner | Ottilie_Homenick47@hotmail.com | 1 | 1 |
| `2d0e0cde-ccac-4b3f-b518-d563098102cc` | Mrs. Eleanor Kemmer | Zechariah_Kulas@hotmail.com | 2 | 2 |
| `36a6de02-6aae-4b1c-b733-06787becc7c9` | Neal Homenick | Rowan_Krajcik@hotmail.com | 2 | 2 |
| `3e24542d-f565-4763-ab29-8d90e5a38fc6` | Ellis Bauch | Ike.Langosh-Prosacco34@hotmail.com | 1 | 1 |
| `6bc9f0f1-54fa-4e93-ba75-920425d82809` | **Shari Torphy MD** | **Marge.Beatty@yahoo.com** | **2** | **2** |

**Total:** 20 users, 40 orders, 40 invoices, ~100 messages

---

## 🔧 Troubleshooting

### Browser Console Errors (Can Ignore)
These are from **browser extensions**, NOT your app:
- `contentScript.js` - Browser extension
- `jQuery.Deferred` - Browser extension
- `MetaMask` - Crypto wallet extension

### API Responses Not Working?
1. Check terminal for errors
2. Verify model name: `gemma-2-27b-it`
3. Check API key in `apps/api/.env`
4. Restart servers: `Ctrl+C` then `bunx --bun turbo dev`

### Tool Calling Not Working?
- Model `gemma-2-27b-it` **DOES support** function calling
- Check agent files use correct model
- Verify tools are defined in agent files

---

## 📋 Test Queries

### Billing Agent Tests
```
"How much is invoice INV-T7PW8U9M?"
"What's the status of my invoice INV-T7PW8U9M?"
"Show me invoice details for INV-T7PW8U9M"
```

### Order Agent Tests
```
"What's the status of order ORD-1AEB8VNI?"
"Track my order ORD-1AEB8VNI"
"Show me order details for ORD-1AEB8VNI"
```

### General Agent Tests
```
"What are your business hours?"
"How can I contact support?"
"Tell me about your company"
```

---

## 🎬 Expected Behavior

1. **Message sent** → Shows in chat
2. **Agent routing** → Displays which agent is handling
3. **Tool execution** → Agent calls database tools
4. **Response** → Shows data from database
5. **Context** → Maintains conversation history

---

## 🚀 Quick Start Commands

```powershell
# Start database
docker compose up -d

# Start all servers
bunx --bun turbo dev

# View database (optional)
cd packages/db
bunx drizzle-kit studio --port 4983
```

---

## ✅ Success Criteria

- [x] User can select from dropdown
- [x] Chat interface loads
- [x] Messages send successfully
- [x] Agent routing works (shows correct agent)
- [x] **Tools are called** (database queries)
- [x] **Correct data returned** (invoice amount, order status)
- [x] Conversation history maintained

---

**Last Updated:** January 19, 2026
**Model:** gemma-2-27b-it
**Status:** ✅ Ready for testing
