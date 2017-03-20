import { Injectable, NgZone } from "@angular/core";
import { Http, Headers, Response, ResponseOptions } from "@angular/http";
import { Observable, BehaviorSubject } from "rxjs/Rx";
import "rxjs/add/operator/map";
let Sqlite = require("nativescript-sqlite");
const uuid = require('uuid-js');

import { BackendService } from "../../shared";
import { Grocery } from "./grocery.model";

@Injectable()
export class GroceryService {
    items: BehaviorSubject<Array<Grocery>> = new BehaviorSubject([]);

    private allItems: Array<Grocery> = [];
    private todaysPicks: string[] = [];
    private database: any;

    constructor(private http: Http, private zone: NgZone) { }

    loadOldStuff() {
        let headers = this.getHeaders();
        headers.append("X-Everlive-Sort", JSON.stringify({ ModifiedAt: -1 }));

        return this.http.get(BackendService.apiUrl + "Groceries", {
            headers: headers
        })
            .map(res => res.json())
            .map(data => {
                let oldData = [];
                data.Result.forEach((grocery) => {
                    oldData.push(
                        new Grocery(
                            grocery.Id,
                            grocery.Name,
                            grocery.Done || false,
                            grocery.Deleted || false,
                            grocery.getToday || false
                        )
                    );
                });
                oldData.forEach((item) => {
                    this.insert(item.name);
                });
            })
            .catch(this.handleErrors);
    }

    load(): any {
        return this.setUpDb().then(() => {
            return this.fetch();
        })
        .then((data) => {
            return this.setUpData(data);
        });
    }

    add(name: string) {
        return this.insert(name).then(() => {
            return this.fetch();
        })
        .then((data) => {
            this.allItems = [];
            return this.setUpData(data);
        });
    }

    setDeleteFlag(item: Grocery) {
        return this.update(item.id, true, false, false).then(() => {
            return this.fetch();
        })
        .then((data) => {
            this.allItems = [];
            return this.setUpData(data);
        });
    }

    toggleGetTodayFlag(item: Grocery) {
        item.getToday = !item.getToday;
        return this.update(item.id, false, item.done, item.getToday).then(() => {
            return this.fetch();
        })
        .then((data) => {
            this.allItems = [];
            return this.setUpData(data);
        });
    }

    toggleDoneFlag(item: Grocery) {
        item.done = !item.done;
        return this.update(item.id, false, item.done, item.getToday).then(() => {
            return this.fetch();
        })
        .then((data) => {
            this.allItems = [];
            return this.setUpData(data);
        });
    }

    permanentlyDelete(item: Grocery) {
        return this.deleteItem(item.id).then(() => {
            return this.fetch();
        })
        .then((data) => {
            this.allItems = [];
            return this.setUpData(data);
        });
    }

    private publishUpdates() {
        // Make sure all updates are published inside NgZone so that change detection is triggered if needed
        this.zone.run(() => {
            // must emit a *new* value (immutability!)
            this.items.next([...this.allItems]);
        });
    }

    private getHeaders() {
        let headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("Authorization", "Bearer " + BackendService.token);
        return headers;
    }

    private handleErrors(error: Response) {
        console.log(error);
        return Observable.throw(error);
    }

    private sortGroceries() {
        this.allItems.sort(function(a, b) {
            return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
        });
    }

    restore(item: Grocery) {
        return this.update(item.id, false, false, false).then(() => {
            return this.fetch();
        })
        .then((data) => {
            this.allItems = [];
            return this.setUpData(data);
        });
    }

    insert(groceryName: string) {
        return new Promise((resolve, reject) => {
            let id = uuid.create();
            this.database.execSQL("INSERT INTO groceries (Name, Deleted, Done, getToday, Id) VALUES (?, ?, ?, ?, ?)", [groceryName, false, false, false, id]).then(id => {
                resolve(true);
            }, error => {
                console.log("INSERT ERROR", error);
                reject(false);
            });
        });
    }

    update(groceryId: string, deleted: boolean, done: boolean, getToday: boolean) {
        return new Promise((resolve, reject) => {
            let id = uuid.create();
            this.database.execSQL("UPDATE groceries SET Deleted = ?, Done = ?, getToday = ? WHERE Id = ?", [deleted, done, getToday, groceryId]).then(id => {
                resolve(true);
            }, error => {
                console.log("UPDATE ERROR", error);
                reject(false);
            });
        });
    }

    deleteItem(groceryId: string) {
        return new Promise((resolve, reject) => {
            let id = uuid.create();
            this.database.execSQL("DELETE FROM groceries WHERE Id = ?", [groceryId]).then(id => {
                resolve(true);
            }, error => {
                console.log("UPDATE ERROR", error);
                reject(false);
            });
        });
    }

    fetch(): any {
        let p = new Promise((resolve, reject) => {
            this.database.all("SELECT * FROM groceries").then(rows => {
                resolve(rows);
            }, error => {
                console.log("SELECT ERROR", error);
            });
        });
        return p;
    }

    setUpData(rows: any): any {
        let p = new Promise((resolve, reject) => {
            rows.forEach((grocery) => {
                this.allItems.push(
                    new Grocery(
                        grocery[4],
                        grocery[0],
                        (grocery[2] === 'true') ? true : false,
                        (grocery[1] === 'true') ? true : false,
                        (grocery[3] === 'true') ? true : false
                    )
                );
            });
            this.sortGroceries();
            this.publishUpdates();
            resolve(true);
        });
        return p;
    }

    setUpDb() {
        return new Promise((resolve, reject) => {
            if (!this.database) {
                (new Sqlite("my.db")).then(db => {
                    db.execSQL(`CREATE TABLE IF NOT EXISTS groceries (
                        Name TEXT,
                        Deleted BOOLEAN,
                        Done BOOLEAN,
                        getToday BOOLEAN,
                        Id TEXT)`
                    ).then(
                        () => {
                            this.database = db;
                            resolve(true);
                        }, error => {
                            console.log("CREATE TABLE ERROR", error);
                        });
                }, error => {
                    console.log("OPEN DB ERROR", error);
                });
            } else {
                resolve(true);
            }
        });
    }
}