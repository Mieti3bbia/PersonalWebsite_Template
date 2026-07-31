import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

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

const TEACHING_CARDS: TeachingCard[] = [
  {
    title: 'Paura d amare',
    author: 'Nicoletta Atzeni',
    school: 'IED Milano',
    previewImage: '/assets/home/anteprima-imperfetto-divenire.png',
    pdfUrl: ''
  },
  {
    title: 'Pezzi di vetro',
    author: 'Nicoletta Atzeni',
    school: 'IED Milano',
    previewImage: '/assets/teachings/pezzi-di-vetro-preview.png',
    pdfUrl: '/assets/teachings/pezzi-di-vetro.pdf'
  },
  {
    title: 'Placeholder title',
    author: 'Placeholder author',
    school: 'Placeholder school',
    previewImage: '',
    pdfUrl: ''
  }
];

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

          <div class="teachings-card-list">
            @for (card of teachingCards; track card.title) {
              <article class="teaching-card">
                <div class="teaching-card-body">
                  <div class="teaching-card-copy">
                    <p>"{{ card.title }}"</p>
                    <p>{{ card.author }}</p>
                    <p>{{ card.school }}</p>
                  </div>

                  <a
                    class="teaching-preview"
                    [href]="card.pdfUrl || '#'"
                    [attr.target]="card.pdfUrl ? '_blank' : null"
                    rel="noopener"
                    [attr.aria-label]="card.pdfUrl ? 'Open ' + card.title + ' PDF' : 'Teaching preview placeholder'"
                  >
                    @if (card.previewImage) {
                      <img [src]="card.previewImage" [alt]="card.title + ' preview'">
                    } @else {
                      <span>anteprima</span>
                    }
                  </a>
                </div>
              </article>
            }
          </div>

          <a class="back-link teachings-back-link" routerLink="/portfolio">/ Go back /</a>
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
export class ProjectDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly slug = this.route.snapshot.paramMap.get('slug') ?? 'costume-design';
  protected readonly project = PROJECTS[this.slug] ?? PROJECTS['costume-design'];
  protected readonly isTeachings = this.slug === 'teachings';
  protected readonly teachingCards = this.loadTeachingCards();

  private loadTeachingCards(): TeachingCard[] {
    return TEACHING_CARDS;
  }
}
