import { AfterViewInit, Component, ElementRef, OnDestroy, inject } from '@angular/core';

@Component({
  selector: 'app-about-page',
  template: `
    <main class="detail-page about-page">
      <section class="about-layout page-section">
        <div>
          <p class="eyebrow">/ About me /</p>
          <h1 class="slide-in">Fashion designer, graphic designer and lecturer.</h1>
        </div>
        <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85" alt="Portrait in a creative studio">
      </section>

      <section class="text-columns page-section">
        <p>My work combines visual research, fashion culture and digital languages. I design identities, editorial systems and image-led projects with a precise, minimal and contemporary approach.</p>
        <p>The practice moves between creative direction, teaching and commissioned work, with attention to composition, material references and the relationship between image and typography.</p>
      </section>

      <section class="about-story page-section" aria-label="About story details">
        <article class="about-story-pair">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer fermentum, mauris non pretium tincidunt, sem justo malesuada justo, vitae egestas augue mi vel mi.</p>
          <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85" alt="Fashion editorial research">
        </article>
        <article class="about-story-pair">
          <p>Praesent rhoncus ex in lorem cursus, sed facilisis lectus aliquet. Donec porta ligula a est varius, a gravida quam aliquet.</p>
          <img src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80" alt="Visual identity study">
        </article>
        <article class="about-story-pair">
          <p>Morbi faucibus lorem at augue vulputate, vel pretium nibh convallis. Etiam vel lacus sit amet nibh accumsan tincidunt.</p>
          <img src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80" alt="Material and styling detail">
        </article>
        <article class="about-story-pair">
          <p>Suspendisse potenti. Nulla facilisi. Curabitur bibendum, ante sed posuere viverra, sapien magna porttitor orci, vitae gravida purus lectus id libero.</p>
          <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85" alt="Studio portrait work">
        </article>
        <article class="about-story-pair">
          <p>Aliquam erat volutpat. Sed non finibus lectus. Pellentesque vitae magna finibus, pulvinar magna sed, iaculis magna.</p>
          <img src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85" alt="Editorial fashion image">
        </article>
        <article class="about-story-pair">
          <p>Vivamus ultricies lacus ac nibh faucibus, non interdum neque porttitor. Duis nec ligula non elit cursus sagittis.</p>
          <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85" alt="Creative studio portrait">
        </article>
      </section>
    </main>
  `
})
export class AboutPage implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const pairs = Array.from(
      this.elementRef.nativeElement.querySelectorAll('.about-story-pair')
    ) as HTMLElement[];

    if (!('IntersectionObserver' in window)) {
      pairs.forEach((pair) => pair.classList.add('is-visible'));
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -8% 0px'
      }
    );

    pairs.forEach((pair) => this.observer?.observe(pair));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
