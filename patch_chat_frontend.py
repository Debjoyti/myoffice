import sys

filepath = 'frontend/src/pages/Careers.js'
with open(filepath, 'r') as f:
    content = f.read()

old_chat_func = """  const sendChatMessage = async () => {
    if (!chatInput.trim() || !interviewSession) return;
    const session_id = interviewSession.session_id;

    // Optimistic UI update
    const newMessages = [...interviewSession.messages, { role: 'user', content: chatInput }];
    setInterviewSession({ ...interviewSession, messages: newMessages });
    const msg = chatInput;
    setChatInput('');

    try {
      const res = await fetch(`/api/careers/ai-interview/${session_id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      if (res.ok) {
        const data = await res.json();
        setInterviewSession({ ...interviewSession, messages: [...newMessages, { role: 'ai', content: data.reply }] });
      }
    } catch (err) {
      console.error("Chat error:", err);
    }
  };"""

new_chat_func = """  const sendChatMessage = async () => {
    if (!chatInput.trim() || !interviewSession) return;
    const session_id = interviewSession.session_id;

    // Optimistic UI update
    const newMessages = [...interviewSession.messages, { role: 'user', content: chatInput }];
    setInterviewSession({ ...interviewSession, messages: newMessages });
    const msg = chatInput;
    setChatInput('');

    try {
      const timeTaken = Math.max(5, Math.floor(msg.length / 5));
      const res = await fetch(`/api/careers/ai-interview/${session_id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, time_taken_seconds: timeTaken })
      });
      if (res.ok) {
        const data = await res.json();
        setInterviewSession({ ...interviewSession, messages: [...newMessages, { role: 'ai', content: data.reply }] });
      }
    } catch (err) {
      console.error("Chat error:", err);
    }
  };"""

content = content.replace(old_chat_func, new_chat_func)

with open(filepath, 'w') as f:
    f.write(content)

print("Apply and Interview frontend patched completely.")
