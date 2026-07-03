import { Routes } from '@angular/router';
import { AboutPage } from './pages/about.page';
import { ContactPage } from './pages/contact.page';
import { HomePage } from './pages/home.page';
import { ProjectDetailPage } from './pages/project-detail.page';
import { ProjectsPage } from './pages/projects.page';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomePage },
  { path: 'projects', component: ProjectsPage },
  { path: 'project', redirectTo: 'projects', pathMatch: 'full' },
  { path: 'projects/:slug', component: ProjectDetailPage },
  { path: 'aboutme', component: AboutPage },
  { path: 'contact', component: ContactPage },
  { path: '**', redirectTo: 'home' }
];
