import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {MatButtonModule} from '@angular/material/button'; 
import {MatTableModule} from '@angular/material/table'; 
import {MatExpansionModule} from '@angular/material/expansion'; 
import {MatDialogModule} from '@angular/material/dialog'; 
const materialModules=[
	MatButtonModule,
  MatTableModule,
  MatExpansionModule,
  MatDialogModule
]

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    materialModules
  ],
  exports:[
  	materialModules
  ]
})
export class MaterialDesignModule { }
