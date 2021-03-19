import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'mytodo';
  todoList: any = [];
  gettingTodosLoading = false;
  constructor(private httpClient: HttpClient) { }

  ngOnInit() {
   this.getTodos();
  }

  getTodos() {
    this.gettingTodosLoading = true;
    this.httpClient.get('/api/gettodo').subscribe((result: any) => {
      console.log("API response", result);
      this.todoList = result;
      this.gettingTodosLoading = false;
    });
  }
}
