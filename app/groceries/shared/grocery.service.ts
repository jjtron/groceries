import { Injectable, NgZone } from "@angular/core";
import { Http, Headers, Response, ResponseOptions } from "@angular/http";
import { Observable, BehaviorSubject } from "rxjs/Rx";
import "rxjs/add/operator/map";
let Sqlite = require("nativescript-sqlite");
const uuid = require('uuid-js');
import * as fs from "file-system";
import { Grocery } from "./grocery.model";

@Injectable()
export class GroceryService {

    public items: BehaviorSubject<Array<Grocery>> = new BehaviorSubject([]);
    private allItems: Array<Grocery> = [];
    private database: any;

    constructor(private http: Http, private zone: NgZone) {}

    private loadOldStuff() {
        return new Promise((resolve, reject) => {
            let documents: any = fs.knownFolders.currentApp();
            let jsonFile: any = documents.getFile('shared/resources/sa.json');
            let jsonData: any;
            
            jsonFile.readText()
                .then((content) => {
                    try {
                        jsonData = JSON.parse(content);
                        this.deleteAll().then(() => {
                            jsonData.forEach((item) => {
                                this.insert(item, '');
                            });
                            resolve();
                        });
                    } catch (err) {
                        reject();
                        throw new Error('Could not parse JSON file');
                    }
                });
        });
    }

    public load(): any {
        return this.setUpDb().then(() => {
            return this.checkForData();
        })
        .then(
            () => {
                this.fetch()
                    .then((data) => {
                        return this.setUpData(data);
                    });
            },
            () => {
                this.loadOldStuff()
                    .then(() => {
                        return this.fetch()
                    })
                    .then((data) => {
                        return this.setUpData(data);
                    });
            }    
        );
    }

    public add(name: string) {
        return this.insert(name, '*').then(() => {
            return this.fetch();
        })
        .then((data) => {
            this.allItems = [];
            return this.setUpData(data);
        });
    }

    public setDeleteFlag(item: Grocery) {
        return this.update(item.id, true, false, false).then(() => {
            return this.fetch();
        })
        .then((data) => {
            this.allItems = [];
            return this.setUpData(data);
        });
    }

    public toggleGetTodayFlag(item: Grocery) {
        item.getToday = !item.getToday;
        return this.update(item.id, false, item.done, item.getToday).then(() => {
            return this.fetch();
        })
        .then((data) => {
            this.allItems = [];
            return this.setUpData(data);
        });
    }

    public toggleDoneFlag(item: Grocery) {
        item.done = !item.done;
        return this.update(item.id, false, item.done, item.getToday).then(() => {
            return this.fetch();
        })
        .then((data) => {
            this.allItems = [];
            return this.setUpData(data);
        });
    }

    public permanentlyDelete(item: Grocery) {
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

    private handleErrors(error: Response) {
        console.log(error);
        return Observable.throw(error);
    }

    private sortGroceries() {
        this.allItems.sort(function(a, b) {
            return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
        });
    }

    public restore(item: Grocery) {
        return this.update(item.id, false, false, false).then(() => {
            return this.fetch();
        })
        .then((data) => {
            this.allItems = [];
            return this.setUpData(data);
        });
    }

    private insert(groceryName: string, createdate: string) {
        return new Promise((resolve, reject) => {
            let id = uuid.create();
            this.database.execSQL(
                "INSERT INTO groceries (Name, Deleted, Done, getToday, Id, createdate) VALUES (?, ?, ?, ?, ?, ?)",
                [groceryName, false, false, false, id, createdate]
            )
            .then(() => {
                resolve(true);
            }, error => {
                console.log("INSERT ERROR", error);
                reject(false);
            });
        });
    }

    private update(groceryId: string, deleted: boolean, done: boolean, getToday: boolean) {
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

    private deleteItem(groceryId: string) {
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

    private deleteAll() {
        return new Promise((resolve, reject) => {
            let id = uuid.create();
            this.database.execSQL("DELETE FROM groceries").then(id => {
                resolve(true);
            }, error => {
                console.log("UPDATE ERROR", error);
                reject(false);
            });
        });
    }

    private checkForData () {
        let p = new Promise((resolve, reject) => {
            this.database.all("SELECT * FROM groceries").then(rows => {
                if (rows.length > 0) {
                    resolve();
                } else {
                    reject();
                }
            }, error => {
                console.log("SELECT ERROR", error);
            });
        });
        return p;
    }

    private fetch(): any {
        let p = new Promise((resolve, reject) => {
            this.database.all("SELECT * FROM groceries").then(rows => {
                resolve(rows);
            }, error => {
                console.log("SELECT ERROR", error);
            });
        });
        return p;
    }

    private setUpData(rows: any): any {
        let p = new Promise((resolve, reject) => {
            rows.forEach((grocery) => {
                this.allItems.push(
                    new Grocery(
                        grocery[4],
                        grocery[0],
                        (grocery[2] === 'true') ? true : false,
                        (grocery[1] === 'true') ? true : false,
                        (grocery[3] === 'true') ? true : false,
                        grocery[5]
                    )
                );
            });
            this.sortGroceries();
            this.publishUpdates();
            resolve(true);
        });
        return p;
    }

    private setUpDb() {
        return new Promise((resolve, reject) => {
            if (!this.database) {
                (new Sqlite("my.db")).then(db => {
                    db.execSQL(`CREATE TABLE IF NOT EXISTS groceries (
                        Name TEXT,
                        Deleted BOOLEAN,
                        Done BOOLEAN,
                        getToday BOOLEAN,
                        Id TEXT,
                        createdate TEXT)`
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