# Context Transfer Fix

## Problem
When switching from simple mode to debate mode mid-conversation, the previous conversation context was not being transferred to the moderator, so the debate didn't consider the conversation history.

## Root Cause
The `ModeSelector` component only updated the UI state locally (`isMultiAgentMode` flag) but never called the backend `/conversations/{id}/switch-mode` API to:
1. Prepare conversation context from message history
2. Store it in the conversation's debate_state metadata

## Solution

### 1. Frontend Changes

#### Updated Mode Selector Handler (`app.js`)
Changed from:
```javascript
this.modeSelector.onChange((mode) => {
    this.isMultiAgentMode = mode === 'multi-agent';
    this.updateMultiAgentUIVisibility();
});
```

To:
```javascript
this.modeSelector.onChange(async (mode) => {
    await this.handleModeChange(mode);
});
```

#### Added `handleModeChange()` Method
New method that:
1. Checks if conversation has existing messages
2. If yes, calls backend `switchMode()` API
3. Shows system message to user confirming switch
4. Handles errors gracefully

#### Added Supporting Methods
- `APIClient.getConversationInfo()` - Gets conversation metadata
- `MessageComponent.addSystemMessage()` - Shows system status messages
- CSS styling for system messages (blue info box)

### 2. How It Works Now

#### Switching: Simple → Debate
1. User has conversation in simple mode with messages
2. User clicks "Debate" button
3. Frontend:
   - Calls `handleModeChange('multi-agent')`
   - Detects existing messages
   - Calls `apiClient.switchMode(conversationId, 'debate', config)`
4. Backend:
   - Loads conversation message history
   - Extracts last 5 user/assistant message pairs
   - Formats as: "Previous conversation:\n\nUser: ...\nAssistant: ..."
   - Stores in `metadata.debate_state.conversation_context`
5. User sends first debate message: "How does X compare to Y?"
6. Backend:
   - Loads debate_state with conversation_context
   - Passes context to moderator in prompt
   - Moderator sees: "## 对话上下文\n\nPrevious conversation:\n\n..."
   - Debate considers full conversation history

#### Switching: Debate → Simple
1. User clicks "Simple" button
2. Frontend calls `switchMode(conversationId, 'simple', null)`
3. Backend:
   - Clears debate configuration
   - Marks debate_state as inactive
   - Preserves conversation history
4. Simple mode continues with full history available

### 3. Context Format Example

When switching from simple to debate with this history:
```
User: What is Python?
Assistant: Python is a high-level programming language...
User: What are its main features?
Assistant: Python's main features include...
```

The debate moderator receives:
```
## 对话上下文

Previous conversation:

User: What is Python?
Assistant: Python is a high-level programming language...
User: What are its main features?
Assistant: Python's main features include...

## 用户问题
How does Python compare to Java?
```

### 4. Bi-directional Context Flow

```
Simple Mode                 Debate Mode
    │                           │
    │──── Messages ────────────>│
    │                           │
    │   [Switch to Debate]      │
    │   prepare_debate_context  │
    │   store in debate_state   │
    │                           │
    │<───── Context ────────────│
    │   (via metadata)          │
    │                           │
    │   [Switch to Simple]      │
    │   clear debate config     │
    │   keep history            │
    │                           │
    │<──── History preserved ───│
```

## Files Modified

1. **`frontend/src/app.js`**
   - Added `handleModeChange()` method
   - Updated mode selector event handler

2. **`frontend/src/utils/api.js`**
   - Added `getConversationInfo()` method

3. **`frontend/src/components/MessageComponent.js`**
   - Added `addSystemMessage()` method

4. **`frontend/src/styles/main.css`**
   - Added `.message.system` styling

## Testing

### Test Case 1: Simple → Debate
1. Start new conversation in Simple mode
2. Ask: "What is Python?"
3. Get answer
4. Switch to Debate mode (should see system message)
5. Ask: "How does it compare to Java?"
6. Verify debate considers Python context

### Test Case 2: Debate → Simple
1. Start conversation in Debate mode
2. Have multi-turn debate
3. Switch to Simple mode
4. Continue conversation
5. Verify history is preserved

### Test Case 3: Empty Conversation
1. Start new conversation
2. Switch modes before any messages
3. Should switch without API call (no context to transfer)

## Notes

- Context includes last 5 message pairs (10 messages total)
- Long messages are truncated to 500 characters in context
- System messages (moderator analysis, etc.) are excluded from context
- Context is stored in SQLite and persists across restarts
