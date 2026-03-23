// CraftaStudio — src/app/layout.tsx
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

/** Root metadata shared across all pages */
export const metadata: Metadata = {
  title: 'CraftaStudio — Architecture-first AI Code Generation',
  description:
    'Design your architecture visually, then let parallel AI agents generate every layer simultaneously.',
  icons: { icon: '/favicon.ico' },
}

/**
 * RootLayout wraps every page with Clerk auth and global styles.
 * Dark mode is enforced at the HTML level via CSS variables in globals.css.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className="min-h-screen bg-[hsl(var(--color-canvas-bg))] text-[hsl(var(--color-text-primary))] antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
