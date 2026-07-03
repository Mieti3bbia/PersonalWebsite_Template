import { Component } from '@angular/core';

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
    </main>
  `
})
export class AboutPage {}
