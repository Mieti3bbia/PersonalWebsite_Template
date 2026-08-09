import { AfterViewInit, Component, ElementRef, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GoBackLinkComponent } from '../components/go-back-link.component';

interface TimelineItem {
  period: string;
  title: string;
  place: string;
  details: string[];
}

@Component({
  selector: 'app-curriculum-vitae-page',
  imports: [RouterLink, GoBackLinkComponent],
  template: `
    <main class="detail-page curriculum-vitae-page">
      <section class="cv-hero page-section">
        <p class="eyebrow">/ Curriculum vitae /</p>
        <h1 class="slide-in">
          <span>Maria Sole</span>
          <span>Montironi Lasca</span>
        </h1>
        <div class="cv-contact">
          <span>Milano</span>
          <a href="mailto:mariasole.freelancer@gmail.com">mariasole.freelancer@gmail.com</a>
          <a href="tel:+393312827693">+39 3312827693</a>
          <span>25/09/2001</span>
        </div>
      </section>

      <section class="cv-profile page-section">
        <h2>Profilo</h2>
        <div>
          @for (paragraph of profile; track paragraph) {
            <p>{{ paragraph }}</p>
          }
        </div>
      </section>

      <section class="cv-skills page-section">
        <article>
          <h2>Hard skills</h2>
          <div class="cv-chip-grid">
            @for (skill of hardSkills; track skill) {
              <span>{{ skill }}</span>
            }
          </div>
        </article>

        <article>
          <h2>Software</h2>
          <div class="cv-chip-grid">
            @for (tool of software; track tool) {
              <span>{{ tool }}</span>
            }
          </div>
        </article>

        <article>
          <h2>Lingue</h2>
          <div class="cv-language-list">
            <p>Italiano: madrelingua</p>
            <p>Inglese: livello B1</p>
          </div>
        </article>
      </section>

      <section class="cv-featured page-section">
        <h2>Collaborazioni di rilievo</h2>
        <div class="cv-featured-grid">
          @for (item of collaborations; track item.title) {
            <article>
              <span>{{ item.period }}</span>
              <h3>{{ item.title }}</h3>
              @if (item.note) {
                <p>{{ item.note }}</p>
              }
            </article>
          }
        </div>
      </section>

      <section class="cv-timeline-section page-section">
        <header>
          <p class="eyebrow">/ Work /</p>
          <h2>Esperienze lavorative</h2>
        </header>

        <div class="cv-timeline">
          @for (item of workTimeline; track item.title) {
            <article class="cv-timeline-item">
              <div class="cv-timeline-marker"></div>
              <div class="cv-timeline-date">{{ item.period }}</div>
              <div class="cv-timeline-card">
                <h3>{{ item.title }}</h3>
                <p>{{ item.place }}</p>
                <ul>
                  @for (detail of item.details; track detail) {
                    <li>{{ detail }}</li>
                  }
                </ul>
              </div>
            </article>
          }
        </div>
      </section>

      <section class="cv-timeline-section cv-training-section page-section">
        <header>
          <p class="eyebrow">/ Formazione /</p>
          <h2>Formazione e tutoraggio</h2>
        </header>

        <div class="cv-timeline">
          @for (item of trainingTimeline; track item.title) {
            <article class="cv-timeline-item">
              <div class="cv-timeline-marker"></div>
              <div class="cv-timeline-date">{{ item.period }}</div>
              <div class="cv-timeline-card">
                <h3>{{ item.title }}</h3>
                <p>{{ item.place }}</p>
                <ul>
                  @for (detail of item.details; track detail) {
                    <li>{{ detail }}</li>
                  }
                </ul>
              </div>
            </article>
          }
        </div>
      </section>

      <app-go-back-link routerLink="/home" variantClass="curriculum-vitae-back-link" />
    </main>
  `
})
export class CurriculumVitaePage implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private observer: IntersectionObserver | null = null;

  protected readonly profile = [
    'Fashion & Costume Designer, Product Developer e Tutor con oltre due anni di esperienza nella progettazione e nello sviluppo di collezioni per il settore delle arti performative e della moda.',
    'Laureata in Fashion Design presso lo IED di Milano, con specializzazione in womenswear, menswear, product development e costume design.',
    'Accompagno ogni progetto dall analisi iniziale fino alla realizzazione finale, integrando ricerca creativa, sviluppo concettuale, modellistica, prototipazione e confezione.',
    'Collaboro con realta come RAI Italia, Ariella Vidach AIEP e Kataklo Athletic Dance Theatre, oltre a contribuire allo sviluppo creativo e tecnico di brand emergenti.',
    'Parallelamente svolgo attivita di tutoraggio per studenti di IED, NABA, Marangoni, Politecnico di Milano e Ferrari Fashion School.'
  ];

  protected readonly hardSkills = [
    'AI-assisted Design',
    'Collection Design & Development',
    'Womenswear',
    'Menswear',
    'Kidswear',
    'Knitwear',
    'Accessori',
    'Costume Design',
    'Product Development',
    'Trend Research',
    'Concept Development',
    'Moodboard & Visual Storytelling',
    'Material & Fabric Research',
    'Textile Manipulations',
    'Technical Drawing',
    'Technical Sheets',
    'Pattern Making',
    'Fit Adjustments',
    'Prototyping',
    'Sample Fittings',
    'Garment Construction'
  ];

  protected readonly software = [
    'Adobe Photoshop',
    'Adobe Illustrator',
    'Adobe InDesign',
    'CLO 3D',
    'Procreate',
    'Microsoft Office',
    'Windows',
    'macOS'
  ];

  protected readonly collaborations = [
    { title: 'Myss Keta - Tour Live', period: 'Aprile - Maggio 2025', note: '' },
    { title: 'Big Mama x Sephora Pride Campaign', period: 'Giugno 2024', note: '' },
    { title: 'PWC - "Vanitatis" Runway', period: 'Aprile 2024', note: 'Selezionata tra i 40 migliori designer emergenti da PWC.' },
    { title: 'Lenoire - "Non Posso" Videoclip', period: 'Febbraio 2024', note: '' },
    { title: 'Editoriali moda internazionali', period: '2024 - 2026', note: 'Moevir Magazine, Nasty Magazine, PAP Magazine, DRY Magazine.' }
  ];

  protected readonly workTimeline: TimelineItem[] = [
    {
      period: 'Marzo 2026 - in corso',
      title: 'Lead Costume Designer & Costume Maker',
      place: 'Ariella Vidach AIEP - Milano',
      details: [
        'Sviluppo del concept creativo dei costumi con la direzione artistica.',
        'Analisi di drammaturgia, coreografie e sound design.',
        'Progettazione tecnica tramite cartamodelli, prototipazione, sdifettamento e confezione.',
        'Supervisione di styling e make-up dei performer.'
      ]
    },
    {
      period: 'Gennaio 2025 - in corso',
      title: 'Tutor di tesi per studenti di Fashion Styling & Design',
      place: 'IED, NABA, Marangoni, Politecnico, Ferrari Fashion School',
      details: [
        'Definizione del concept di tesi, target e posizionamento del brand.',
        'Creazione di moodboard evocativi, storytelling visivo e ricerca.',
        'Supporto in silhouette, sketchbook, collezioni, disegno tecnico e prototipazione.',
        'Preparazione a esami, fitting, shooting, styling e discussione finale.'
      ]
    },
    {
      period: 'Marzo 2025 - Marzo 2026',
      title: 'Fashion Designer, Product Developer & Brand Developer',
      place: 'Freelance',
      details: [
        'Consulenze per streetwear maschile e lusso femminile.',
        'Analisi del mercato italiano e dei trend.',
        'Supporto all identita stilistica e al concept di collezione.',
        'Ricerca fornitori, tessuti, materiali e canali produttivi.',
        'Sviluppo di capsule e tech pack per il campionario.'
      ]
    },
    {
      period: 'Febbraio 2025 - Febbraio 2026',
      title: 'Costume Designer & Costume Maker',
      place: 'Kataklo Athletic Dance Theatre - Milano',
      details: [
        'Sviluppo del concept visivo e delle soluzioni materiche.',
        'Test tessili e manipolazioni sperimentali.',
        'Prototipazione e confezione sartoriale dei costumi.',
        'Fitting sui performer e supporto durante shooting e allestimenti.'
      ]
    },
    {
      period: 'Aprile - Maggio 2024',
      title: 'Costume Designer - Viva Rai2!',
      place: 'RAI Italia',
      details: [
        'Concept visivo dei costumi di scena per il corpo di ballo dei Coma Cose.',
        'Bozzetti e confezione sartoriale su misura.',
        'Costumi funzionali alla performance televisiva, con comfort e liberta di movimento.'
      ]
    },
    {
      period: 'Gennaio - Febbraio 2024',
      title: 'Costume Designer - Dopo Festival di Sanremo',
      place: 'RAI Italia, Rai 1',
      details: [
        'Costumi di scena per il corpo di ballo di Ghali.',
        'Integrazione di capi dalla collezione di tesi con costumi sviluppati ad hoc.',
        'Gestione del processo sartoriale, dai materiali alla confezione finale.'
      ]
    }
  ];

  protected readonly trainingTimeline: TimelineItem[] = [
    {
      period: 'Formazione accademica',
      title: 'Fashion Design',
      place: 'IED Milano',
      details: [
        'Specializzazione in womenswear, menswear, product development e costume design.',
        'Percorso orientato a ricerca, concept, modellistica, prototipazione e confezione.'
      ]
    },
    {
      period: 'Metodo progettuale',
      title: 'Ricerca, tecnica e fattibilita',
      place: 'Fashion & Costume Design',
      details: [
        'Traduzione della ricerca in prodotti e costumi realizzabili.',
        'Integrazione di visione estetica, competenze tecniche e identita progettuale.'
      ]
    },
    {
      period: 'Tutoraggio continuativo',
      title: 'Supporto a tesi e collezioni',
      place: 'IED, NABA, Marangoni, Politecnico, Ferrari Fashion School',
      details: [
        'Accompagnamento degli studenti nello sviluppo creativo e tecnico.',
        'Costruzione di collezioni, shooting, fashion film e presentazione finale.'
      ]
    }
  ];

  ngAfterViewInit(): void {
    const elements = Array.from(
      this.elementRef.nativeElement.querySelectorAll('.cv-profile, .cv-skills article, .cv-featured-grid article, .cv-timeline-item')
    ) as Element[];

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );

    elements.forEach((element) => this.observer?.observe(element));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
