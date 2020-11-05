import { ComponentInterface, Build, Component, Listen, h } from "@stencil/core";
import { GraphQLClient } from "graphql-request";
import "@madnesslabs/fireenjin-components";
import { getSdk, Sdk } from "@madnesslabs/fireenjin-backend/dist/sdk";

import env from "../../helpers/env";
import { AuthService } from "../../helpers/auth";
import { DatabaseService } from "../../helpers/database";

const onBeforeEnter = async () => {
  console.log("before enter");
  return true;
};

const onBeforeLeave = async () => {
  console.log("before leave");
  return true;
};

@Component({
  tag: "app-root",
  styleUrl: "app-root.css"
})
export class AppRoot implements ComponentInterface {
  sharePopover: HTMLIonPopoverElement;
  routerEl: HTMLIonRouterElement;
  config = env();
  client = Build.isBrowser ? new GraphQLClient(this.config.graphql.url) : null;
  sdk = Build.isBrowser ? getSdk(this.client) : null;
  isCordova = window && (window as any).cordova ? true : false;
  modal: HTMLIonModalElement;
  auth = Build.isBrowser
    ? new AuthService({
        ...this.config
      })
    : null;
  db = new DatabaseService();
  session: firebase.default.User;
  defaultProps: {
    auth: AuthService;
    config: any;
    client: GraphQLClient;
    db: DatabaseService;
    sdk: Sdk;
  } = {
    auth: this.auth,
    config: this.config,
    client: this.client,
    db: this.db,
    sdk: this.sdk
  };

  @Listen("ionRouteDidChange")
  onRouteDidChange(event) {
    let stopLoader = true;
    if (!Build.isBrowser) {
      return false;
    }
    try {
      const session = this.auth.isLoggedIn();
      if (session && ["/"].indexOf(event.detail.to) >= 0) {
        stopLoader = false;
        this.routerEl.push("/dashboard");
      }
      if (!session && ["/dashboard"].indexOf(event.detail.to) >= 0) {
        stopLoader = false;
        this.routerEl.push("/");
      }
    } catch (err) {
      console.log(err.message);
    }

    if (stopLoader) {
      document.querySelector("app-root").classList.add("is-loaded");
    }
  }

  async componentWillLoad() {
    if (Build.isBrowser) {
      // const FireEnjinLib = await (window as any).FireEnjin.init({
      //   host: this.config.graphql.url,
      //   token: await this.auth.getToken(),
      //   functionsHost: this.config.functions.url,
      //   onError: err => {
      //     console.log(err);
      //   }
      // });
      // this.defaultProps.client = FireEnjinLib.client;
      // this.defaultProps.sdk = FireEnjinLib.sdk;

      this.session = this.auth.isLoggedIn();
      this.auth.onAuthChanged((session: firebase.default.User) => {
        if (session && session.uid) {
          // (window as any).FireEnjin.setHeader(
          //   "Authorization",
          //   `Bearer ${(session as any)._lat}`
          // );
          this.session = session;
          this.db.watchDocument("users", session.uid, async snapshot => {
            if (!snapshot.data.isRegistered && !this.modal) {
              if (location.pathname !== "/dashboard") {
                await this.routerEl.push("/dashboard");
              }
            }
          });
        }
      });
    }
  }

  render() {
    return (
      <ion-app>
          <ion-router
            ref={el => (this.routerEl = el)}
            useHash={
              this.isCordova &&
              (window as any).Ionic.platforms.indexOf("android") === -1
            }
          >
            {this.isCordova && <ion-route-redirect from="/" to="/login" />}
            {this.isCordova && (
              <ion-route-redirect from="/index.html" to="/login" />
            )}
            <ion-route
              url="/"
              component="app-login"
              componentProps={this.defaultProps}
              beforeLeave={onBeforeLeave}
              beforeEnter={onBeforeEnter}
            />
            <ion-route
              url="/login"
              component="app-login"
              componentProps={this.defaultProps}
              beforeLeave={onBeforeLeave}
              beforeEnter={onBeforeEnter}
            />
            <ion-route
              url="/dashboard"
              component="app-dashboard"
              componentProps={this.defaultProps}
              beforeLeave={onBeforeLeave}
              beforeEnter={onBeforeEnter}
            />
            <ion-route
              url="/profile"
              component="app-profile"
              componentProps={this.defaultProps}
              beforeLeave={onBeforeLeave}
              beforeEnter={onBeforeEnter}
            />
          </ion-router>
          <ion-nav id="app-content" />
      </ion-app>
    );
  }
}
