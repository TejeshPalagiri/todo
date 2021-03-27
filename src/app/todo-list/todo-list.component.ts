import { Component, ViewChild,OnInit, Input} from '@angular/core';
import { HttpClient } from "@angular/common/http";


@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css']
})

export class TodoListComponent implements OnInit {
  title = "mytodo";
  gettingTodosLoading = false;
  isUnAuthorized = false;
  isInternalServerError = false;
  errorRedirected = false;
  apiUrl = "/api/";
  panelOpenState = false;
  step = -1;

  @Input() todoList: any = [];


  constructor(private httpClient: HttpClient) {}
  
  ngOnInit() {
  }

  setStep(index: number) {
    this.step = index;
  }

}