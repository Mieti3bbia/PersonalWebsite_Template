import { AfterViewInit, Component, ElementRef, OnDestroy, inject } from '@angular/core';

@Component({
  selector: 'app-home-page',
  template: `
    <main>
      <section class="splash page-section" aria-label="Splash page">
        <img
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=85"
          alt="Design editoriale con modella e styling contemporaneo"
        >
        <div class="splash-overlay">
          <p>/ Design portfolio /</p>
          <h1 class="slide-in">Nome Cognome</h1>
        </div>
      </section>

      <section class="collaboration-strip page-section" aria-label="Collaborazioni e ambiti di lavoro">
        <div class="collaboration-grid">
          <span class="home-word">Fashion design</span>
          <span class="home-word">Graphic design</span>
          <span class="home-word">Art direction</span>
          <span class="home-word">Digital fashion</span>
          <span class="home-word">Editorial design</span>
          <span class="home-word">Brand identity</span>
          <span class="home-word">Lecturing</span>
          <span class="home-word">Creative consulting</span>
        </div>
      </section>
    </main>
  `
})
export class HomePage implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private words: HTMLElement[] = [];
  private animationFrame = 0;

  private readonly updateVisibility = (): void => {
    cancelAnimationFrame(this.animationFrame);

    this.animationFrame = requestAnimationFrame(() => {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      this.words.forEach((word) => {
        const rect = word.getBoundingClientRect();
        const isVisible = rect.top < viewportHeight * 0.88 && rect.bottom > viewportHeight * 0.12;
        word.classList.toggle('is-visible', isVisible);
      });
    });
  };

  ngAfterViewInit(): void {
    this.words = Array.from(
      this.elementRef.nativeElement.querySelectorAll('.home-word')
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
