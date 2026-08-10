import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageTitleHeroComponent } from '../components/page-title-hero.component';

interface ServiceItem {
  eyebrow: string;
  title: string;
  summary: string;
  details: string[];
  image: string;
  imageAlt: string;
  portfolioRoute: string;
}

@Component({
  selector: 'app-services-page',
  imports: [RouterLink, PageTitleHeroComponent],
  template: `
    <main class="services-page">
      <app-page-title-hero eyebrow="/ servizi /" title="servizi" />

      <section class="services-list page-section">
        @for (service of services; track service.title) {
          <article class="service-card">
            <div class="service-card-copy">
              <p class="service-eyebrow">{{ service.eyebrow }}</p>
              <h2>{{ service.title }}</h2>
              <p class="service-summary">{{ service.summary }}</p>

              <div class="service-actions" aria-label="Service actions">
                <a routerLink="/contact">Book now</a>
                <a [routerLink]="service.portfolioRoute">Show more</a>
              </div>
            </div>

            <figure class="service-media">
              <img [src]="service.image" [alt]="service.imageAlt">
            </figure>

            <div class="service-details">
              @for (detail of service.details; track detail) {
                <p>{{ detail }}</p>
              }
            </div>
          </article>
        }
      </section>
    </main>
  `
})
export class ServicesPage {
  protected readonly services: ServiceItem[] = [
    {
      eyebrow: 'Consulenza',
      title: 'Costume Design per arti performative',
      summary: 'Supporto nella ricerca, progettazione e realizzazione di costumi pensati per scena, corpo e movimento.',
      details: [
        'Analisi del concept, del linguaggio performativo e delle esigenze tecniche di danzatori, performer o produzione.',
        'Sviluppo di moodboard, palette, silhouette, materiali, prototipi e soluzioni sartoriali coerenti con la drammaturgia.',
        'Accompagnamento dalla fase di idea alla realizzazione, con attenzione alla vestibilita, alla resistenza e alla funzionalita scenica.'
      ],
      image: '/assets/home/landing-red-horizontal.jpg',
      imageAlt: 'Costume design visual research',
      portfolioRoute: '/portfolio/costume-design'
    },
    {
      eyebrow: 'Consulenza',
      title: 'Fashion Design e sviluppo prodotto',
      summary: 'Consulenza per collezioni, capsule e identita di prodotto nel campo womenswear, menswear e brand emergenti.',
      details: [
        'Ricerca di mercato, analisi del target, definizione del concept e costruzione di una direzione stilistica riconoscibile.',
        'Supporto nello sviluppo di collezione, schede tecniche, materiali, fornitori, fitting e campionario.',
        'Percorso pensato per trasformare un immaginario in un prodotto leggibile, coerente e realizzabile.'
      ],
      image: '/assets/home/anteprima-imperfetto-divenire.png',
      imageAlt: 'Fashion design project preview',
      portfolioRoute: '/portfolio/fashion-design'
    },
    {
      eyebrow: 'Tutoraggio',
      title: 'Tutoraggio accademico e corsi',
      summary: 'Supporto per studenti e percorsi formativi in fashion design, costume design, disegno tecnico, modellistica e cucito.',
      details: [
        'Lezioni conoscitive e tutoraggio per tesi, portfolio, collezioni, sketchbook, presentazioni finali e sviluppo progettuale.',
        'Corsi individuali o mirati su disegno tecnico, modellistica, cucito e progettazione di moda.',
        'Metodo costruito su ascolto, revisione critica e strumenti concreti per rendere il progetto piu chiaro, personale e realizzabile.'
      ],
      image: '/assets/teachings/pezzi-di-vetro-preview.png',
      imageAlt: 'Teaching project preview',
      portfolioRoute: '/portfolio/teachings'
    }
  ];
}
