import { Component } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { CreateTodoComponent } from "./create-todo/create-todo.component";
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
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

  constructor(private httpClient: HttpClient, public dialog: MatDialog) {}

  ngOnInit() {
    this.getTodos();
  }
  openDialog() {
    const dialogRef = this.dialog.open(CreateTodoComponent);
    dialogRef.afterClosed().subscribe((result) => {
      this.getTodos();
    });
  }


  getTodos() {
    this.gettingTodosLoading = true;
    this.httpClient.get(`${this.apiUrl}gettodo`).subscribe(
      (result: any) => {
        console.log("API response", result);
        if (result.status == 200) {
          this.todoList = result["data"];
        } else if (result.status == 401) {
          this.isUnAuthorized = true;
        } else {
          this.isInternalServerError = true;
        }
        this.gettingTodosLoading = false;
      },
      (error) => {
        console.log("Error", error);
        this.errorRedirected = true;
        this.gettingTodosLoading = false;
      }
    );
  }
  

  isValidPasscode(passcode: any, event: any) {
    // console.log("In this", event);
    event.stopPropagation();
    if (passcode == 8352 || passcode == "8352") {
      console.log("Wow password is correct");
      this.httpClient.get("/api/releaseip").subscribe(
        (result: any) => {
          if (result.status == 200) {
            window.location.reload();
          } else {
            console.log("Errors while releasing IP");
          }
        },
        (error) => {
          console.log("Error", error);
          this.errorRedirected = true;
          this.gettingTodosLoading = false;
        }
      );
    } else {
      console.log("In correct password");
    }
  }
}
