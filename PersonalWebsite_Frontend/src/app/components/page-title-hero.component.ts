import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-title-hero',
  template: `
    <section class="services-hero page-section">
      <p>{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
    </section>
  `
})
export class PageTitleHeroComponent {
  @Input({ required: true }) eyebrow = '';
  @Input({ required: true }) title = '';
}
