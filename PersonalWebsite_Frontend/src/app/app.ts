import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private cursorElement?: HTMLElement;
  private cursorAnimationFrame = 0;
  private cursorCurrentX = 0;
  private cursorCurrentY = 0;
  private cursorTargetX = 0;
  private cursorTargetY = 0;
  private cursorHasPointer = false;
  private cursorMediaQuery?: MediaQueryList;

  private readonly handlePointerMove = (event: PointerEvent): void => {
    this.updateCursorTarget(event.clientX, event.clientY);
  };

  private readonly handleMouseMove = (event: MouseEvent): void => {
    this.updateCursorTarget(event.clientX, event.clientY);
  };

  private readonly handlePointerOver = (event: PointerEvent): void => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const isInteractive = Boolean(target.closest('a, button, input, textarea, select, [role="button"]'));
    this.cursorElement?.classList.toggle('is-interactive', isInteractive);
  };

  private readonly handleWindowScroll = (): void => {
    this.updateScrollProgress();
  };

  private readonly handleCursorMediaChange = (): void => {
    if (this.canUseChasingCursor()) {
      this.startChasingCursor();
      return;
    }

    this.stopChasingCursor();
  };

  private readonly animateCursor = (): void => {
    if (this.cursorElement && this.cursorHasPointer) {
      const deltaX = this.cursorTargetX - this.cursorCurrentX;
      const deltaY = this.cursorTargetY - this.cursorCurrentY;
      const distance = Math.hypot(deltaX, deltaY);
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
      const stretch = this.clamp(distance / 150, 0, 0.72);
      const squash = 1 - stretch * 0.36;

      this.cursorCurrentX += deltaX * 0.16;
      this.cursorCurrentY += deltaY * 0.16;
      this.cursorElement.style.transform = [
        `translate3d(${this.cursorCurrentX}px, ${this.cursorCurrentY}px, 0)`,
        'translate(-50%, -50%)',
        `rotate(${angle}deg)`,
        `scale(${1 + stretch}, ${squash})`
      ].join(' ');
    }

    this.cursorAnimationFrame = window.requestAnimationFrame(this.animateCursor);
  };

  protected menuOpen = false;
  protected footerContactSubmitting = false;
  protected footerContactMessage = '';
  protected footerContactError = false;
  protected footerSelectedWorkOn = this.readInitialFooterWorkOn();

  private readonly handleFooterWorkOnRequest = (event: Event): void => {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    const workOnValue = String(event.detail ?? '').trim();

    if (!workOnValue) {
      return;
    }

    this.setFooterWorkOn(workOnValue);
    window.setTimeout(() => this.scrollFooterContactIntoView(true), 40);
  };

  protected get footerLocalTime(): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Rome'
    }).format(new Date());
  }

  protected toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  protected closeMenu(): void {
    this.menuOpen = false;
  }

  protected handleLogoMagnetMove(event: PointerEvent): void {
    const target = event.currentTarget;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (!this.canUseLogoMagnet(event)) {
      this.resetLogoMagnetElement(target);
      return;
    }

    const rect = target.getBoundingClientRect();
    const relativeX = event.clientX - (rect.left + rect.width / 2);
    const relativeY = event.clientY - (rect.top + rect.height / 2);
    const magnetX = this.clamp(relativeX * 0.36, -18, 18);
    const magnetY = this.clamp(relativeY * 0.46, -16, 16);

    target.style.setProperty('--logo-magnet-x', `${magnetX}px`);
    target.style.setProperty('--logo-magnet-y', `${magnetY}px`);
    target.style.setProperty('--logo-bg-x', `${magnetX * 0.45}px`);
    target.style.setProperty('--logo-bg-y', `${magnetY * 0.45}px`);
    target.style.setProperty('--logo-spark-x', `${magnetX * -0.32}px`);
    target.style.setProperty('--logo-spark-y', `${magnetY * -0.32}px`);
  }

  protected resetLogoMagnet(event: Event): void {
    const target = event.currentTarget;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    this.resetLogoMagnetElement(target);
  }

  private resetLogoMagnetElement(target: HTMLElement): void {
    target.style.setProperty('--logo-magnet-x', '0px');
    target.style.setProperty('--logo-magnet-y', '0px');
    target.style.setProperty('--logo-bg-x', '0px');
    target.style.setProperty('--logo-bg-y', '0px');
    target.style.setProperty('--logo-spark-x', '0px');
    target.style.setProperty('--logo-spark-y', '0px');
  }

  private canUseLogoMagnet(event: PointerEvent): boolean {
    return event.pointerType === 'mouse'
      && window.matchMedia('(hover: hover) and (pointer: fine)').matches
      && window.innerWidth > 760;
  }

  ngAfterViewInit(): void {
    this.prepareChasingCursor();
    this.updateScrollProgress();
    window.addEventListener('scroll', this.handleWindowScroll, { passive: true });
    window.addEventListener('resize', this.handleWindowScroll, { passive: true });
    window.addEventListener('footer-work-on', this.handleFooterWorkOnRequest);

    const initialWorkOn = this.readInitialFooterWorkOn();

    if (initialWorkOn) {
      window.setTimeout(() => this.setFooterWorkOn(initialWorkOn), 0);
    }

    if (window.location.hash === '#footer-contact') {
      window.setTimeout(() => this.scrollFooterContactIntoView(false), 500);
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('pointerover', this.handlePointerOver);
    window.removeEventListener('scroll', this.handleWindowScroll);
    window.removeEventListener('resize', this.handleWindowScroll);
    window.removeEventListener('footer-work-on', this.handleFooterWorkOnRequest);
    this.cursorMediaQuery?.removeEventListener('change', this.handleCursorMediaChange);
    this.stopChasingCursor();
    document.documentElement.style.removeProperty('--scroll-progress');
  }

  protected navigateToFooterContact(event: Event): void {
    event.preventDefault();
    this.closeMenu();

    void this.router.navigate(['/home'], { fragment: 'footer-contact' }).then(() => {
      window.setTimeout(() => this.scrollFooterContactIntoView(true), 80);
    });
  }

  protected navigateToHomeTop(event: Event): void {
    event.preventDefault();
    this.closeMenu();

    void this.router.navigate(['/home']).then(() => {
      window.setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 80);
    });
  }

  protected async handleFooterContactSubmit(event: SubmitEvent, form: HTMLFormElement): Promise<void> {
    event.preventDefault();
    this.footerContactMessage = '';
    this.footerContactError = false;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const request = this.buildFooterContactRequest(formData);

    try {
      this.footerContactSubmitting = true;
      await this.sendFooterContactRequest(request);
      this.footerContactMessage = 'Thank you. Your request has been sent.';
      form.reset();
      this.footerSelectedWorkOn = '';
    } catch (error) {
      this.footerContactError = true;
      this.footerContactMessage = 'Something went wrong while submitting the form.';
      console.error('Unable to send footer contact request.', error);
    } finally {
      this.footerContactSubmitting = false;
    }
  }

  private buildFooterContactRequest(formData: FormData): {
    form: Record<string, string>;
    email: { replyTo: string; subject: string; text: string };
    createdAt: string;
    source: 'website-contact-form';
  } {
    const firstName = this.readFooterFormValue(formData, 'firstName');
    const lastName = this.readFooterFormValue(formData, 'lastName');
    const email = this.readFooterFormValue(formData, 'email');
    const type = this.readFooterFormValue(formData, 'type');
    const subject = this.readFooterFormValue(formData, 'subject');
    const message = this.readFooterFormValue(formData, 'message');
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      form: { firstName, lastName, email, type, subject, message },
      email: {
        replyTo: email,
        subject: `[Maria Sole Website] ${type} - ${subject}`,
        text: [
          `Name: ${fullName}`,
          `Email: ${email}`,
          `Type: ${type}`,
          `Subject: ${subject}`,
          '',
          'Message:',
          message
        ].join('\n')
      },
      createdAt: new Date().toISOString(),
      source: 'website-contact-form'
    };
  }

  private readFooterFormValue(formData: FormData, key: string): string {
    return String(formData.get(key) ?? '').trim();
  }

  private async sendFooterContactRequest(request: unknown): Promise<void> {
    const abortController = new AbortController();
    const timeout = window.setTimeout(() => abortController.abort(), 15000);

    const response = await fetch('http://localhost:5109/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      signal: abortController.signal
    }).finally(() => window.clearTimeout(timeout));

    if (!response.ok) {
      throw new Error(`Contact API failed with status ${response.status}`);
    }
  }

  private scrollFooterContactIntoView(smooth: boolean): void {
    document.getElementById('footer-contact')?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'start'
    });
  }

  protected handleFooterWorkOnChange(event: Event): void {
    const target = event.target;
    this.footerSelectedWorkOn = target instanceof HTMLSelectElement ? target.value : '';
  }

  private setFooterWorkOn(value: string): void {
    this.footerSelectedWorkOn = value;
  }

  private readInitialFooterWorkOn(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    return new URLSearchParams(window.location.search).get('workOn') ?? '';
  }

  private prepareChasingCursor(): void {
    this.cursorElement = document.querySelector<HTMLElement>('.chasing-cursor') ?? undefined;
    this.cursorMediaQuery = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 761px)');
    this.cursorMediaQuery.addEventListener('change', this.handleCursorMediaChange);

    if (!this.cursorElement || !this.canUseChasingCursor()) {
      return;
    }

    this.startChasingCursor();
  }

  private startChasingCursor(): void {
    if (!this.cursorElement || this.cursorAnimationFrame) {
      return;
    }

    document.documentElement.classList.add('has-chasing-cursor');
    this.updateCursorTarget(window.innerWidth / 2, window.innerHeight / 2);
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    window.addEventListener('pointerover', this.handlePointerOver, { passive: true });
    this.cursorAnimationFrame = window.requestAnimationFrame(this.animateCursor);
  }

  private stopChasingCursor(): void {
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('pointerover', this.handlePointerOver);
    window.cancelAnimationFrame(this.cursorAnimationFrame);
    this.cursorAnimationFrame = 0;
    this.cursorHasPointer = false;
    this.cursorElement?.classList.remove('is-visible', 'is-interactive');
    document.documentElement.classList.remove('has-chasing-cursor');
  }

  private canUseChasingCursor(): boolean {
    return Boolean(this.cursorMediaQuery?.matches);
  }

  private updateCursorTarget(x: number, y: number): void {
    this.cursorTargetX = x;
    this.cursorTargetY = y;

    if (!this.cursorHasPointer) {
      this.cursorHasPointer = true;
      this.cursorCurrentX = x;
      this.cursorCurrentY = y;
      this.cursorElement?.classList.add('is-visible');
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private updateScrollProgress(): void {
    const documentElement = document.documentElement;
    const scrollableHeight = Math.max(1, documentElement.scrollHeight - window.innerHeight);
    const progress = this.clamp(window.scrollY / scrollableHeight, 0, 1);
    documentElement.style.setProperty('--scroll-progress', progress.toFixed(4));
  }

}
