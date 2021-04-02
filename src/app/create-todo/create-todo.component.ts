import { Component, OnInit, Inject } from "@angular/core";
import { FormControl } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import {
  MatDialog,
  MatDialogRef, 
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";

@Component({
  selector: "app-create-todo",
  templateUrl: "./create-todo.component.html",
  styleUrls: ["./create-todo.component.css"],
})
export class CreateTodoComponent implements OnInit {
  title = "mytodo";
  todoList: any = [];
  gettingTodosLoading = false;
  isUnAuthorized = false;
  isInternalServerError = false;
  errorRedirected = false;
  apiUrl = "/api/";

  // Form elemnts
  passcode = new FormControl("");
  todoName = new FormControl("");
  todoDescription = new FormControl("");

  // Errors Object
  customErrors = {
    error: "",
    status: "",
    show: false,
  };

  constructor(
    private httpClient: HttpClient,
    public dialogRef: MatDialogRef<CreateTodoComponent>
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {}

  addNewTodo() {
    console.log(`${this.todoName.value} and ${this.todoDescription.value}`);
    if (
      (this.todoName && this.todoName.value == "") ||
      (this.todoDescription && this.todoDescription.value == "")
    ) {
      this.customErrors.error = "Fill all the required fields";
      this.customErrors.show = true;
      this.customErrors.status = "429";
    } else {
      this.customErrors = {
        error: "",
        status: "",
        show: false,
      };
      console.log("In else");
      let requestObj = {
        name: this.todoName.value,
        description: this.todoDescription.value,
        date: Date.now(),
      };
      this.httpClient.post(`${this.apiUrl}addtodo`, requestObj).subscribe(
        (response: any) => {
          if (response.status == 200) {
            this.customErrors = {
              error: "Successfully Inserted a task",
              status: response.status,
              show: true,
            };
            setTimeout(() => {
              this.dialogRef.close();
            }, 1000);
          } else {
            this.customErrors = {
              error: response.message,
              status: response.status,
              show: true,
            };
          }
        },
        (error) => {
          console.log("Error", error);
          this.errorRedirected = true;
          this.gettingTodosLoading = false;
        }
      );
    }
  }
}
