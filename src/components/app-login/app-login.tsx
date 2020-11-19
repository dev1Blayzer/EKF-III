import { User } from "@dev1blayzer/eatkidfriendly-backend";
import { Sdk } from "@dev1blayzer/eatkidfriendly-backend/dist/sdk";
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
  @Prop() sdk: Sdk;

  @State() error: string;
  @State() user: Partial<User>;

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

  

  async componentDidLoad(){
    const {user} = await this.sdk.findUser({userId:"428jhJDdCyVmd6KjH1Np"});
    this.user = user;
  }

  render() {
    return [
      <app-header pageTitle="Login to FireEnjin"></app-header>,
      <ion-content class="ion-padding">
        <ion-card>
          {this.error && <ion-label color="danger">{this.error}</ion-label>}
          <ion-button color="dark">
            <ion-icon slot="start" name="logo-github" />
    <ion-label>{this.user?.given_name}, Sign-in With Github</ion-label>
          </ion-button>
          <my-component></my-component>
        </ion-card>
      </ion-content>
    ];
  }
}
