import type { ReactNode } from "react";

// Root layout is intentionally minimal: the [locale] layout renders <html>.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
