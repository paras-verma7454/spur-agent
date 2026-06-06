import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ChatWidget = dynamic(
  () => import('@/components/ChatWidget').then((m) => m.ChatWidget),
  {
    loading: () => (
      <div className="flex flex-col h-[600px] w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="flex flex-col h-[600px] w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ChatWidget />
      </Suspense>
    </main>
  );
}
