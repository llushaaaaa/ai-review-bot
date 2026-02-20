import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bad-example',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bad-example.component.html',
  styleUrls: ['./bad-example.component.scss']
})
export class BadExampleComponent implements OnInit {
  // ❌ Старый синтаксис @Input вместо input()
  @Input() userId: string = '';
  @Input() data: any; // ❌ any тип
  
  // ❌ Старый синтаксис @Output вместо output()
  @Output() userSelected = new EventEmitter<any>();
  
  // ❌ @ViewChild вместо viewChild()
  @ViewChild('container') container!: ElementRef;
  
  // ❌ Обычная переменная вместо signal
  users: any[] = [];
  isLoading = false;
  
  // ❌ Хардкод API ключа
  private apiKey = 'sk-1234567890abcdef';
  
  // ❌ Constructor DI вместо inject()
  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    // ❌ Подписка без отписки - утечка памяти
    this.http.get('https://api.example.com/users').subscribe(data => {
      this.users = data as any[];
    });
    
    // ❌ Nested subscribe - антипаттерн
    this.http.get('/api/config').subscribe(config => {
      this.http.get('/api/data').subscribe(data => {
        console.log(data);
      });
    });
  }
  
  // ❌ Метод напрямую меняет DOM
  updateDOM() {
    document.getElementById('myElement')!.innerHTML = '<script>alert("xss")</script>';
  }
  
  selectUser(user: any) {
    this.userSelected.emit(user);
  }
}
