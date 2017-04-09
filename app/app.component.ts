/// <reference path="../node_modules/tns-platform-declarations/android.d.ts" />
import { Component } from "@angular/core";
import app = require("application");

@Component({
  selector: "gr-main",
  template: "<page-router-outlet></page-router-outlet>"
})
export class AppComponent {

    constructor () {
        var androidApp = app.android;
        let activity = androidApp.startActivity;
        activity.setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
    }
}
