import ChatPanel from '../chat/ChatPanel';
function LeftSidebar() {
  return <ChatPanel onSend={(msg) => { /* Phase 4: connect to /api/chat/execute */ }} />;
}
export default LeftSidebar;
