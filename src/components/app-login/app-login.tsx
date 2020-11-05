import {
  Component,
  ComponentInterface,
  h,
  Prop,
  State
} from "@stencil/core";

import { AuthService } from "../../helpers/auth";

@Component({
  tag: "app-login",
  styleUrl: "app-login.css"
})
export class AppLogin implements ComponentInterface {
  @Prop() auth: AuthService;
  @Prop() config: any = {};

  @State() error: string;

  async login(type: string) {
    let res;
    try {
      res = await this.auth.withSocial(type);
      if (res?.user?.uid || res?.data?.user) {
        const routerEl = document.querySelector("ion-router");
        routerEl.push("dashboard");
      }
    } catch (error) {
      this.error = error.message;
    }
  }

  render() {
    return [
      <app-header pageTitle="Login to FireEnjin"></app-header>,
      <ion-content class="ion-padding">
        <ion-card>
          {this.error && <ion-label color="danger">{this.error}</ion-label>}
          <ion-button color="dark">
            <ion-icon slot="start" name="logo-github" />
            <ion-label>Sign-in With Github</ion-label>
          </ion-button>
          <my-component></my-component>
        </ion-card>
      </ion-content>
    ];
  }
}
