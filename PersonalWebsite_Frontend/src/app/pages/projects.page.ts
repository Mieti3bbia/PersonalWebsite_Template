import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

interface FashionProjectContent {
  title: string;
  fields: string[];
  videoUrl: string;
  description: string;
  pdfUrl: string;
  gallery: string[];
}

interface CostumeProjectContent {
  title: string;
  season: string;
  role: string;
  videoUrl: string;
  description: string;
  gallery: string[];
  credits: string;
}

interface TeachingCard {
  title: string;
  author: string;
  school: string;
  previewImage: string;
  pdfUrl: string;
}

interface TimelineItem {
  period: string;
  title: string;
  place: string;
  details: string[];
}

interface ServiceItem {
  eyebrow: string;
  title: string;
  summary: string;
  details: string[];
  workOnValue: string;
}

interface ClientItem {
  name: string;
  detail: string;
  className: string;
  logoUrl?: string;
}

const FALLBACK_COSTUME_PROJECTS: CostumeProjectContent[] = [
  {
    title: 'Costume Design',
    season: 'Performing arts and stagewear',
    role: 'Costume Designer & Costume Maker',
    videoUrl: '',
    description: 'Ricerca, prototipazione e costruzione sartoriale per corpi in movimento. Ogni costume viene pensato come un sistema scenico: identita visiva, resistenza, comfort, fitting e relazione con la performance.',
    gallery: ['/assets/home/landing-red-horizontal.jpg', '/assets/home/anteprima-imperfetto-divenire.png'],
    credits: 'Direzione creativa, moodboard, bozzetti, materiali, cartamodelli, fitting e confezione.'
  }
];

const FALLBACK_FASHION_PROJECTS: FashionProjectContent[] = [
  {
    title: 'Fashion Design',
    fields: ['collection design', 'product development', 'visual research'],
    videoUrl: '',
    description: 'Sviluppo di collezioni e capsule con una lettura editoriale del prodotto: concept, target, silhouette, materiali, schede tecniche e racconto visivo.',
    pdfUrl: '',
    gallery: ['/assets/home/anteprima-imperfetto-divenire.png', '/assets/home/landing-red-horizontal.jpg']
  }
];

const FALLBACK_TEACHINGS: TeachingCard[] = [
  {
    title: 'Pezzi di vetro',
    author: 'Teaching portfolio',
    school: 'Tutoraggio tesi e progetti accademici',
    previewImage: '/assets/teachings/pezzi-di-vetro-preview.png',
    pdfUrl: '/assets/teachings/pezzi-di-vetro.pdf'
  }
];

@Component({
  selector: 'app-projects-page',
  template: `
    <main class="studio-home">
      <section id="home-top" class="studio-hero" aria-label="Home">
        <div class="studio-hero-copy">
          <p class="studio-kicker">Fashion and costume designer</p>
          <h1><span>Maria</span><span>Sole</span><span>Montironi Lasca</span></h1>
          <p>
            Progettazione moda, costume design e tutoraggio. Un archivio essenziale di ricerca,
            materia, silhouette e progetti costruiti per il corpo, il prodotto e la scena.
          </p>
          <a
            class="studio-fill-button"
            href="/home#footer-contact"
          >
            <span>Book now</span>
          </a>
        </div>

        <figure class="studio-artwork" aria-label="Editorial artwork">
          <div class="studio-artwork-object studio-artwork-object-large">
            <img src="/assets/home/hero-costume-wireframe.png" alt="Wireframe costume designer studio with mannequins">
          </div>
        </figure>
      </section>

      <section id="clients" class="studio-clients" aria-label="Current and former clients">
        <div class="studio-client-grid">
          @for (client of clients; track client.name) {
            <article [attr.class]="'studio-client-logo studio-client-reveal ' + client.className">
              @if (client.logoUrl) {
                <img class="studio-client-logo-image" [src]="client.logoUrl" [alt]="client.name + ' logo'">
              } @else {
                <strong>{{ client.name }}</strong>
                @if (client.detail) {
                  <span>{{ client.detail }}</span>
                }
              }
            </article>
          }
        </div>
      </section>

      <section id="services" class="studio-section studio-services" aria-label="Services">
        <header class="studio-section-header">
          <p>Services</p>
          <h2>Dal concept alla realizzazione.</h2>
        </header>
        <div class="studio-service-grid">
          @for (service of services; track service.title) {
            <article class="studio-service-card">
              <span>{{ service.eyebrow }}</span>
              <h3>{{ service.title }}</h3>
              <p>{{ service.summary }}</p>
              <ul>
                @for (detail of service.details; track detail) {
                  <li>{{ detail }}</li>
                }
              </ul>
              <a
                class="studio-service-book-button studio-fill-button"
                [href]="contactHrefFor(service.workOnValue)"
                (click)="bookService($event, service.workOnValue)"
              >
                <span>Book now</span>
              </a>
            </article>
          }
        </div>
      </section>

      <section id="costume-design" class="studio-section studio-work-section" aria-label="Costume design">
        <header class="studio-section-header">
          <p>Costume Design</p>
          <h2>Costumi come sistemi scenici.</h2>
        </header>

        <div
          class="studio-costume-grid"
          [style.--costume-columns]="costumeDesktopColumnCount"
          [style.--costume-tablet-columns]="costumeTabletColumnCount"
        >
          @for (project of costumeProjects; track $index) {
            <article class="studio-costume-card">
              <div class="studio-costume-media-stack">
                <button type="button" class="studio-costume-main-media" (click)="openGalleryViewer(project.gallery, 0)">
                  @if (firstCostumeImage(project)) {
                    <img [src]="firstCostumeImage(project)" [alt]="project.title + ' preview'">
                  } @else {
                    <span>Image archive</span>
                  }
                </button>

                @if (costumePreviewImages(project).length > 1) {
                  <div class="studio-costume-thumb-row" aria-label="Gallery previews">
                    @for (image of costumePreviewImages(project); track image) {
                      <button type="button" (click)="openGalleryViewer(costumePreviewImages(project), $index)">
                        <img [src]="image" [alt]="project.title + ' gallery image ' + paddedIndex($index)">
                      </button>
                    }
                  </div>
                }
              </div>

              <div class="studio-costume-copy">
                <span>{{ paddedIndex($index) }}</span>
                <h3>{{ project.title }}</h3>
                <p>{{ project.description }}</p>
                <div class="studio-chip-row">
                  @if (project.season) {
                    <span>{{ project.season }}</span>
                  }
                  @if (project.role) {
                    <span>{{ project.role }}</span>
                  }
                </div>
                @if (project.videoUrl) {
                  <a class="studio-fill-button" [href]="project.videoUrl" target="_blank" rel="noopener"><span>See video</span></a>
                }
              </div>
            </article>
          }
        </div>
      </section>

      <section id="fashion-design" class="studio-section studio-work-section" aria-label="Fashion design">
        <header class="studio-section-header">
          <p>Fashion Design</p>
          <h2>Collezioni, prodotto, identita.</h2>
        </header>

        <div
          class="studio-fashion-grid"
          [style.--fashion-columns]="fashionDesktopColumnCount"
          [style.--fashion-tablet-columns]="fashionTabletColumnCount"
        >
          @for (project of fashionProjects; track $index) {
            <article class="studio-work-card">
              <div class="studio-fashion-media-stack">
                <button type="button" class="studio-work-media" (click)="openGalleryViewer(project.gallery, 0)">
                  @if (firstFashionImage(project)) {
                    <img [src]="firstFashionImage(project)" [alt]="project.title + ' preview'">
                  } @else {
                    <span>Visual board</span>
                  }
                </button>

                @if (fashionPreviewImages(project).length > 1) {
                  <div class="studio-fashion-thumb-row" aria-label="Gallery previews">
                    @for (image of fashionPreviewImages(project); track image) {
                      <button type="button" (click)="openGalleryViewer(fashionPreviewImages(project), $index)">
                        <img [src]="image" [alt]="project.title + ' gallery image ' + paddedIndex($index)">
                      </button>
                    }
                  </div>
                }
              </div>
              <div class="studio-work-copy">
                <span>{{ paddedIndex($index) }}</span>
                <h3>{{ project.title }}</h3>
                <p>{{ project.description }}</p>
                <div class="studio-chip-row">
                  @for (field of project.fields; track field) {
                    <span>{{ field }}</span>
                  }
                </div>
                @if (project.pdfUrl) {
                  <a class="studio-fill-button" [href]="project.pdfUrl" target="_blank" rel="noopener"><span>See PDF</span></a>
                }
              </div>
            </article>
          }
        </div>
      </section>

      <section id="teachings" class="studio-section studio-work-section" aria-label="Teachings">
        <header class="studio-section-header">
          <p>Teachings</p>
          <h2>Tesi, metodo e revisione progettuale.</h2>
        </header>

        <div
          class="studio-teaching-grid"
          [style.--teaching-columns]="teachingDesktopColumnCount"
          [style.--teaching-tablet-columns]="teachingTabletColumnCount"
        >
          @for (card of teachingCards; track $index) {
            <article class="studio-teaching-card">
              <button type="button" class="studio-work-media" (click)="openGalleryViewer([card.previewImage], 0)">
                @if (card.previewImage) {
                  <img [src]="card.previewImage" [alt]="card.title + ' preview'">
                } @else {
                  <span>Preview</span>
                }
              </button>
              <div class="studio-teaching-copy">
                <span>{{ paddedIndex($index) }}</span>
                <h3>{{ card.title || 'Untitled' }}</h3>
                <p>{{ card.author || 'Author not provided' }}</p>
                <p>{{ card.school || 'School not provided' }}</p>
                @if (card.pdfUrl) {
                  <a class="studio-fill-button" [href]="card.pdfUrl" target="_blank" rel="noopener"><span>See PDF</span></a>
                }
              </div>
            </article>
          }
        </div>
      </section>

      <section id="curriculumvitae" class="studio-section studio-cv" aria-label="Curriculum vitae">
        <header class="studio-section-header">
          <p>Curriculum</p>
          <h2>Esperienza, competenze, collaborazioni.</h2>
        </header>

        <div class="studio-cv-grid">
          <article class="studio-profile-panel">
            <h3>Profilo</h3>
            @for (paragraph of profile; track paragraph) {
              <p>{{ paragraph }}</p>
            }
          </article>

          <article>
            <h3>Hard skills</h3>
            <div class="studio-chip-row">
              @for (skill of hardSkills; track skill) {
                <span>{{ skill }}</span>
              }
            </div>
          </article>

          <article>
            <h3>Soft skills</h3>
            <div class="studio-chip-row">
              @for (skill of softSkills; track skill) {
                <span>{{ skill }}</span>
              }
            </div>
          </article>

          <article>
            <h3>Software</h3>
            <div class="studio-chip-row">
              @for (tool of software; track tool) {
                <span>{{ tool }}</span>
              }
            </div>
          </article>

          <article>
            <h3>Lingue</h3>
            <div class="studio-language-list">
              @for (language of languages; track language) {
                <p>{{ language }}</p>
              }
            </div>
          </article>

          <article>
            <h3>Collaborazioni</h3>
            <div class="studio-collab-list">
              @for (item of collaborations; track item.title) {
                <p><span>{{ item.period }}</span>{{ item.title }}</p>
              }
            </div>
          </article>
        </div>

        <div class="studio-cv-timelines">
          <section>
            <h3>Esperienze lavorative</h3>
            <div class="studio-timeline">
              @for (item of workTimeline; track item.title) {
                <article>
                  <span>{{ item.period }}</span>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.place }}</p>
                  @if (item.details.length > 0) {
                    <ul>
                      @for (detail of item.details; track detail) {
                        <li>{{ detail }}</li>
                      }
                    </ul>
                  }
                </article>
              }
            </div>
          </section>

          <section>
            <h3>Formazione scolastica</h3>
            <div class="studio-timeline studio-training-timeline">
              @for (item of trainingTimeline; track item.title) {
                <article>
                  <span>{{ item.period }}</span>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.place }}</p>
                  @if (item.details.length > 0) {
                    <ul>
                      @for (detail of item.details; track detail) {
                        <li>{{ detail }}</li>
                      }
                    </ul>
                  }
                </article>
              }
            </div>
          </section>
        </div>
      </section>

      <section id="aboutme" class="studio-section studio-about" aria-label="About me">
        <header class="studio-section-header">
          <p>About</p>
          <h2>Tra moda, costume e costruzione.</h2>
        </header>
        <div class="studio-about-grid">
          <div class="studio-about-art" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div>
            @for (paragraph of aboutParagraphs; track paragraph) {
              <p>{{ paragraph }}</p>
            }
          </div>
        </div>
      </section>

      @if (fullscreenGalleryItems.length > 0) {
        <section class="gallery-viewer" aria-modal="true" role="dialog" aria-label="Fullscreen gallery">
          <div class="gallery-viewer-toolbar">
            <span>{{ fullscreenGalleryIndex + 1 }} / {{ fullscreenGalleryItems.length }}</span>
            <button type="button" class="gallery-viewer-close" aria-label="Close fullscreen gallery" (click)="closeGalleryViewer()">Close</button>
          </div>
          @if (fullscreenGalleryItems.length > 1) {
            <button type="button" class="gallery-viewer-arrow gallery-viewer-prev" aria-label="Previous fullscreen image" (click)="showPreviousFullscreenImage()">&lt;</button>
          }
          <figure class="gallery-viewer-frame">
            <img [src]="currentFullscreenImage" alt="Fullscreen gallery image">
          </figure>
          @if (fullscreenGalleryItems.length > 1) {
            <button type="button" class="gallery-viewer-arrow gallery-viewer-next" aria-label="Next fullscreen image" (click)="showNextFullscreenImage()">&gt;</button>
          }
        </section>
      }
    </main>
  `
})
export class ProjectsPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private clientRevealObserver?: IntersectionObserver;

  protected costumeProjects: CostumeProjectContent[] = FALLBACK_COSTUME_PROJECTS;
  protected fashionProjects: FashionProjectContent[] = FALLBACK_FASHION_PROJECTS;
  protected teachingCards: TeachingCard[] = FALLBACK_TEACHINGS;
  protected fullscreenGalleryItems: string[] = [];
  protected fullscreenGalleryIndex = 0;

  protected readonly clients: ClientItem[] = [
    { name: 'PWC', detail: '', className: 'studio-client-pwc', logoUrl: '/assets/clients/pwc.svg' },
    { name: 'VivaRai', detail: '', className: 'studio-client-vivarai', logoUrl: '/assets/clients/vivarai2.svg' },
    { name: 'kataklo', detail: '', className: 'studio-client-kataklo', logoUrl: '/assets/clients/kataklo.svg' },
    { name: 'ariella vidach AiEP', detail: '', className: 'studio-client-aiep', logoUrl: '/assets/clients/ariella-vidach-aiep.svg' },
    { name: 'Rai', detail: '', className: 'studio-client-rai' }
  ];

  protected readonly services: ServiceItem[] = [
    {
      eyebrow: 'Costume',
      title: 'Costume Design per arti performative',
      summary: 'Ricerca, progettazione e realizzazione di costumi pensati per scena, corpo e movimento.',
      workOnValue: 'Costume Design',
      details: [
        'Analisi del concept, del linguaggio performativo e delle esigenze tecniche.',
        'Moodboard, palette, silhouette, materiali, prototipi e soluzioni sartoriali.',
        'Fitting, vestibilita, resistenza e funzionalita scenica.'
      ]
    },
    {
      eyebrow: 'Fashion',
      title: 'Fashion Design e sviluppo prodotto',
      summary: 'Collezioni, capsule e identita di prodotto per womenswear, menswear e brand emergenti.',
      workOnValue: 'Fashion Design',
      details: [
        'Ricerca di mercato, target, concept e direzione stilistica.',
        'Schede tecniche, materiali, fornitori, fitting e campionario.',
        'Traduzione di un immaginario in prodotto coerente e realizzabile.'
      ]
    },
    {
      eyebrow: 'Teaching',
      title: 'Tutoraggio accademico e corsi',
      summary: 'Supporto per tesi, portfolio, collezioni, sketchbook e presentazioni finali.',
      workOnValue: 'Teaching / tutoring',
      details: [
        'Revisioni per studenti IED, NABA, Marangoni, Politecnico e Ferrari Fashion School.',
        'Disegno tecnico, modellistica, cucito e progettazione moda.',
        'Metodo costruito su ascolto, revisione critica e strumenti concreti.'
      ]
    }
  ];

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

  protected readonly softSkills = [
    'Ascolto e revisione critica',
    'Direzione creativa',
    'Problem solving sartoriale',
    'Organizzazione del processo',
    'Autonomia progettuale',
    'Collaborazione con performer e studenti',
    'Adattabilita a set, scena e fitting',
    'Presentazione e storytelling'
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

  protected readonly languages = [
    'Italiano: madrelingua',
    'Inglese: livello B1'
  ];

  protected readonly collaborations = [
    { title: 'Myss Keta - Tour Live', period: 'Aprile - Maggio 2025' },
    { title: 'Big Mama x Sephora Pride Campaign', period: 'Giugno 2024' },
    { title: 'PWC - "Vanitatis" Runway', period: 'Aprile 2024' },
    { title: 'Lenoire - "Non Posso" Videoclip', period: 'Febbraio 2024' },
    { title: 'Editoriali moda internazionali', period: '2024 - 2026' }
  ];

  protected readonly workTimeline: TimelineItem[] = [
    {
      period: 'Marzo 2026 - in corso',
      title: 'Lead Costume Designer & Costume Maker',
      place: 'Ariella Vidach AIEP - Milano',
      details: [
        'Sviluppo concept costumi con la direzione artistica.',
        'Cartamodelli, prototipazione, fitting e confezione.',
        'Supervisione styling e make-up dei performer.'
      ]
    },
    {
      period: 'Gennaio 2025 - in corso',
      title: 'Tutor di tesi per studenti di Fashion Styling & Design',
      place: 'IED, NABA, Marangoni, Politecnico, Ferrari Fashion School',
      details: [
        'Concept di tesi, target, posizionamento e ricerca.',
        'Supporto su collezioni, sketchbook, disegno tecnico e prototipazione.',
        'Preparazione a esami, fitting, shooting e presentazione finale.'
      ]
    },
    {
      period: 'Marzo 2025 - Marzo 2026',
      title: 'Fashion Designer, Product Developer & Brand Developer',
      place: 'Freelance',
      details: [
        'Consulenze per streetwear maschile e lusso femminile.',
        'Analisi trend, identita stilistica e concept di collezione.',
        'Ricerca fornitori, materiali e sviluppo tech pack.'
      ]
    },
    {
      period: 'Febbraio 2025 - Febbraio 2026',
      title: 'Costume Designer & Costume Maker',
      place: 'Kataklo Athletic Dance Theatre - Milano',
      details: [
        'Concept visivo e soluzioni materiche per scena e movimento.',
        'Test tessili, manipolazioni, prototipazione e confezione.',
        'Fitting sui performer e supporto a shooting e allestimenti.'
      ]
    },
    {
      period: 'Aprile - Maggio 2024',
      title: 'Costume Designer - Viva Rai2!',
      place: 'RAI Italia',
      details: [
        'Costumi di scena per performance televisiva.',
        'Bozzetti e confezione sartoriale su misura.'
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
        'Accompagnamento nello sviluppo creativo e tecnico.',
        'Costruzione di collezioni, shooting, fashion film e presentazione finale.'
      ]
    }
  ];

  protected readonly aboutParagraphs = [
    'Sono una Fashion Designer, Costume Designer & Maker e Tutor, ma nessuna di queste definizioni, da sola, riesce davvero a raccontare chi sono.',
    'Il mio percorso e iniziato allo IED Istituto Europeo di Design di Milano, dove mi sono formata grazie a una borsa di studio ottenuta per merito.',
    'Da una parte la moda. Dall altra il costume. Due mondi che spesso vengono percepiti come opposti, ma che per me non hanno mai smesso di dialogare.',
    'La moda richiede attenzione al mercato, al target, alla riconoscibilita e alla costruzione di un identita. Il costume appartiene invece alle arti performative e al corpo in movimento.',
    'Credo che il design nasca dall incontro tra ricerca, tecnica e sensibilita.'
  ];

  async ngOnInit(): Promise<void> {
    await Promise.allSettled([
      this.loadCostumeProjects(),
      this.loadFashionProjects(),
      this.loadTeachingCards()
    ]);
  }

  ngAfterViewInit(): void {
    this.prepareClientReveal();
  }

  ngOnDestroy(): void {
    this.clientRevealObserver?.disconnect();
    document.documentElement.classList.remove('gallery-viewer-open');
  }

  protected paddedIndex(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  protected firstCostumeImage(project: CostumeProjectContent): string {
    return project.gallery.find((item) => this.isImageUrl(item)) ?? '';
  }

  protected costumePreviewImages(project: CostumeProjectContent): string[] {
    return project.gallery.filter((item) => this.isImageUrl(item)).slice(0, 4);
  }

  protected firstFashionImage(project: FashionProjectContent): string {
    return project.gallery.find((item) => this.isImageUrl(item)) ?? '';
  }

  protected fashionPreviewImages(project: FashionProjectContent): string[] {
    return project.gallery.filter((item) => this.isImageUrl(item)).slice(0, 4);
  }

  protected get currentFullscreenImage(): string {
    return this.fullscreenGalleryItems[this.fullscreenGalleryIndex] ?? '';
  }

  protected get costumeDesktopColumnCount(): number {
    return this.compactColumnCount(this.costumeProjects.length, [4, 3, 2]);
  }

  protected get costumeTabletColumnCount(): number {
    return this.costumeProjects.length === 1 ? 1 : 2;
  }

  protected get teachingDesktopColumnCount(): number {
    return this.compactColumnCount(this.teachingCards.length, [5, 4, 3]);
  }

  protected get teachingTabletColumnCount(): number {
    return this.teachingCards.length === 1 ? 1 : 2;
  }

  protected get fashionDesktopColumnCount(): number {
    return this.compactColumnCount(this.fashionProjects.length, [4, 3, 2]);
  }

  protected get fashionTabletColumnCount(): number {
    return this.fashionProjects.length === 1 ? 1 : 2;
  }

  private compactColumnCount(itemCount: number, candidates: number[]): number {
    const count = Math.max(1, itemCount);
    const availableColumns = candidates.filter((columnCount) => columnCount <= count);

    if (availableColumns.length === 0) {
      return 1;
    }

    const exactColumnCount = availableColumns.find((columnCount) => count % columnCount === 0);

    if (exactColumnCount) {
      return exactColumnCount;
    }

    return availableColumns
      .map((columnCount) => {
        const remainder = count % columnCount;
        const rows = Math.ceil(count / columnCount);
        const balancePenalty = remainder === 1 ? 10 : 0;

        return {
          columnCount,
          score: balancePenalty + rows
        };
      })
      .sort((first, second) => first.score - second.score || second.columnCount - first.columnCount)[0]
      .columnCount;
  }

  protected contactHrefFor(workOnValue: string): string {
    return `/home?workOn=${encodeURIComponent(workOnValue)}#footer-contact`;
  }

  protected bookService(event: MouseEvent, workOnValue: string): void {
    event.preventDefault();
    const href = this.contactHrefFor(workOnValue);

    window.dispatchEvent(new CustomEvent('footer-work-on', { detail: workOnValue }));
    window.history.pushState(null, '', href);
    document.getElementById('footer-contact')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  protected openGalleryViewer(items: string[], index: number): void {
    const imageItems = items.filter((item) => this.isImageUrl(item));

    if (imageItems.length === 0) {
      return;
    }

    this.fullscreenGalleryItems = imageItems;
    this.fullscreenGalleryIndex = Math.min(Math.max(index, 0), imageItems.length - 1);
    document.documentElement.classList.add('gallery-viewer-open');
  }

  protected closeGalleryViewer(): void {
    this.fullscreenGalleryItems = [];
    this.fullscreenGalleryIndex = 0;
    document.documentElement.classList.remove('gallery-viewer-open');
  }

  protected showPreviousFullscreenImage(): void {
    const galleryLength = this.fullscreenGalleryItems.length;

    if (galleryLength < 2) {
      return;
    }

    this.fullscreenGalleryIndex = (this.fullscreenGalleryIndex + galleryLength - 1) % galleryLength;
  }

  protected showNextFullscreenImage(): void {
    const galleryLength = this.fullscreenGalleryItems.length;

    if (galleryLength < 2) {
      return;
    }

    this.fullscreenGalleryIndex = (this.fullscreenGalleryIndex + 1) % galleryLength;
  }

  private async loadCostumeProjects(): Promise<void> {
    this.costumeProjects = await this.fetchWithFallback(
      ['/api/costume-designs', 'http://localhost:5109/api/costume-designs'],
      (response) => this.normalizeCostumeProjects(response),
      FALLBACK_COSTUME_PROJECTS
    );
    this.changeDetectorRef.detectChanges();
  }

  private async loadFashionProjects(): Promise<void> {
    this.fashionProjects = await this.fetchWithFallback(
      ['/api/fashion-designs', 'http://localhost:5109/api/fashion-designs'],
      (response) => this.normalizeFashionProjects(response),
      FALLBACK_FASHION_PROJECTS
    );
    this.changeDetectorRef.detectChanges();
  }

  private async loadTeachingCards(): Promise<void> {
    this.teachingCards = await this.fetchWithFallback(
      ['/api/teachings', 'http://localhost:5109/api/teachings'],
      (response) => this.normalizeTeachingCards(response),
      FALLBACK_TEACHINGS
    );
    this.changeDetectorRef.detectChanges();
  }

  private prepareClientReveal(): void {
    const root = this.elementRef.nativeElement as HTMLElement;
    const revealItems = Array.from(root.querySelectorAll('.studio-client-reveal')).filter(
      (item): item is HTMLElement => item instanceof HTMLElement
    );

    revealItems.forEach((item, index) => {
      item.style.setProperty('--client-reveal-delay', `${Math.min(index * 70, 560)}ms`);
    });

    if (!('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    this.clientRevealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add('is-visible');
          this.clientRevealObserver?.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px 10% 0px', threshold: 0.06 }
    );

    revealItems.forEach((item) => this.clientRevealObserver?.observe(item));
  }

  private async fetchWithFallback<T>(urls: string[], normalize: (response: unknown) => T[], fallback: T[]): Promise<T[]> {
    for (const url of urls) {
      try {
        const response = await this.fetchJson(url);
        const items = normalize(response);

        if (items.length > 0) {
          return items;
        }
      } catch {
        continue;
      }
    }

    return fallback;
  }

  private async fetchJson(url: string): Promise<unknown> {
    const abortController = new AbortController();
    const timeout = window.setTimeout(() => abortController.abort(), 5000);

    try {
      const response = await fetch(url, { signal: abortController.signal });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      return await response.json();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  private normalizeTeachingCards(response: unknown): TeachingCard[] {
    return this.readRecordArray(this.parseResponse(response))
      .map((card) => ({
        title: this.readField(card, ['title', 'Title', 'name', 'Name']),
        author: this.readField(card, ['author', 'Author']),
        school: this.readField(card, ['school', 'School']),
        previewImage: this.normalizeTeachingAssetUrl(this.readField(card, ['previewImage', 'PreviewImage', 'previewImageUrl', 'PreviewImageUrl', 'preview_image', 'image', 'Image'])),
        pdfUrl: this.normalizeAssetUrl(this.readField(card, ['pdfUrl', 'PdfUrl', 'PDFUrl', 'pdfURL', 'PdfURL', 'pdf', 'Pdf']))
      }))
      .filter((card) => card.title || card.author || card.school || card.previewImage || card.pdfUrl);
  }

  private normalizeFashionProjects(response: unknown): FashionProjectContent[] {
    return this.readRecordArray(this.parseResponse(response))
      .map((record) => ({
        title: this.readField(record, ['title', 'Title', 'name', 'Name']) || 'Fashion Design',
        fields: this.readStringArray(record, ['fields', 'Fields', 'categories', 'Categories', 'tags', 'Tags']),
        videoUrl: this.normalizeAssetUrl(this.readField(record, ['explainingVideo', 'ExplainingVideo', 'video', 'Video', 'videoUrl', 'VideoUrl', 'videoURL', 'VideoURL'])),
        description: this.readField(record, ['description', 'Description', 'body', 'Body', 'text', 'Text']),
        pdfUrl: this.normalizeAssetUrl(this.readField(record, ['pdf', 'Pdf', 'pdfUrl', 'PdfUrl', 'PDFUrl', 'pdfURL', 'PdfURL'])),
        gallery: this.readStringArray(record, ['gallery', 'Gallery', 'images', 'Images', 'imageUrls', 'ImageUrls']).map((url) => this.normalizeAssetUrl(url))
      }))
      .filter((project) => project.title || project.videoUrl || project.description || project.pdfUrl || project.gallery.length > 0);
  }

  private normalizeCostumeProjects(response: unknown): CostumeProjectContent[] {
    return this.readRecordArray(this.parseResponse(response))
      .map((record) => ({
        title: this.readField(record, ['title', 'Title', 'name', 'Name']) || 'Costume Design',
        season: this.readField(record, ['season', 'Season']),
        role: this.readField(record, ['role', 'Role']),
        videoUrl: this.normalizeAssetUrl(this.readField(record, ['video', 'Video', 'videoUrl', 'VideoUrl', 'videoURL', 'VideoURL'])),
        description: this.readField(record, ['description', 'Description', 'body', 'Body', 'text', 'Text']),
        gallery: this.readStringArray(record, ['gallery', 'Gallery', 'images', 'Images', 'imageUrls', 'ImageUrls']).map((url) => this.normalizeAssetUrl(url)),
        credits: this.readField(record, ['credits', 'Credits'])
      }))
      .filter((project) => project.title || project.season || project.role || project.videoUrl || project.description || project.gallery.length > 0 || project.credits);
  }

  private parseResponse(response: unknown): unknown {
    if (typeof response !== 'string') {
      return response;
    }

    try {
      return JSON.parse(response);
    } catch {
      return response;
    }
  }

  private readRecordArray(response: unknown): Record<string, unknown>[] {
    if (Array.isArray(response)) {
      return response.filter(this.isRecord);
    }

    if (!this.isRecord(response)) {
      return [];
    }

    const values =
      response['value'] ??
      response['Value'] ??
      response['$values'] ??
      response['data'] ??
      response['Data'] ??
      response['items'] ??
      response['Items'] ??
      response['results'] ??
      response['Results'];

    if (Array.isArray(values)) {
      return values.filter(this.isRecord);
    }

    return [response];
  }

  private readField(record: Record<string, unknown>, aliases: string[]): string {
    const value = aliases.map((key) => record[key]).find((item) => item !== undefined);

    return String(value ?? '').trim();
  }

  private readStringArray(record: Record<string, unknown>, aliases: string[]): string[] {
    const value = aliases.map((key) => record[key]).find((item) => item !== undefined);

    if (Array.isArray(value)) {
      return value.map((item) => String(item ?? '').trim()).filter(Boolean);
    }

    if (this.isRecord(value)) {
      const values = value['$values'] ?? value['items'] ?? value['Items'];

      if (Array.isArray(values)) {
        return values.map((item) => String(item ?? '').trim()).filter(Boolean);
      }
    }

    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }

    return [];
  }

  private normalizeTeachingAssetUrl(url: string): string {
    if (url.endsWith('/uploads/teachings/pezzi-di-vetro-preview.png')) {
      return '/assets/teachings/pezzi-di-vetro-preview.png';
    }

    return this.normalizeAssetUrl(url);
  }

  private normalizeAssetUrl(url: string): string {
    if (!url || url.startsWith('http') || url.startsWith('/')) {
      return url;
    }

    return `/${url.replace(/^\/+/, '')}`;
  }

  private isImageUrl(url: string): boolean {
    return /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(url);
  }

  private readonly isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null
  );
}
