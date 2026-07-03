import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface CurriculumProject {
  title: string;
  kicker: string;
  description: string;
  image: string;
}

const PROJECTS: Record<string, CurriculumProject> = {
  curriculum1: {
    title: 'Curriculum 1',
    kicker: '/ Fashion research /',
    description: 'A focused curriculum project built around visual research, garment language and editorial direction.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=85'
  },
  curriculum2: {
    title: 'Curriculum 2',
    kicker: '/ Graphic identity /',
    description: 'A visual system exploring typography, image hierarchy and contemporary brand identity.',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=80'
  },
  curriculum3: {
    title: 'Curriculum 3',
    kicker: '/ Digital fashion /',
    description: 'A digital fashion direction project connecting material references, motion and image-based storytelling.',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=80'
  }
};

@Component({
  selector: 'app-project-detail-page',
  imports: [RouterLink],
  template: `
    <main class="detail-page project-detail-page">
      <section class="project-detail-layout page-section">
        <div>
          <a class="back-link" routerLink="/projects">/ Back to projects /</a>
          <p class="eyebrow">{{ project.kicker }}</p>
          <h1>{{ project.title }}</h1>
          <p class="project-description">{{ project.description }}</p>
        </div>
        <img [src]="project.image" [alt]="project.title">
      </section>
    </main>
  `
})
export class ProjectDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly slug = this.route.snapshot.paramMap.get('slug') ?? 'curriculum1';
  protected readonly project = PROJECTS[this.slug] ?? PROJECTS['curriculum1'];
}
