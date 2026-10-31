import Nav from '@/components/Nav';
import { ToastProvider } from '@/components/Toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="shell">
        <Nav />
        <main className="main">{children}</main>
      </div>
    </ToastProvider>
  );
}
