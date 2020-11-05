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
  tag: "app-profile",
  styleUrl: "app-profile.css"
})
export class AppProfile implements ComponentInterface {
  @Prop() auth: AuthService;
  @Prop() db: DatabaseService;

  @State() session: firebase.default.User;

  async logout() {
    if (!confirm("Are you sure you want to logout?")) return;
    await this.db.clearWatchers();
    localStorage.clear();
    await this.auth.logout();
    await document.querySelector("ion-router").push("/");
  }

  componentWillLoad() {
    if (Build.isBrowser) {
      this.session = this.auth.isLoggedIn();
    }
  }

  render() {
    return [
      <app-header pageTitle="Your Profile">
        <ion-button
          color="danger"
          slot="end"
          fill="solid"
          shape="round"
          onClick={() => this.logout()}
        >
          Logout
          <ion-icon slot="end" name="power" />
        </ion-button>
      </app-header>,
      <ion-content class="ion-padding">
        Your Profile
      </ion-content>
    ];
  }
}
