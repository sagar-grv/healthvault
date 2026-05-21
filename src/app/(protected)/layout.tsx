export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check is handled by proxy.ts (middleware)
  // No need to duplicate it here — proxy redirects unauthenticated users to /login
  return <>{children}</>;
}
