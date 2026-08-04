import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChangeDetectorRef, OnInit } from '@angular/core';

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

const FASHION_PROJECT: FashionProjectContent = {
  title: 'Fashion Design',
  fields: [],
  videoUrl: '',
  description: '',
  pdfUrl: '',
  gallery: []
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
          <header class="fashion-header">
            <h1 class="slide-in">{{ project.title }}</h1>
            @if (fashionProject.fields.length > 0) {
              <div class="fashion-fields" aria-label="Fashion design fields">
                @for (field of fashionProject.fields; track field) {
                  <span>{{ field }}</span>
                }
              </div>
            }
          </header>

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
export class ProjectDetailPage implements OnInit {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly slug = this.route.snapshot.paramMap.get('slug') ?? 'costume-design';
  protected readonly project = PROJECTS[this.slug] ?? PROJECTS['costume-design'];
  protected readonly isTeachings = this.slug === 'teachings';
  protected readonly isFashionDesign = this.slug === 'fashion-design';
  protected fashionProject = FASHION_PROJECT;
  protected fashionProjects: FashionProjectContent[] = [];
  protected fashionLoaded = false;
  protected fashionGalleryIndex = 0;
  protected teachingCards: TeachingCard[] = [];
  protected teachingsLoaded = false;

  async ngOnInit(): Promise<void> {
    if (this.isFashionDesign) {
      await this.loadFashionProject();
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
    }
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

  private readonly isTeachingCardRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null
  );
}
