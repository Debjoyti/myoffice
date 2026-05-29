import type { Metadata } from 'next'
import './globals.css'
import MaintenanceProvider from '@/components/maintenance/MaintenanceProvider'

export const metadata: Metadata = {
  title: { default: 'PRSK — Enterprise Business Suite', template: '%s · PRSK' },
  description: 'PRSK: Complete enterprise suite — HRMS, Payroll, Finance, CRM, and more. Built for modern Indian businesses.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full antialiased">
        <MaintenanceProvider>
          {children}
        </MaintenanceProvider>
      </body>
    </html>
  )
}
