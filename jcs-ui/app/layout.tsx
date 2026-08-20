import './globals.css'; import {AppLayout} from '@/components/layout';
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body><AppLayout>{children}</AppLayout></body></html>}
