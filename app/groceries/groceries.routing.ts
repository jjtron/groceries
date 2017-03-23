import { ModuleWithProviders }  from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { GroceriesComponent } from "./groceries.component";

const groceriesRoutes: Routes = [
  { path: "groceries", component: GroceriesComponent },
];
export const groceriesRouting: ModuleWithProviders = RouterModule.forChild(groceriesRoutes);