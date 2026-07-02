import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Attempt } from '../../services/attempt';
import { Premium } from '../../services/premium';

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question.html',
  styleUrl: './question.scss'
})
export class Question implements OnInit {
  answers: string[] = [
    'Да, безусловно',
    'Сейчас не лучшее время',
    'Звезды говорят да',
    'Маловероятно',
    'Попробуй позже',
    'Абсолютно нет',
    'Вероятно, да',
    'Спроси еще раз',
    'Знаки указывают на нет',
    'Да, но будь осторожен',
    'Не сейчас',
    'Вселенная говорит да',
    'Шансы малы',
    'Определенно да',
    'Лучше не стоит'
  ];

  currentAnswer: string = '';
  showAnswer: boolean = false;
  isPremium: boolean = false;
  remainingQuestions: number = 0;
  maxQuestions: number = 0;
  hasAttempt: boolean = false;

  /** Default banner text, replaced after asking */
  bannerText: string = 'Сформулируй свой вопрос, на который можно ответить «Да» или «Нет», и нажми на кнопку';

  constructor(
    private attempt: Attempt,
    private premium: Premium
  ) {}

  ngOnInit(): void {
    this.isPremium = this.premium.isPremium();
    this.maxQuestions = this.isPremium ? 5 : 1;
    this.updateRemainingQuestions();
  }

  updateRemainingQuestions(): void {
    // Используем систему попыток для вопросов
    const remainingAttempts = this.attempt.getRemainingQuestionAttempts();
    this.remainingQuestions = remainingAttempts;
    this.hasAttempt = this.remainingQuestions > 0;
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

    // Update banner text immediately with the answer
    this.bannerText = `Ответ оракула: ${this.currentAnswer}`;

    // Запускаем анимацию через небольшую задержку
    setTimeout(() => {
      this.showAnswer = true;
    }, 300);
  }

  purchasePremium(): void {
    // Simulate purchase
    this.premium.activatePremium();
    this.isPremium = true;
    this.maxQuestions = 5;
    // Refresh question attempts to premium maximum (5)
    this.attempt.refreshQuestionAttempts();
    this.updateRemainingQuestions();
    alert('Премиум-доступ активирован! Теперь вы можете задавать 5 вопросов в день.');
  }

  resetQuestion(): void {
    this.showAnswer = false;
    this.currentAnswer = '';
    this.bannerText = 'Сформулируй свой вопрос, на который можно ответить «Да» или «Нет», и нажми на кнопку';
  }
}
