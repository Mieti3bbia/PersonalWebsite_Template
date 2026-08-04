import { Routes } from '@angular/router';
import { AboutPage } from './pages/about.page';
import { ContactPage } from './pages/contact.page';
import { HomePage } from './pages/home.page';
import { ProjectDetailPage } from './pages/project-detail.page';
import { ProjectsPage } from './pages/projects.page';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomePage },
  { path: 'portfolio', component: ProjectsPage },
  { path: 'project', redirectTo: 'portfolio', pathMatch: 'full' },
  { path: 'projects', redirectTo: 'portfolio', pathMatch: 'full' },
  { path: 'project/project1', redirectTo: 'portfolio/costume-design', pathMatch: 'full' },
  { path: 'project/project2', redirectTo: 'portfolio/fashion-design', pathMatch: 'full' },
  { path: 'project/project3', redirectTo: 'portfolio/teachings', pathMatch: 'full' },
  { path: 'projects/project1', redirectTo: 'portfolio/costume-design', pathMatch: 'full' },
  { path: 'projects/project2', redirectTo: 'portfolio/fashion-design', pathMatch: 'full' },
  { path: 'projects/project3', redirectTo: 'portfolio/teachings', pathMatch: 'full' },
  { path: 'project/costume-design', redirectTo: 'portfolio/costume-design', pathMatch: 'full' },
  { path: 'project/fashion-design', redirectTo: 'portfolio/fashion-design', pathMatch: 'full' },
  { path: 'project/teachings', redirectTo: 'portfolio/teachings', pathMatch: 'full' },
  { path: 'projects/costume-design', redirectTo: 'portfolio/costume-design', pathMatch: 'full' },
  { path: 'projects/fashion-design', redirectTo: 'portfolio/fashion-design', pathMatch: 'full' },
  { path: 'projects/teachings', redirectTo: 'portfolio/teachings', pathMatch: 'full' },
  { path: 'projects/curriculum1', redirectTo: 'portfolio/costume-design', pathMatch: 'full' },
  { path: 'projects/curriculum2', redirectTo: 'portfolio/fashion-design', pathMatch: 'full' },
  { path: 'projects/curriculum3', redirectTo: 'portfolio/teachings', pathMatch: 'full' },
  { path: 'portfolio/:slug', component: ProjectDetailPage },
  { path: 'aboutme', component: AboutPage },
  { path: 'contact', component: ContactPage },
  { path: '**', redirectTo: 'home' }
];
