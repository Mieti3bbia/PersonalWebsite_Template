import { Routes } from '@angular/router';
import { ContactPage } from './pages/contact.page';
import { ProjectsPage } from './pages/projects.page';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: ProjectsPage },
  { path: 'portfolio', redirectTo: 'home', pathMatch: 'full' },
  { path: 'portfolio/:slug', redirectTo: 'home', pathMatch: 'full' },
  { path: 'servizi', redirectTo: 'home', pathMatch: 'full' },
  { path: 'project', redirectTo: 'home', pathMatch: 'full' },
  { path: 'project/:slug', redirectTo: 'home', pathMatch: 'full' },
  { path: 'projects', redirectTo: 'home', pathMatch: 'full' },
  { path: 'projects/:slug', redirectTo: 'home', pathMatch: 'full' },
  { path: 'aboutme', redirectTo: 'home', pathMatch: 'full' },
  { path: 'curriculumvitae', redirectTo: 'home', pathMatch: 'full' },
  { path: 'contacts', redirectTo: 'contact', pathMatch: 'full' },
  { path: 'contact', component: ContactPage },
  { path: '**', redirectTo: 'home' }
];
