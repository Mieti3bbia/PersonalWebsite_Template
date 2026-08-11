import { AfterViewInit, Component, ElementRef, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <main>
      <section class="splash page-section" aria-label="Splash page">
        <img
          src="/assets/home/landing-red-horizontal.jpg"
          alt="Abstract red fashion concept image"
        >
        <div class="splash-overlay">
          <p>Studio home</p>
          <h1 class="slide-in">
            <span>Maria Sole</span>
            <span>Montironi Lasca</span>
          </h1>
          <a class="home-cta studio-fill-button" routerLink="/contact"><span>Book now</span></a>
        </div>
      </section>

      <section class="clients-section page-section" aria-label="Current and former clients">
        <p class="clients-fade">Current and former clients</p>

        <div class="clients-ticker clients-fade">
          <div class="clients-ticker-track">
            <div class="clients-ticker-set">
              <div class="client-logo client-logo-kataklo" aria-label="Kataklo athletic dance theatre">
                <strong>kataklo</strong>
                <span>athletic dance theatre</span>
              </div>

              <div class="client-logo client-logo-pwc" aria-label="PWC">
                <strong>PWC</strong>
              </div>

              <div class="client-logo client-logo-aiep" aria-label="ariella vidach AiEP">
                <strong>ariella vidach</strong>
                <span>AiEP</span>
              </div>

              <div class="client-logo client-logo-vivarai" aria-label="Viva Rai 2">
                <strong>VivaRai</strong>
                <span>2</span>
              </div>

              <div class="client-logo client-logo-rai" aria-label="Rai">
                <strong>Rai</strong>
              </div>
            </div>

            <div class="clients-ticker-set" aria-hidden="true">
              <div class="client-logo client-logo-kataklo">
                <strong>kataklo</strong>
                <span>athletic dance theatre</span>
              </div>

              <div class="client-logo client-logo-pwc">
                <strong>PWC</strong>
              </div>

              <div class="client-logo client-logo-aiep">
                <strong>ariella vidach</strong>
                <span>AiEP</span>
              </div>

              <div class="client-logo client-logo-vivarai">
                <strong>VivaRai</strong>
                <span>2</span>
              </div>

              <div class="client-logo client-logo-rai">
                <strong>Rai</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `
})
export class HomePage implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private fadeElements: HTMLElement[] = [];
  private animationFrame = 0;

  private readonly updateVisibility = (): void => {
    cancelAnimationFrame(this.animationFrame);

    this.animationFrame = requestAnimationFrame(() => {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      this.fadeElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < viewportHeight * 0.88 && rect.bottom > viewportHeight * 0.12;
        element.classList.toggle('is-visible', isVisible);
      });
    });
  };

  ngAfterViewInit(): void {
    this.fadeElements = Array.from(
      this.elementRef.nativeElement.querySelectorAll('.home-word, .clients-fade')
    ) as HTMLElement[];

    window.addEventListener('scroll', this.updateVisibility, { passive: true });
    window.addEventListener('resize', this.updateVisibility, { passive: true });

    this.updateVisibility();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.updateVisibility);
    window.removeEventListener('resize', this.updateVisibility);
    cancelAnimationFrame(this.animationFrame);
  }
}
