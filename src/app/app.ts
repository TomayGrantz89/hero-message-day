import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopBarComponent } from './components/top-bar/top-bar';
import { BottomBarComponent } from './components/bottom-bar/bottom-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, TopBarComponent, BottomBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
}
