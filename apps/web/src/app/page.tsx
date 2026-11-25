export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Muslim Ayat home">
          <span className="brand-mark" aria-hidden="true">م</span>
          <span>Muslim Ayat</span>
        </a>
        <span className="access-note">Quran access, without an account</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">A quieter space for reflection</p>
        <h1 id="hero-title">Come closer to the Quran.</h1>
        <p className="intro">
          Read at your own pace. Your Quran experience is always available,
          with no sign-in required.
        </p>
        <p className="setup-note">
          The reader is being prepared. Verified Quran text and its source
          attribution will be integrated before reading is enabled.
        </p>
      </section>

      <footer className="site-footer">
        <span>Muslim Ayat</span>
        <span>Read freely. Personalize when you choose.</span>
      </footer>
    </main>
  );
}
