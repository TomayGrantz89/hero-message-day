import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Attempt } from '../../services/attempt';
import { Premium } from '../../services/premium';

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question.html',
  styleUrl: './question.scss'
})
export class Question implements OnInit, OnDestroy {
  answers: string[] = [
    'Сейчас не лучшее время',
    'Твоя дорога ведет тебя к чему-то гораздо более прекрасному, оставь это',
    'Да, но будь осторожен',
    'Да, но ступай по этой тропе не спеша',
    'Всему свой час, отпусти эту суету до следующего рассвета',
    'Тропа скрыта туманом, поищи другой, более светлый путь',
    'Нет, пока эта дверь закрыта для твоей же безопасности',
    'Пока ответ скрыт в тени, но грядущий рассвет принесет долгожданную ясность',
    'Твое сердце дает верный ответ, доверься этому легкому чувству',
    'Этот путь безопасен, если ты ступишь на него с легким сердцем и без обид'
  ];

  currentAnswer: string = '';
  showAnswer: boolean = false;
  isPremium: boolean = false;
  remainingQuestions: number = 0;
  hasAttempt: boolean = false;
  timer: string = '00:00:00';
  private timerInterval: any;

  /** Last answer received, persisted so it stays visible when attempts run out */
  lastAnswer: string = '';
  private readonly LAST_ANSWER_KEY = 'cardGameLastQuestionAnswer';

  /** Default banner text, replaced after asking */
  bannerText: string = 'Загадай вопрос, на который можно ответить «Да» или «Нет»';

  private premiumSubscription: Subscription | null = null;

  constructor(
    private attempt: Attempt,
    private premium: Premium
  ) {}

  ngOnInit(): void {
    this.isPremium = this.premium.isPremium();

    // Load persisted last answer (kept visible when attempts run out)
    this.lastAnswer = localStorage.getItem(this.LAST_ANSWER_KEY) || '';

    // Update attempts first so a refreshed day clears the stale answer
    this.updateRemainingQuestions();
    this.startTimer();

    // Reactively update when premium is purchased from another component (e.g., bottom-bar shop)
    this.premiumSubscription = this.premium.premiumStatus$.subscribe(isPremium => {
      this.isPremium = isPremium;
      if (isPremium) {
        // Grant full question attempts for premium user
        this.attempt.refreshQuestionAttempts();
      }
      this.updateRemainingQuestions();
    });
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.premiumSubscription) {
      this.premiumSubscription.unsubscribe();
    }
  }

  /**
   * Whether to show the timer block instead of the ask button.
   * True when user is not premium and has 0 attempts remaining.
   */
  get showTimer(): boolean {
    return !this.isPremium && this.remainingQuestions <= 0;
  }

  updateRemainingQuestions(): void {
    // Используем систему попыток для вопросов
    const remainingAttempts = this.attempt.getRemainingQuestionAttempts();
    this.remainingQuestions = remainingAttempts;
    this.hasAttempt = this.remainingQuestions > 0;

    // When attempts refresh (new day / premium), clear the persisted last answer
    if (this.hasAttempt && this.lastAnswer) {
      this.clearLastAnswer();
    }
  }

  private startTimer(): void {
    this.updateTimer();
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  private updateTimer(): void {
    this.timer = this.attempt.getTimeUntilNextReset();

    // Re-check attempts on each tick — handles midnight transition
    const currentAttempts = this.attempt.getRemainingQuestionAttempts();
    if (currentAttempts !== this.remainingQuestions) {
      this.remainingQuestions = currentAttempts;
      this.hasAttempt = this.remainingQuestions > 0;

      // When attempts refresh (new day), clear the persisted last answer
      if (this.hasAttempt && this.lastAnswer) {
        this.clearLastAnswer();
      }
    }
  }

  getRandomAnswer(): string {
    const randomIndex = Math.floor(Math.random() * this.answers.length);
    return this.answers[randomIndex];
  }

  askQuestion(): void {
    if (!this.hasAttempt) {
      alert('У вас не осталось вопросов на сегодня. Вернитесь завтра!');
      return;
    }

    // Используем попытку для вопросов
    const success = this.attempt.useQuestionAttempt();
    if (!success) {
      alert('Не удалось использовать попытку. Попробуйте позже.');
      return;
    }

    // Обновляем оставшиеся вопросы
    this.updateRemainingQuestions();

    // Генерируем случайный ответ
    this.currentAnswer = this.getRandomAnswer();
    this.showAnswer = false;

    // Persist the answer so it stays visible when attempts run out
    this.lastAnswer = this.currentAnswer;
    localStorage.setItem(this.LAST_ANSWER_KEY, this.lastAnswer);

    // Запускаем анимацию через небольшую задержку
    setTimeout(() => {
      this.showAnswer = true;
    }, 300);
  }

  /** Clear the persisted last answer (called when attempts refresh) */
  private clearLastAnswer(): void {
    this.lastAnswer = '';
    localStorage.removeItem(this.LAST_ANSWER_KEY);
  }

  purchasePremium(): void {
    // Simulate purchase
    this.premium.activatePremium();
    this.isPremium = true;
    // Refresh question attempts for premium user (unlimited)
    this.attempt.refreshQuestionAttempts();
    this.updateRemainingQuestions();
    alert('Премиум-доступ активирован! Теперь у вас неограниченное количество вопросов к оракулу.');
  }

  resetQuestion(): void {
    this.showAnswer = false;
    this.currentAnswer = '';
    this.clearLastAnswer();
    this.bannerText = 'Сформулируй свой вопрос, на который можно ответить «Да» или «Нет», и нажми на кнопку';
  }
}
