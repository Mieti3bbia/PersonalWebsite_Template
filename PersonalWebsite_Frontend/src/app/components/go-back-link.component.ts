import { Location } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-go-back-link',
  imports: [RouterLink],
  host: {
    class: 'go-back-link-host'
  },
  template: `
    @if (historyBack) {
      <button [class]="classes" type="button" (click)="goBack()">Go back</button>
    } @else {
      <a [class]="classes" [routerLink]="routerLink">Go back</a>
    }
  `
})
export class GoBackLinkComponent {
  private readonly location = inject(Location);

  @Input() routerLink: string | unknown[] = '/home';
  @Input() variantClass = '';
  @Input() historyBack = false;

  protected get classes(): string {
    return ['back-link', 'page-back-link', this.variantClass].filter(Boolean).join(' ');
  }

  protected goBack(): void {
    this.location.back();
  }
}
