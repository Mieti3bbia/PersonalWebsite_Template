import { Component } from '@angular/core';

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
  replyTo: string;
  subject: string;
  text: string;
}

@Component({
  selector: 'app-contact-page',
  template: `
    <main class="detail-page contact-page">
      <section class="contact-form-section page-section">
        <header class="contact-intro">
          <p>Start a project</p>
          <h1>Parlami del progetto</h1>
          <p>Consulenze, costumi, sviluppo prodotto e tutoraggio partono da qui. Seleziona una tipologia e lascia i dettagli essenziali.</p>
        </header>

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

          <button type="submit" [disabled]="isSubmitting">
            Conferma
          </button>
          @if (submitMessage) {
            <p class="contact-submit-message" [class.is-error]="submitError">{{ submitMessage }}</p>
          }
        </form>

        <div class="contact-map" aria-label="Google Maps location">
          <iframe
            title="Contact location map"
            src="https://www.google.com/maps?q=45.452260,9.177442&z=15&output=embed"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>
    </main>
  `
})
export class ContactPage {
  protected lastContactRequest: ContactRequest | null = null;
  protected selectedType = '';
  protected typeDropdownOpen = false;
  protected isSubmitting = false;
  protected submitMessage = '';
  protected submitError = false;
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

    try {
      this.isSubmitting = true;
      await this.sendContactRequest(contactRequest);
      this.submitMessage = 'Richiesta inviata correttamente.';
      form.reset();
      this.selectedType = '';
      this.typeDropdownOpen = false;
    } catch (error) {
      this.submitError = true;
      this.submitMessage = 'Invio non riuscito. Riprova piu tardi.';
      console.error('Unable to send contact request.', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private readFormValue(formData: FormData, key: string): string {
    return String(formData.get(key) ?? '').trim();
  }

  private buildContactRequest(formData: ContactFormData): ContactRequest {
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    return {
      form: formData,
      email: {
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

    const response = await fetch('http://localhost:5109/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactRequest),
      signal: abortController.signal
    }).finally(() => window.clearTimeout(timeout));

    if (!response.ok) {
      throw new Error(`Contact API failed with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
      return;
    }

    const ack = await response.json() as { ok?: boolean };

    if (ack.ok !== true) {
      throw new Error('Contact API did not return a positive acknowledgement.');
    }
  }
}


