import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { GoBackLinkComponent } from '../components/go-back-link.component';
import { PageTitleHeroComponent } from '../components/page-title-hero.component';

export interface ContactRequest {
  form: ContactFormData;
  email: ContactEmailContent;
  createdAt: string;
  source: 'website-contact-form';
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  type: string;
  subject: string;
  message: string;
}

export interface ContactEmailContent {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

@Component({
  selector: 'app-contact-page',
  imports: [GoBackLinkComponent, PageTitleHeroComponent],
  template: `
    <main class="detail-page contact-page">
      <app-page-title-hero eyebrow="/ contact /" title="contact" />

      <section class="contact-form-section page-section">
        <form class="contact-form" #contactForm (submit)="handleSubmit($event, contactForm)">
          <label>
            <span>Nome</span>
            <input name="firstName" type="text" autocomplete="given-name" required>
          </label>

          <label>
            <span>Cognome</span>
            <input name="lastName" type="text" autocomplete="family-name" required>
          </label>

          <label>
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" required>
          </label>

          <label>
            <span>Tipologia</span>
            <div class="contact-type-select" [class.is-open]="typeDropdownOpen">
              <input class="contact-type-value" name="type" [value]="selectedType" required readonly tabindex="-1">
              <button
                type="button"
                class="contact-type-trigger"
                [class.is-placeholder]="!selectedType"
                aria-haspopup="listbox"
                [attr.aria-expanded]="typeDropdownOpen"
                (click)="typeDropdownOpen = !typeDropdownOpen"
              >
                {{ selectedType }}
              </button>
              @if (typeDropdownOpen) {
                <div class="contact-type-options" role="listbox">
                  @for (option of contactTypeOptions; track option) {
                    <button type="button" role="option" [attr.aria-selected]="selectedType === option" (click)="selectContactType(option)">
                      {{ option }}
                    </button>
                  }
                </div>
              }
            </div>
          </label>

          <label>
            <span>Oggetto</span>
            <input name="subject" type="text" required>
          </label>

          <label class="message-field">
            <span>Messaggio</span>
            <textarea name="message" rows="8" required></textarea>
          </label>

          <button type="submit">
            {{ submitButtonLabel }}
          </button>
        </form>

        <div class="contact-map" aria-label="Google Maps location">
          <iframe
            title="Contact location map"
            src="https://www.google.com/maps?q=45.452260,9.177442&z=15&output=embed"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>

        <aside class="contact-info-card" aria-label="Informazioni di contatto">
          <dl>
            <div>
              <dt>Nome</dt>
              <dd>Maria Sole Montironi Lasca</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd><a href="mailto:mariasole.freelancer@libero.it">mariasole.freelancer&#64;libero.it</a></dd>
            </div>
            <div>
              <dt>Telefono</dt>
              <dd><a href="tel:+393312827693">+39 3312827693</a></dd>
            </div>
            <div>
              <dt>Luogo</dt>
              <dd>Milano, Darsena</dd>
            </div>
          </dl>
        </aside>
      </section>

      <app-go-back-link routerLink="/home" variantClass="contact-back-link" />

      @if (submitModalOpen) {
        <section class="contact-submit-modal" role="dialog" aria-modal="true" [attr.aria-label]="submitError ? 'Errore invio' : 'Invio confermato'">
          <div class="contact-submit-modal-panel" [class.is-error]="submitError">
            <p>{{ submitError ? 'errore' : 'invio confermato' }}</p>
            @if (submitError && submitMessage) {
              <span>{{ submitMessage }}</span>
            }
            <button type="button" (click)="closeSubmitModal()">OK</button>
          </div>
        </section>
      }
    </main>
  `
})
export class ContactPage {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly referenceEmail = 'mariasole.freelancer@gmail.com';
  protected lastContactRequest: ContactRequest | null = null;
  protected selectedType = '';
  protected typeDropdownOpen = false;
  protected submitButtonLabel = 'Conferma';
  protected submitMessage = '';
  protected submitError = false;
  protected submitModalOpen = false;
  private submitLabelTimeout = 0;
  protected readonly contactTypeOptions = [
    'Consulenza in Fashion Design',
    'Consulenza in Costume Design',
    'Lezione conoscitiva per il tutoraggio',
    'Corso di Disegno Tecnico',
    'Corso di Modellistica',
    'Corso di Cucito',
    'Corso di Progettazione di Moda'
  ];

  protected selectContactType(option: string): void {
    this.selectedType = option;
    this.typeDropdownOpen = false;
  }

  protected async handleSubmit(event: SubmitEvent, form: HTMLFormElement): Promise<void> {
    event.preventDefault();
    this.submitMessage = '';
    this.submitError = false;
    this.submitModalOpen = false;
    window.clearTimeout(this.submitLabelTimeout);

    if (!this.selectedType) {
      this.typeDropdownOpen = true;
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const contactFormData: ContactFormData = {
      firstName: this.readFormValue(formData, 'firstName'),
      lastName: this.readFormValue(formData, 'lastName'),
      email: this.readFormValue(formData, 'email'),
      type: this.readFormValue(formData, 'type'),
      subject: this.readFormValue(formData, 'subject'),
      message: this.readFormValue(formData, 'message')
    };
    const contactRequest = this.buildContactRequest(contactFormData);

    this.lastContactRequest = contactRequest;

    this.submitButtonLabel = 'Invio...';
    this.submitLabelTimeout = window.setTimeout(() => {
      this.submitButtonLabel = 'Conferma';
      this.changeDetectorRef.detectChanges();
    }, 4000);

    try {
      await this.sendContactRequest(contactRequest);
      this.submitMessage = 'invio confermato';
      this.submitModalOpen = true;
      form.reset();
      this.selectedType = '';
      this.typeDropdownOpen = false;
    } catch (error) {
      this.submitError = true;
      this.submitMessage = error instanceof Error ? error.message : 'Invio non riuscito.';
      this.submitModalOpen = true;
      console.error('Unable to send contact request.', error);
    }
  }

  protected closeSubmitModal(): void {
    this.submitModalOpen = false;
  }

  private readFormValue(formData: FormData, key: string): string {
    return String(formData.get(key) ?? '').trim();
  }

  private buildContactRequest(formData: ContactFormData): ContactRequest {
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    return {
      form: formData,
      email: {
        to: this.referenceEmail,
        replyTo: formData.email,
        subject: `[Maria Sole Website] ${formData.type} - ${formData.subject}`,
        text: [
          `Nome: ${fullName}`,
          `Email: ${formData.email}`,
          `Tipologia: ${formData.type}`,
          `Oggetto: ${formData.subject}`,
          '',
          'Messaggio:',
          formData.message
        ].join('\n')
      },
      createdAt: new Date().toISOString(),
      source: 'website-contact-form'
    };
  }

  private async sendContactRequest(contactRequest: ContactRequest): Promise<void> {
    const abortController = new AbortController();
    const timeout = window.setTimeout(() => abortController.abort(), 15000);

    const requestInit: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactRequest),
      signal: abortController.signal
    };

    try {
      const response = await fetch('/api/contact', requestInit);
      await this.assertContactResponse(response);
    } catch (proxyError) {
      if (proxyError instanceof Error && !proxyError.message.includes('Failed to fetch')) {
        throw proxyError;
      }

      const fallbackController = new AbortController();
      const fallbackTimeout = window.setTimeout(() => fallbackController.abort(), 15000);

      try {
        const fallbackResponse = await fetch('http://localhost:5109/api/contact', {
          ...requestInit,
          signal: fallbackController.signal
        });
        await this.assertContactResponse(fallbackResponse);
      } catch (fallbackError) {
        console.error('Contact API proxy and fallback both failed.', { proxyError, fallbackError });
        throw fallbackError instanceof Error ? fallbackError : proxyError;
      } finally {
        window.clearTimeout(fallbackTimeout);
      }
    } finally {
      window.clearTimeout(timeout);
    }
  }

  private async assertContactResponse(response: Response): Promise<void> {
    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
      ? await response.json() as { ok?: boolean; error?: string }
      : null;

    if (!response.ok) {
      throw new Error(body?.error ?? `Contact API failed with status ${response.status}`);
    }

    if (!body) {
      return;
    }

    if (body.ok !== true) {
      throw new Error(body.error ?? 'Contact API did not return a positive acknowledgement.');
    }
  }
}


