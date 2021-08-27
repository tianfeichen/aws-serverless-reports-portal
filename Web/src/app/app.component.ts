import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isInIframe: boolean = false;

  constructor() { }

  ngOnInit() {
    this.isInIframe = this.isCrossOriginFrame();
  }

  // Checks if the app is embedded in an iframe
  private isCrossOriginFrame() {
    try {
      return (!window.top.location.hostname);
    } catch (e) {
      return true;
    }
  }
}
