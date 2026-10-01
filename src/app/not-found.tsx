// Global fallback for URLs outside any locale segment — no next-intl context
// is available here, so this renders its own minimal English document.
export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: "#fbf8f3",
          color: "#1f1c19",
        }}
      >
        <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "6rem 1.25rem" }}>
          <h1 style={{ fontSize: "2rem", lineHeight: 1.2 }}>Page not found</h1>
          <p style={{ marginTop: "1rem", fontSize: "1.125rem", lineHeight: 1.6 }}>
            The page you are looking for does not exist or has moved.
          </p>
          <p style={{ marginTop: "2rem" }}>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- bare fallback document outside the app shell; needs a full navigation into the localized tree */}
            <a
              href="/en/"
              style={{
                display: "inline-block",
                minHeight: "44px",
                padding: "0.75rem 1.5rem",
                borderRadius: "10px",
                backgroundColor: "#b0431f",
                color: "#ffffff",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Back to the homepage
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
