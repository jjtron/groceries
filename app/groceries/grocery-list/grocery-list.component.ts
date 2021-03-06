import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from "@angular/core";
import * as utils from "utils/utils";

import { Grocery, GroceryService } from "../shared";
import { alert } from "../../shared";

declare var UIColor: any;

@Component({
  selector: "gr-grocery-list",
  moduleId: module.id,
  templateUrl: "./grocery-list.component.html",
  styleUrls: ["./grocery-list.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroceryListComponent {
  @Input() showDeleted: boolean;
  @Input() row;
  @Input() storeName;
  @Input() todaysPicks;
  @Output() loading = new EventEmitter();
  @Output() loaded = new EventEmitter();

  listLoaded = false;

  constructor(private store: GroceryService) { }

  load() {
    this.loading.next("");
    this.store.load()
    .then(
        () => {
          this.loaded.next("");
          this.listLoaded = true;
        },
        () => {
          alert("An error occurred loading your grocery list.");
        });
  }

  // The following trick makes the background color of each cell
  // in the UITableView transparent as it’s created.
  makeBackgroundTransparent(args) {
    let cell = args.ios;
    if (cell) {
      // support XCode 8
      cell.backgroundColor = utils.ios.getter(UIColor, UIColor.clearColor);
    }
  }

  imageSource(grocery) {
    if (grocery.deleted) {
      return grocery.done ? "res://selected" : "res://nonselected";
    }
    return grocery.done ? "res://checked" : "res://unchecked";
  }
    
  getToday(grocery) {
    return grocery.getToday ? "res://checked" : "res://unchecked";
  }

  toggleGetToday(grocery: Grocery) {
    this.store.toggleGetTodayFlag(grocery)
      .then(
        () => { },
        () => {
          alert("An error occurred managing your grocery list.");
        }
      );
  }

  toggleDone(grocery: Grocery) {
    if (grocery.deleted) {
      grocery.deleted = false;
      this.store.restore(grocery).then(
        () => { },
        () => {
          alert("An error occurred managing your grocery list.");
        }
      );
      return;
    }

    this.store.toggleDoneFlag(grocery)
      .then(
        () => { },
        () => {
          alert("An error occurred managing your grocery list.");
        }
      );
  }

  delete(grocery: Grocery) {
    this.loading.next("");
    let successHandler = () => this.loaded.next("");
    let errorHandler = () => {
      alert("An error occurred while deleting an item from your list.");
      this.loaded.next("");
    };

    if (grocery.deleted) {
      this.store.permanentlyDelete(grocery).then(() => {
          successHandler();
      })
      .catch(() => {}); // TODO
        
    } else {
      this.store.setDeleteFlag(grocery).then(() => {
          successHandler();   
      })
      .catch(() => {}); // TODO
    }
  }
}
