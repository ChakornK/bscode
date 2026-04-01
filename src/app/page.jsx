import ChatPanel from "../components/ChatPanel";

export default function Home() {
  return (
    <main className="flex h-dvh flex-col overflow-hidden p-3">
      <div className="shrink-0 pb-3">
        <p>bscode</p>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="h-full min-h-0 w-full max-w-[33.333%] overflow-hidden">
          <ChatPanel />
        </div>
      </div>
    </main>
  );
}
