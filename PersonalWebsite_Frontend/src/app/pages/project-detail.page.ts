import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AfterViewInit, ChangeDetectorRef, ElementRef, OnDestroy, OnInit } from '@angular/core';

interface PortfolioProject {
  title: string;
  kicker: string;
  description: string;
  body: string;
  image: string;
  secondaryImage: string;
}

interface TeachingCard {
  title: string;
  author: string;
  school: string;
  previewImage: string;
  pdfUrl: string;
}

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

const FASHION_PROJECT: FashionProjectContent = {
  title: 'Fashion Design',
  fields: [],
  videoUrl: '',
  description: '',
  pdfUrl: '',
  gallery: []
};

const COSTUME_PROJECT: CostumeProjectContent = {
  title: 'Costume project title',
  season: 'Season',
  role: 'Assistente Costume Designer & Costume Maker',
  videoUrl: '',
  description: 'Aliquam at tristique mi. Nunc vel una ligula scelerisque dignissim. Aenean pulvinar, neque eget facilisis convallis, orci eros tincidunt arcu, vel pulvinar quam erat sed lectus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse potenti. Curabitur non dolor vitae quam dictum fermentum. Integer vitae augue non justo viverra blandit. Donec consequat, erat non consequat mattis, dui massa luctus magna, sed tempor elit mauris vitae neque.',
  gallery: ['Gallery 1', 'Gallery 2', 'Gallery 3'],
  credits: 'Credit\nDirezione Artistica: Giulia Staccioli\nAssistente alla scenografia: Sara Salustri\n\nCostumi\nFabio Passerini\n\nMake-up\nGianni Bertini\n\nPerformers\nMarco Battista\nCarolina Cruciani\nElisa Iacone\nFederica Roveda\nAnita Gallo\nCristian Longhi'
};

const PROJECTS: Record<string, PortfolioProject> = {
  'costume-design': {
    title: 'Costume Design',
    kicker: '/ Fashion research /',
    description: 'A focused project built around visual research, garment language and editorial direction.',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vel turpis ac arcu facilisis gravida. Suspendisse potenti. Curabitur at lorem sed nibh luctus consequat vitae sed erat.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=85',
    secondaryImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85'
  },
  'fashion-design': {
    title: 'Fashion Design',
    kicker: '/ Graphic identity /',
    description: 'A visual system exploring typography, image hierarchy and contemporary brand identity.',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent non lectus sed arcu tempor efficitur. Donec et nisl vel nibh fermentum cursus in in justo.',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85'
  },
  teachings: {
    title: 'Teachings',
    kicker: '/ Digital fashion /',
    description: 'A digital fashion direction project connecting material references, motion and image-based storytelling.',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vel justo at augue posuere cursus. Sed vitae lacus sed neque viverra aliquet at id est.',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85'
  }
};

@Component({
  selector: 'app-project-detail-page',
  imports: [RouterLink],
  template: `
    <main class="detail-page project-detail-page">
      @if (isTeachings) {
        <section class="teachings-page page-section">
          <header class="teachings-header">
            <h1 class="slide-in">teachings</h1>
          </header>

          @if (teachingCards.length > 0) {
            <div class="teachings-card-list">
              @for (card of teachingCards; track $index) {
                <article class="teaching-card">
                  <div class="teaching-card-body">
                    <div class="teaching-card-copy">
                      <p>"{{ card.title || 'Untitled' }}"</p>
                      <p>{{ card.author || 'Author not provided' }}</p>
                      <p>{{ card.school || 'School not provided' }}</p>
                    </div>

                    <a
                      class="teaching-preview"
                      [href]="card.pdfUrl || '#'"
                      [attr.target]="card.pdfUrl ? '_blank' : null"
                      rel="noopener"
                        [attr.aria-label]="card.pdfUrl ? 'Open ' + (card.title || 'teaching') + ' PDF' : 'Teaching preview placeholder'"
                    >
                      @if (card.previewImage) {
                        <img
                          [src]="card.previewImage"
                          [alt]="card.title + ' preview'"
                          (error)="card.previewImage = ''"
                        >
                      } @else {
                        <span>anteprima</span>
                      }
                    </a>
                  </div>
                </article>
              }
            </div>
          } @else if (teachingsLoaded) {
            <p class="teachings-empty">No teachings available.</p>
          } @else {
            <p class="teachings-empty">Loading teachings...</p>
          }

          <a class="back-link teachings-back-link" routerLink="/portfolio">/ Go back /</a>
        </section>
      } @else if (isFashionDesign) {
        <section class="fashion-page page-section">
          <article class="fashion-shell">
            @for (entry of fashionProjects; track $index) {
              <section class="fashion-entry">
                <section class="fashion-entry-title-band">
                  <h2>{{ entry.title }}</h2>
                </section>

                @if (entry.videoUrl) {
                  <section class="fashion-band">
                    <video class="fashion-video" [src]="entry.videoUrl" controls playsinline></video>
                  </section>
                }

                @if (entry.description) {
                  <section class="fashion-band">
                    <p class="fashion-description">{{ entry.description }}</p>
                  </section>
                }

                @if (entry.gallery.length > 0 || entry.pdfUrl) {
                  <section class="fashion-band">
                    <div class="fashion-gallery-shell">
                      @if (entry.gallery.length > 0) {
                        <div class="fashion-gallery-row" aria-label="Fashion gallery">
                          <button type="button" aria-label="Previous gallery item" (click)="showPreviousFashionImage()">→</button>
                          <img class="fashion-gallery-panel" [src]="currentFashionImageFor(entry)" alt="Fashion design gallery image">
                          <button type="button" aria-label="Next gallery item" (click)="showNextFashionImage()">→</button>
                        </div>
                      }

                      @if (entry.pdfUrl) {
                        <a class="fashion-pdf-panel" [href]="entry.pdfUrl" target="_blank" rel="noopener" aria-label="Open fashion project PDF">
                          pdf
                        </a>
                      }
                    </div>
                  </section>
                }
              </section>
            } @empty {
              @if (fashionLoaded) {
              <section class="fashion-band">
                <p class="fashion-description">No fashion designs available.</p>
              </section>
              } @else {
              <section class="fashion-band">
                <p class="fashion-description">Loading fashion designs...</p>
              </section>
              }
            }
          </article>

          <a class="back-link fashion-back-link" routerLink="/portfolio">/ Go back /</a>
        </section>
      } @else if (isCostumeDesign) {
        <section class="costume-page page-section">
          <div class="costume-shell">
            @for (entry of costumeProjects; track $index) {
              <article class="costume-entry">
                <header class="costume-title-band">
                  <h1>{{ entry.title }}</h1>
                </header>

                <section class="costume-meta">
                  @if (entry.season) {
                    <p>{{ entry.season }}</p>
                  }
                  @if (entry.role) {
                    <p>{{ entry.role }}</p>
                  }
                </section>

                @if (entry.videoUrl) {
                  <section class="costume-video-band">
                    <video class="fashion-video" [src]="entry.videoUrl" controls playsinline></video>
                  </section>
                }

                @if (entry.gallery.length > 0) {
                  <section class="costume-gallery-band">
                    <div class="fashion-gallery-row" aria-label="Costume gallery">
                      <button type="button" aria-label="Previous gallery item" (click)="showPreviousCostumeImage()">→</button>
                      @if (currentCostumeGalleryItemFor(entry).isImage) {
                        <img class="fashion-gallery-panel" [src]="currentCostumeGalleryItemFor(entry).value" alt="Costume gallery image">
                      } @else {
                        <div class="fashion-gallery-panel costume-gallery-placeholder">{{ currentCostumeGalleryItemFor(entry).value }}</div>
                      }
                      <button type="button" aria-label="Next gallery item" (click)="showNextCostumeImage()">→</button>
                    </div>
                  </section>
                }

                @if (entry.description) {
                  <section class="costume-description">
                    <p>{{ entry.description }}</p>
                  </section>
                }

                @if (entry.credits) {
                  <section class="costume-credits">
                    <p>{{ entry.credits }}</p>
                  </section>
                }
              </article>
            } @empty {
              @if (costumeLoaded) {
                <section class="costume-description">
                  <p>No costume design entries available.</p>
                </section>
              } @else {
                <section class="costume-description">
                  <p>Loading costume design entries...</p>
                </section>
              }
            }
          </div>

          <a class="back-link costume-back-link" routerLink="/portfolio">/ Go back /</a>
        </section>
      } @else {
        <section class="project-detail-layout page-section">
          <div class="project-detail-copy">
            <a class="back-link" routerLink="/portfolio">/ Back to portfolio /</a>
            <p class="eyebrow">{{ project.kicker }}</p>
            <h1 class="slide-in">{{ project.title }}</h1>
            <p class="project-description">{{ project.description }}</p>
          </div>
          <img [src]="project.image" [alt]="project.title">
        </section>

        <section class="project-rich-layout page-section">
          <div>
            <p>{{ project.body }}</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi viverra, sem id mattis porttitor, arcu quam iaculis ipsum, et dignissim massa tortor id dolor.</p>
          </div>
          <img [src]="project.secondaryImage" [alt]="project.title + ' detail'">
        </section>
      }
    </main>
  `
})
export class ProjectDetailPage implements AfterViewInit, OnDestroy, OnInit {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly route = inject(ActivatedRoute);
  private readonly slug = this.route.snapshot.paramMap.get('slug') ?? 'costume-design';
  protected readonly project = PROJECTS[this.slug] ?? PROJECTS['costume-design'];
  protected readonly isTeachings = this.slug === 'teachings';
  protected readonly isFashionDesign = this.slug === 'fashion-design';
  protected readonly isCostumeDesign = this.slug === 'costume-design';
  protected costumeProjects: CostumeProjectContent[] = [COSTUME_PROJECT];
  protected costumeLoaded = false;
  protected costumeGalleryIndex = 0;
  protected fashionProject = FASHION_PROJECT;
  protected fashionProjects: FashionProjectContent[] = [];
  protected fashionLoaded = false;
  protected fashionGalleryIndex = 0;
  protected teachingCards: TeachingCard[] = [];
  protected teachingsLoaded = false;
  private fadeElements: HTMLElement[] = [];
  private animationFrame = 0;

  private readonly updateVisibility = (): void => {
    cancelAnimationFrame(this.animationFrame);

    this.animationFrame = requestAnimationFrame(() => {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      this.fadeElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < viewportHeight * 0.9 && rect.bottom > viewportHeight * 0.08;
        element.classList.toggle('is-visible', isVisible);
      });
    });
  };

  async ngOnInit(): Promise<void> {
    if (this.isFashionDesign) {
      await this.loadFashionProject();
      return;
    }

    if (this.isCostumeDesign) {
      await this.loadCostumeProjects();
      return;
    }

    if (!this.isTeachings) {
      return;
    }

    try {
      this.teachingCards = await this.fetchTeachingCards('/api/teachings');
    } catch (proxyError) {
      try {
        this.teachingCards = await this.fetchTeachingCards('http://localhost:5109/api/teachings');
      } catch (backendError) {
        this.teachingCards = [];
        console.warn('Unable to load teachings from server.', { proxyError, backendError });
      }
    } finally {
      this.teachingsLoaded = true;
      this.changeDetectorRef.detectChanges();
    }
  }

  ngAfterViewInit(): void {
    this.refreshFadeElements();

    window.addEventListener('scroll', this.updateVisibility, { passive: true });
    window.addEventListener('resize', this.updateVisibility, { passive: true });

    this.updateVisibility();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.updateVisibility);
    window.removeEventListener('resize', this.updateVisibility);
    cancelAnimationFrame(this.animationFrame);
  }

  protected get currentFashionImage(): string {
    return this.fashionProject.gallery[this.fashionGalleryIndex] ?? '';
  }

  protected currentFashionImageFor(entry: FashionProjectContent): string {
    const galleryLength = entry.gallery.length;

    if (galleryLength === 0) {
      return '';
    }

    return entry.gallery[this.fashionGalleryIndex % galleryLength] ?? '';
  }

  protected get hasFashionContent(): boolean {
    return Boolean(
      this.fashionProject.videoUrl ||
      this.fashionProject.description ||
      this.fashionProject.pdfUrl ||
      this.fashionProject.gallery.length > 0
    );
  }

  protected showPreviousFashionImage(): void {
    const galleryLength = this.fashionProject.gallery.length;

    if (galleryLength === 0) {
      return;
    }

    this.fashionGalleryIndex = (this.fashionGalleryIndex + galleryLength - 1) % galleryLength;
  }

  protected showNextFashionImage(): void {
    const galleryLength = this.fashionProject.gallery.length;

    if (galleryLength === 0) {
      return;
    }

    this.fashionGalleryIndex = (this.fashionGalleryIndex + 1) % galleryLength;
  }

  protected currentCostumeGalleryItemFor(entry: CostumeProjectContent): { value: string; isImage: boolean } {
    const galleryLength = entry.gallery.length;
    const value = galleryLength > 0
      ? entry.gallery[this.costumeGalleryIndex % galleryLength] ?? ''
      : 'Gallery';

    return {
      value: value || 'Gallery',
      isImage: this.isImageUrl(value)
    };
  }

  protected showPreviousCostumeImage(): void {
    const galleryLength = Math.max(...this.costumeProjects.map((project) => project.gallery.length), 0);

    if (galleryLength === 0) {
      return;
    }

    this.costumeGalleryIndex = (this.costumeGalleryIndex + galleryLength - 1) % galleryLength;
  }

  protected showNextCostumeImage(): void {
    const galleryLength = Math.max(...this.costumeProjects.map((project) => project.gallery.length), 0);

    if (galleryLength === 0) {
      return;
    }

    this.costumeGalleryIndex = (this.costumeGalleryIndex + 1) % galleryLength;
  }

  private async loadCostumeProjects(): Promise<void> {
    try {
      this.costumeProjects = await this.fetchCostumeProjects('/api/costume-designs');
    } catch (proxyError) {
      try {
        this.costumeProjects = await this.fetchCostumeProjects('http://localhost:5109/api/costume-designs');
      } catch (backendError) {
        this.costumeProjects = [COSTUME_PROJECT];
        console.warn('Unable to load costume design content from server.', { proxyError, backendError });
      }
    } finally {
      this.costumeLoaded = true;
      this.costumeGalleryIndex = 0;
      this.changeDetectorRef.detectChanges();
      this.refreshFadeElements();
    }
  }

  private async loadFashionProject(): Promise<void> {
    try {
      this.fashionProjects = await this.fetchFashionProjects('/api/fashion-designs');
    } catch (proxyError) {
      try {
        this.fashionProjects = await this.fetchFashionProjects('http://localhost:5109/api/fashion-designs');
      } catch (backendError) {
        this.fashionProjects = [];
        console.warn('Unable to load fashion design content from server.', { proxyError, backendError });
      }
    } finally {
      this.fashionProject = this.fashionProjects[0] ?? FASHION_PROJECT;
      this.fashionLoaded = true;
      this.fashionGalleryIndex = 0;
      this.changeDetectorRef.detectChanges();
      this.refreshFadeElements();
    }
  }

  private refreshFadeElements(): void {
    this.fadeElements = Array.from(
      this.elementRef.nativeElement.querySelectorAll('.fashion-entry-title-band, .fashion-band, .costume-title-band, .costume-meta, .costume-video-placeholder, .costume-video-band, .costume-gallery-band, .costume-description, .costume-credits')
    ) as HTMLElement[];

    this.updateVisibility();
  }

  private async fetchFashionProjects(url: string): Promise<FashionProjectContent[]> {
    const abortController = new AbortController();
    const timeout = window.setTimeout(() => abortController.abort(), 5000);

    try {
      const response = await fetch(url, { signal: abortController.signal });

      if (!response.ok) {
        throw new Error(`Fashion design request failed with ${response.status}`);
      }

      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error(`Fashion design request returned ${response.headers.get('content-type') ?? 'unknown content type'}`);
      }

      return this.normalizeFashionProjects(await response.json());
    } finally {
      window.clearTimeout(timeout);
    }
  }

  private async fetchCostumeProjects(url: string): Promise<CostumeProjectContent[]> {
    const abortController = new AbortController();
    const timeout = window.setTimeout(() => abortController.abort(), 5000);

    try {
      const response = await fetch(url, { signal: abortController.signal });

      if (!response.ok) {
        throw new Error(`Costume design request failed with ${response.status}`);
      }

      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error(`Costume design request returned ${response.headers.get('content-type') ?? 'unknown content type'}`);
      }

      return this.normalizeCostumeProjects(await response.json());
    } finally {
      window.clearTimeout(timeout);
    }
  }

  private async fetchTeachingCards(url: string): Promise<TeachingCard[]> {
    const abortController = new AbortController();
    const timeout = window.setTimeout(() => abortController.abort(), 5000);

    try {
      const response = await fetch(url, { signal: abortController.signal });

      if (!response.ok) {
        throw new Error(`Teaching request failed with ${response.status}`);
      }

      return this.normalizeTeachingCards(await response.json());
    } finally {
      window.clearTimeout(timeout);
    }
  }

  private normalizeTeachingCards(response: unknown): TeachingCard[] {
    const cards = this.readTeachingCardArray(this.parseTeachingResponse(response));

    return cards
      .map((card) => ({
        title: this.readTeachingCardField(card, 'title'),
        author: this.readTeachingCardField(card, 'author'),
        school: this.readTeachingCardField(card, 'school'),
        previewImage: this.normalizeTeachingAssetUrl(this.readTeachingCardField(card, 'previewImage')),
        pdfUrl: this.readTeachingCardField(card, 'pdfUrl')
      }))
      .filter((card) => (
        card.title ||
        card.author ||
        card.school ||
        card.previewImage ||
        card.pdfUrl
      ));
  }

  private normalizeFashionProject(response: unknown): FashionProjectContent {
    const record = this.readFirstRecord(this.parseTeachingResponse(response));

    if (!record) {
      return FASHION_PROJECT;
    }

    const project = {
      title: this.readFashionField(record, ['title', 'Title', 'name', 'Name']) || FASHION_PROJECT.title,
      fields: this.readStringArray(record, ['fields', 'Fields', 'categories', 'Categories', 'tags', 'Tags']),
      videoUrl: this.normalizeAssetUrl(this.readFashionField(record, ['explainingVideo', 'ExplainingVideo', 'video', 'Video', 'videoUrl', 'VideoUrl', 'videoURL', 'VideoURL'])),
      description: this.readFashionField(record, ['description', 'Description', 'body', 'Body', 'text', 'Text']) || FASHION_PROJECT.description,
      pdfUrl: this.normalizeAssetUrl(this.readFashionField(record, ['pdf', 'Pdf', 'pdfUrl', 'PdfUrl', 'PDFUrl', 'pdfURL', 'PdfURL'])),
      gallery: this.readStringArray(record, ['gallery', 'Gallery', 'images', 'Images', 'imageUrls', 'ImageUrls']).map((url) => this.normalizeAssetUrl(url))
    };

    return project;
  }

  private normalizeFashionProjects(response: unknown): FashionProjectContent[] {
    const records = this.readFashionRecordArray(this.parseTeachingResponse(response));

    return records
      .map((record) => this.normalizeFashionProject(record))
      .filter((project) => (
        project.videoUrl ||
        project.description ||
        project.pdfUrl ||
        project.gallery.length > 0
      ));
  }

  private normalizeCostumeProjects(response: unknown): CostumeProjectContent[] {
    const projects = this.readFashionRecordArray(this.parseTeachingResponse(response))
      .map((record) => ({
        title: this.readFashionField(record, ['title', 'Title', 'name', 'Name']) || COSTUME_PROJECT.title,
        season: this.readFashionField(record, ['season', 'Season']),
        role: this.readFashionField(record, ['role', 'Role']),
        videoUrl: this.normalizeAssetUrl(this.readFashionField(record, ['video', 'Video', 'videoUrl', 'VideoUrl', 'videoURL', 'VideoURL'])),
        gallery: this.readStringArray(record, ['gallery', 'Gallery', 'images', 'Images', 'imageUrls', 'ImageUrls']).map((url) => this.normalizeAssetUrl(url)),
        description: this.readFashionField(record, ['description', 'Description', 'body', 'Body', 'text', 'Text']),
        credits: this.readFashionField(record, ['credits', 'Credits'])
      }))
      .filter((project) => (
        project.title ||
        project.season ||
        project.role ||
        project.videoUrl ||
        project.gallery.length > 0 ||
        project.description ||
        project.credits
      ));

    return projects.length > 0 ? projects : [COSTUME_PROJECT];
  }

  private readFashionRecordArray(response: unknown): Record<string, unknown>[] {
    if (Array.isArray(response)) {
      return response.filter(this.isTeachingCardRecord);
    }

    if (!this.isTeachingCardRecord(response)) {
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
      return values.filter(this.isTeachingCardRecord);
    }

    return [response];
  }

  private readFirstRecord(response: unknown): Record<string, unknown> | null {
    const parsedResponse = this.parseTeachingResponse(response);

    if (this.isTeachingCardRecord(parsedResponse)) {
      const values =
        parsedResponse['value'] ??
        parsedResponse['Value'] ??
        parsedResponse['$values'] ??
        parsedResponse['data'] ??
        parsedResponse['Data'] ??
        parsedResponse['item'] ??
        parsedResponse['Item'] ??
        parsedResponse['project'] ??
        parsedResponse['Project'];

      if (Array.isArray(values)) {
        return values.find(this.isTeachingCardRecord) ?? null;
      }

      if (this.isTeachingCardRecord(values)) {
        return values;
      }

      return parsedResponse;
    }

    if (Array.isArray(parsedResponse)) {
      return parsedResponse.find(this.isTeachingCardRecord) ?? null;
    }

    return null;
  }

  private readFashionField(record: Record<string, unknown>, aliases: string[]): string {
    const value = aliases.map((key) => record[key]).find((item) => item !== undefined);

    return String(value ?? '').trim();
  }

  private readStringArray(record: Record<string, unknown>, aliases: string[]): string[] {
    const value = aliases.map((key) => record[key]).find((item) => item !== undefined);

    if (Array.isArray(value)) {
      return value.map((item) => String(item ?? '').trim()).filter(Boolean);
    }

    if (this.isTeachingCardRecord(value)) {
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

  private parseTeachingResponse(response: unknown): unknown {
    if (typeof response !== 'string') {
      return response;
    }

    try {
      return JSON.parse(response);
    } catch {
      return response;
    }
  }

  private readTeachingCardArray(response: unknown): Record<string, unknown>[] {
    if (Array.isArray(response)) {
      return response.filter(this.isTeachingCardRecord);
    }

    if (this.isTeachingCardRecord(response)) {
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
        return values.filter(this.isTeachingCardRecord);
      }

      return [response];
    }

    return [];
  }

  private readTeachingCardField(card: Record<string, unknown>, field: keyof TeachingCard): string {
    const pascalField = field.charAt(0).toUpperCase() + field.slice(1);
    const aliases: Record<keyof TeachingCard, string[]> = {
      title: ['title', 'Title', 'name', 'Name'],
      author: ['author', 'Author'],
      school: ['school', 'School'],
      previewImage: ['previewImage', 'PreviewImage', 'previewImageUrl', 'PreviewImageUrl', 'preview_image', 'image', 'Image'],
      pdfUrl: ['pdfUrl', 'PdfUrl', 'PDFUrl', 'pdfURL', 'PdfURL', 'pdf', 'Pdf']
    };
    const value = aliases[field].map((key) => card[key]).find((item) => item !== undefined) ?? card[pascalField];

    return String(value ?? '').trim();
  }

  private normalizeTeachingAssetUrl(url: string): string {
    if (url.endsWith('/uploads/teachings/pezzi-di-vetro-preview.png')) {
      return '/assets/teachings/pezzi-di-vetro-preview.png';
    }

    return url;
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

  private readonly isTeachingCardRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null
  );
}
