const EKA_LOGO = `${import.meta.env.BASE_URL}eka-logo.svg`;

export function Footer() {
  return (
    <footer
      className="prism-flex prism-items-center prism-justify-center prism-gap-8 prism-py-24"
      style={{ fontSize: 12, color: 'var(--c-text3)' }}
    >
      <span>Powered by</span>
      <a href="https://www.eka.care" target="_blank" rel="noreferrer" style={{ display: 'flex' }}>
        <img src={EKA_LOGO} alt="Eka Care" style={{ height: 16, display: 'block' }} />
      </a>
      <span>· Records are parsed in your browser and never uploaded</span>
    </footer>
  );
}
