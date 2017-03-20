import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { groceriesRouting } from "./groceries.routing";
import { GroceriesComponent } from "./groceries.component";
import { GroceryListComponent } from "./grocery-list/grocery-list.component";
import { ItemStatusPipe } from "./grocery-list/item-status.pipe";
import { StorePipe, PrefixPipe, GetTodayPipe } from "./grocery-list/store-pipe.pipe";

@NgModule({
  imports: [
    NativeScriptModule,
    NativeScriptFormsModule,
    groceriesRouting
  ],
  declarations: [
    GroceriesComponent,
    GroceryListComponent,
    ItemStatusPipe,
    StorePipe,
    PrefixPipe,
    GetTodayPipe
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class GroceriesModule {}
