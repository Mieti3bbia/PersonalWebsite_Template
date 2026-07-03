import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-projects-page',
  imports: [RouterLink],
  template: `
    <main class="detail-page projects-page projects-fullscreen-page">
      <nav class="projects-fullscreen-list" aria-label="Project navigation">
        <a class="project-fullscreen-link project-fullscreen-one slide-in" routerLink="/projects/project1">project1</a>
        <a class="project-fullscreen-link project-fullscreen-two slide-in" routerLink="/projects/project2">project2</a>
        <a class="project-fullscreen-link project-fullscreen-three slide-in" routerLink="/projects/project3">project3</a>
      </nav>
    </main>
  `
})
export class ProjectsPage {}

