type SplashScreenProps = {
  leaving: boolean;
};

export function SplashScreen({ leaving }: SplashScreenProps) {
  return (
    <div className={`splash ${leaving ? 'is-leaving' : ''}`} role="status" aria-label="Continuum. Developed by @little.emzzz">
      <div className="splash-lockup">
        <div className="splash-brand">
          <img className="splash-mark" src="/favicon.png" alt="" />
          <div className="splash-copy">
            <span className="splash-name">Continuum</span>
            <p className="splash-credit">Developed by @little.emzzz</p>
          </div>
        </div>
      </div>
    </div>
  );
}
