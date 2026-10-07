import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const ROLL_DURATION = 1.15;

type SplashScreenProps = {
  leaving: boolean;
};

export function SplashScreen({ leaving }: SplashScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLImageElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const creditRef = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    const mark = markRef.current;
    const name = nameRef.current;
    const credit = creditRef.current;
    if (!mark || !name || !credit) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timeline: gsap.core.Timeline | null = null;
    let cancelled = false;

    const play = () => {
      if (cancelled) return;
      const brand = mark.parentElement;
      const gap = brand ? Number.parseFloat(getComputedStyle(brand).columnGap) || 0 : 0;
      const iconW = mark.offsetWidth;
      const textW = name.offsetWidth;
      if (iconW === 0 || textW === 0) return;
      const textLeft = iconW + gap;
      const xStart = textLeft + textW;
      const roll = (xStart / (Math.PI * iconW)) * 360;

      gsap.set(mark, { x: xStart, rotation: roll, transformOrigin: '50% 50%' });
      gsap.set(name, { clipPath: 'inset(0 0 0 100%)' });
      gsap.set(credit, { autoAlpha: 0 });

      const progress = { value: 0 };
      timeline = gsap.timeline();
      timeline.to(progress, {
        value: 1,
        duration: ROLL_DURATION,
        ease: 'power2.inOut',
        onUpdate: () => {
          const amount = progress.value;
          const x = gsap.utils.interpolate(xStart, 0, amount);
          const iconCenter = x + iconW / 2;
          const hidden = gsap.utils.clamp(0, textW, iconCenter - textLeft);
          const inset = (hidden / textW) * 100;
          gsap.set(mark, { x, rotation: gsap.utils.interpolate(roll, 0, amount) });
          gsap.set(name, { clipPath: `inset(0 0 0 ${inset}%)` });
        },
      });
      timeline.to(credit, { autoAlpha: 1, duration: 0.48, ease: 'power1.out' });
    };

    if (document.fonts.status === 'loaded') play();
    else void document.fonts.ready.then(play);

    return () => {
      cancelled = true;
      timeline?.kill();
    };
  }, { scope: rootRef });

  return (
    <div
      ref={rootRef}
      className={`splash ${leaving ? 'is-leaving' : ''}`}
      role="status"
      aria-label="Continuum. Developed by @little.emzzz"
    >
      <div className="splash-lockup">
        <div className="splash-brand">
          <img ref={markRef} className="splash-mark" src="/favicon.png" alt="" />
          <div className="splash-copy">
            <span ref={nameRef} className="splash-name">
              Continuum
            </span>
            <p ref={creditRef} className="splash-credit">
              Developed by @little.emzzz
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
