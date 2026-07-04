import { Routes } from '@angular/router';
import { AboutPage } from './pages/about.page';
import { ContactPage } from './pages/contact.page';
import { HomePage } from './pages/home.page';
import { ProjectDetailPage } from './pages/project-detail.page';
import { ProjectsPage } from './pages/projects.page';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomePage },
  { path: 'project', component: ProjectsPage },
  { path: 'projects', component: ProjectsPage },
  { path: 'projects/curriculum1', redirectTo: 'projects/project1', pathMatch: 'full' },
  { path: 'projects/curriculum2', redirectTo: 'projects/project2', pathMatch: 'full' },
  { path: 'projects/curriculum3', redirectTo: 'projects/project3', pathMatch: 'full' },
  { path: 'projects/:slug', component: ProjectDetailPage },
  { path: 'aboutme', component: AboutPage },
  { path: 'contact', component: ContactPage },
  { path: '**', redirectTo: 'home' }
];
