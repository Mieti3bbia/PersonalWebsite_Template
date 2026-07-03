import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-projects-page',
  imports: [RouterLink],
  template: `
    <main class="detail-page projects-page projects-fullscreen-page">
      <nav class="projects-fullscreen-list" aria-label="Project navigation">
        <a class="project-fullscreen-link project-fullscreen-one" routerLink="/projects/curriculum1">project1</a>
        <a class="project-fullscreen-link project-fullscreen-two" routerLink="/projects/curriculum2">project2</a>
        <a class="project-fullscreen-link project-fullscreen-three" routerLink="/projects/curriculum3">project3</a>
      </nav>
    </main>
  `
})
export class ProjectsPage {}
