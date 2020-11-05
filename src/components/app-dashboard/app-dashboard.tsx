import {
  Component,
  ComponentInterface,
  Prop,
  State,
  h,
  Build
} from "@stencil/core";

import { AuthService } from "../../helpers/auth";
import { DatabaseService } from "../../helpers/database";

@Component({
  tag: "app-dashboard",
  styleUrl: "app-dashboard.css"
})
export class AppDashboard implements ComponentInterface {
  @Prop() auth: AuthService;
  @Prop() db: DatabaseService;

  @State() session: firebase.default.User;

  componentWillLoad() {
    if (Build.isBrowser) {
      this.session = this.auth.isLoggedIn();
    }
  }

  render() {
    return [
      <app-header pageTitle="Your Dashboard"></app-header>,
      <ion-content class="ion-padding">
        Your Dashboard
      </ion-content>
    ];
  }
}
