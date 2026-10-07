type SplashScreenProps = {
  leaving: boolean;
};

export function SplashScreen({ leaving }: SplashScreenProps) {
  return (
    <div className={`splash ${leaving ? 'is-leaving' : ''}`} role="status" aria-label="little.emzzz">
      <div className="splash-lockup">
        <img className="splash-mark" src="/favicon.png" alt="" />
        <span className="splash-handle">little.emzzz</span>
      </div>
    </div>
  );
}
