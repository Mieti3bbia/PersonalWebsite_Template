import { Component } from '@angular/core';

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
export class HomePage {}
