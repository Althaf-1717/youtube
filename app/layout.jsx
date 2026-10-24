import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'ArhaStudio — Video Project Library',
  description: 'Organize and manage your YouTube channel video projects with precision.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F3EE] text-[#292825] font-sans antialiased selection:bg-[#F7EBE6] selection:text-[#9B3A22]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
