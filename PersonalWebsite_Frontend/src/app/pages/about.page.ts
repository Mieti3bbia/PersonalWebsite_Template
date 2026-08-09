import { AfterViewInit, Component, ElementRef, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about-page',
  imports: [RouterLink],
  template: `
    <main class="detail-page about-page">
      <section class="about-layout page-section">
        <div>
          <p class="eyebrow">/ About me /</p>
          <h1 class="slide-in">
            <span>Maria Sole</span>
            <span>Montironi Lasca</span>
          </h1>
          <p class="about-subtitle">Fashion &amp; Costume Designer e Tutor</p>
        </div>
        <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85" alt="Portrait in a creative studio">
      </section>

      <section class="about-body page-section">
        <p>Sono una Fashion Designer, Costume Designer &amp; Maker e Tutor, ma nessuna di queste definizioni, da sola, riesce davvero a raccontare chi sono.</p>
        <p>Il mio percorso e' iniziato allo IED Istituto Europeo di Design di Milano, dove mi sono formata grazie a una borsa di studio ottenuta per merito. E' li' che ho scoperto quella che oggi considero la mia piu' grande forza: una duplice, anzi triplice, identita'.</p>
        <p><strong>Da una parte la moda. Dall'altra il costume.</strong></p>
        <p><strong>Due mondi che spesso vengono percepiti come opposti, ma che per me non hanno mai smesso di dialogare.</strong></p>
        <p>La moda e' sempre piu' orientata verso il prodotto: richiede attenzione al mercato, al target, alla riconoscibilita', alla costruzione di un'identita' capace di essere desiderata e, inevitabilmente, venduta. E' un universo che vive di equilibrio tra creativita' e strategia.</p>
        <p>Il costume, invece, appartiene alle arti performative. E' il luogo in cui l'immaginazione sembra poter esistere senza limiti, dove cio' che conta e' creare qualcosa di straordinario, capace di raccontare un personaggio, un'emozione, una drammaturgia.</p>
        <p>Ma e' proprio qui che emerge la sua complessita'.</p>
        <p>Perche' il costume, per quanto libero, e' profondamente legato al corpo. Deve convivere con il movimento, con la danza, con la performance, con il tempo della scena. Deve essere "di spettacolo" senza rinunciare alla funzionalita'. Ogni scelta creativa deve confrontarsi con la realta' di chi quel costume lo indossa.</p>
        <p>E' in questa continua tensione tra immaginazione e fattibilita' che mi sento davvero a casa.</p>
        <p>Credo che l'incontro tra questi due mondi abbia formato il mio modo di progettare. Mi ha insegnato ad affrontare ogni progetto con curiosita', spirito critico e una forte capacita' di problem solving, cercando sempre un equilibrio tra ricerca concettuale, identita' estetica e realizzazione tecnica.</p>
        <p>Amo costruire concept, sviluppare moodboard, definire un'identita' progettuale, un target, un immaginario e una direzione artistica, ma provo la stessa soddisfazione quando quelle idee prendono forma attraverso un cartamodello, un prototipo, un fitting o un capo finito.</p>
        <p><strong>Per me il progetto non termina con un'idea. Comincia proprio da lì.</strong></p>
        <p>Nel mio piccolo laboratorio, che ho ricavato nella mia tana milanese, sviluppo cartamodelli, realizzo prototipi, correggo la vestibilita', confeziono capi e costumi destinati alla scena. E' il luogo in cui ricerca e manualita' convivono ogni giorno e dove ogni intuizione viene messa alla prova fino a diventare qualcosa di reale.</p>
        <p>Ho scelto la libera professione affinche' mi permettesse di attraversare questi mondi senza doverli separare, mantenendo viva la possibilita' di continuare a imparare, sperimentare e contaminare linguaggi diversi.</p>
        <p>Accanto alla progettazione, negli ultimi anni e' nata un'altra parte fondamentale del mio lavoro: l'insegnamento.</p>
        <p>Seguo studenti provenienti da realta' come IED, NABA, Istituto Marangoni e Ferrari Fashion School, accompagnandoli nello sviluppo dei loro progetti, delle tesi e della loro identita' creativa.</p>
        <p>Insegnare, per me, non significa soltanto trasmettere competenze tecniche.</p>
        <p>Significa osservare nuovi punti di vista, confrontarmi ogni giorno con idee fresche, rimanere costantemente aggiornata e aiutare ogni studente a trovare una direzione autentica, senza sostituirmi alla sua voce.</p>
        <p>E' uno scambio continuo.</p>
        <p>Credo profondamente che il design nasca dall'incontro tra ricerca, tecnica e sensibilita'. E forse e' proprio questa la parola che meglio racconta il mio modo di lavorare: incontro.</p>
        <p><strong>L'incontro tra moda e costume.</strong></p>
        <p><strong>Tra l'arte performativa e il prodotto.</strong></p>
        <p><strong>Tra concetto e costruzione.</strong></p>
        <p><strong>Tra immaginazione e realtà.</strong></p>
        <p>Ogni progetto che seguo nasce da questa convinzione: le idee acquistano davvero valore solo quando trovano il modo di prendere forma, senza perdere la loro identita'.</p>
      </section>

      <section class="about-socials page-section" aria-label="Social links">
        <a class="about-social-button" href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Instagram">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm0 2.25a3.5 3.5 0 0 0-3.5 3.5v8.5a3.5 3.5 0 0 0 3.5 3.5h8.5a3.5 3.5 0 0 0 3.5-3.5v-8.5a3.5 3.5 0 0 0-3.5-3.5h-8.5ZM12 7.25A4.75 4.75 0 1 1 12 16.75 4.75 4.75 0 0 1 12 7.25Zm0 2.25A2.5 2.5 0 1 0 12 14.5 2.5 2.5 0 0 0 12 9.5Zm5.15-2.95a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z"/></svg>
        </a>
        <a class="about-social-button" href="https://www.linkedin.com/" target="_blank" rel="noopener" aria-label="LinkedIn">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.37 7.84H2.16V21h3.21V7.84ZM3.77 2A1.87 1.87 0 1 0 3.8 5.74 1.87 1.87 0 0 0 3.77 2Zm17.98 11.72c0-3.53-1.88-5.17-4.38-5.17a3.78 3.78 0 0 0-3.43 1.89h-.04v-1.6h-3.08V21h3.21v-6.02c0-1.59.3-3.13 2.27-3.13 1.95 0 1.98 1.82 1.98 3.23V21h3.21v-7.28h.26Z"/></svg>
        </a>
        <a class="about-social-button" href="https://www.pinterest.com/" target="_blank" rel="noopener" aria-label="Pinterest">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.25 2C6.7 2 3 5.67 3 10.63c0 3.64 2.04 5.7 3.24 5.7.5 0 .78-1.38.78-1.77 0-.47-1.19-1.46-1.19-3.4 0-4.03 3.06-6.89 7.03-6.89 3.41 0 5.94 1.94 5.94 5.5 0 2.66-1.07 7.65-4.52 7.65-1.24 0-2.31-.9-1.99-2.2.38-1.55 1.12-3.22 1.12-4.35 0-2.52-3.58-2.06-3.58 1 0 .64.08 1.34.37 1.92-.53 2.24-1.6 5.57-1.6 7.88 0 .72.1 1.43.17 2.13l.1.04c.14-.2.29-.39.43-.6 1.22-1.68 1.16-2.01 1.73-4.21.31.59 1.13 1.12 2.03 1.12 5.33 0 7.74-5.2 7.74-9.87C20.8 5.9 17.08 2 12.25 2Z"/></svg>
        </a>
      </section>

      <a class="back-link page-back-link about-back-link" routerLink="/home">/ Go back /</a>
    </main>
  `
})
export class AboutPage implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private fadeElements: HTMLElement[] = [];
  private animationFrame = 0;

  private readonly updateVisibility = (): void => {
    cancelAnimationFrame(this.animationFrame);

    this.animationFrame = requestAnimationFrame(() => {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      this.fadeElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < viewportHeight * 0.88 && rect.bottom > viewportHeight * 0.12;
        element.classList.toggle('is-visible', isVisible);
      });
    });
  };

  ngAfterViewInit(): void {
    this.fadeElements = Array.from(
      this.elementRef.nativeElement.querySelectorAll('.about-body p')
    ) as HTMLElement[];

    window.addEventListener('scroll', this.updateVisibility, { passive: true });
    window.addEventListener('resize', this.updateVisibility, { passive: true });

    this.updateVisibility();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.updateVisibility);
    window.removeEventListener('resize', this.updateVisibility);
    cancelAnimationFrame(this.animationFrame);
  }
}

