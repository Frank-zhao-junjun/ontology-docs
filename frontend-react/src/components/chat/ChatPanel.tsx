import { useState } from 'react';
import { Button } from 'antd';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';

interface Msg { role: 'user'|'ai'; content: string; }

function ChatPanel({ onSend }: { onSend: (m: string) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
        <Button type="text" block>+ 新对话</Button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {msgs.map((m,i)=><MessageBubble key={i} role={m.role} content={m.content} />)}
      </div>
      <ChatInput onSend={(text) => { setMsgs(p=>[...p,{role:'user',content:text}]); onSend(text); }} />
    </div>
  );
}

export default ChatPanel;
