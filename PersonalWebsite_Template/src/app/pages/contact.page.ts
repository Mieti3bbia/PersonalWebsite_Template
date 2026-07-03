import { Component } from '@angular/core';

export interface ContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  source: 'website-contact-form';
}

@Component({
  selector: 'app-contact-page',
  template: `
    <main class="detail-page contact-page">
      <section class="contact-form-section page-section">
        <h1 class="slide-in">Contact</h1>

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
            <span>Oggetto</span>
            <input name="subject" type="text" required>
          </label>

          <label class="message-field">
            <span>Messaggio</span>
            <textarea name="message" rows="8" required></textarea>
          </label>

          <button type="submit">Invia</button>
        </form>

        <div class="contact-map" aria-label="Google Maps location">
          <iframe
            title="Google Maps location"
            src="https://www.google.com/maps?q=Milan,Italy&output=embed"
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

  protected handleSubmit(event: SubmitEvent, form: HTMLFormElement): void {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const contactRequest: ContactRequest = {
      firstName: this.readFormValue(formData, 'firstName'),
      lastName: this.readFormValue(formData, 'lastName'),
      email: this.readFormValue(formData, 'email'),
      subject: this.readFormValue(formData, 'subject'),
      message: this.readFormValue(formData, 'message'),
      createdAt: new Date().toISOString(),
      source: 'website-contact-form'
    };

    this.lastContactRequest = contactRequest;
    console.info('Contact request ready for server handling:', contactRequest);
    form.reset();
  }

  private readFormValue(formData: FormData, key: string): string {
    return String(formData.get(key) ?? '').trim();
  }
}

