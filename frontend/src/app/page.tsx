// CraftaStudio — src/app/page.tsx
import { redirect } from 'next/navigation'

/**
 * Root page — immediately redirects to the canvas workspace.
 * All auth checks are handled by Clerk middleware on /canvas.
 */
export default function RootPage() {
  redirect('/canvas')
}
