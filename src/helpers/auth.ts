import { Facebook } from "@ionic-native/facebook";
import { GooglePlus } from "@ionic-native/google-plus";
import { TwitterConnect } from "@ionic-native/twitter-connect";

import firebase from "firebase/app";
import "firebase/auth";

interface IFireEnjinAuthConfig {
  authLocalStorageKey?: string;
  tokenLocalStorageKey?: string;
  firebase?: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
  };
  facebook?: {
    permissions: string[];
  };
  googlePlus?: {
    options: {
      webClientId: string;
      offline: boolean;
    };
  };
}

export class AuthService {
  private config: IFireEnjinAuthConfig = {
    authLocalStorageKey: "enjin:session",
    tokenLocalStorageKey: "enjin:token",
    facebook: {
      permissions: ["email", "public_profile", "user_friends"]
    }
  };
  session: any;
  private facebook: any = Facebook;
  private googlePlus: any = GooglePlus;
  private twitter: any = TwitterConnect;

  constructor(config?: IFireEnjinAuthConfig) {
    let firstRun = false;
    this.config = { ...this.config, ...config };

    if (firebase.apps.length === 0) {
      firebase.initializeApp(config.firebase);
      firstRun = true;
    }

    if (
      !this.config.googlePlus ||
      !this.config.googlePlus.options ||
      !this.config.googlePlus.options.webClientId
    ) {
      console.log(
        "googlePlus.options.webClientId is required for Google Native Auth See Here: https://github.com/EddyVerbruggen/cordova-plugin-googleplus#6-usage"
      );
    }

    if (firstRun) {
      this.onEmailLink(window.location.href);
    }
  }

  async getToken() {
    const currentToken = firebase.auth().currentUser
      ? await firebase.auth().currentUser.getIdToken()
      : localStorage.getItem(this.config.tokenLocalStorageKey);

    await this.setToken(currentToken);

    return currentToken;
  }

  async setToken(token) {
    localStorage.setItem(this.config.tokenLocalStorageKey, token);

    return token;
  }

  async onEmailLink(link) {
    if (firebase.auth().isSignInWithEmailLink(link)) {
      let email = window.localStorage.getItem("emailForSignIn");
      if (!email) {
        email = window.prompt("Please provide your email for confirmation");
      }

      const authUser = await firebase.auth().signInWithEmailLink(email, link);
      window.localStorage.removeItem("emailForSignIn");

      this.emitLoggedInEvent(authUser);

      return authUser;
    }
  }

  createCaptcha(buttonEl: HTMLButtonElement) {
    return new Promise((resolve, reject) => {
      try {
        (window as any).RecaptchaVerifier = new firebase.auth.RecaptchaVerifier(
          buttonEl,
          {
            size: "invisible",
            callback(response) {
              resolve(response);
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  createRecapchaWidget(id: string) {
    (window as any).recaptchaVerifier = new firebase.auth.RecaptchaVerifier(id);
  }

  withGoogleCredential(token) {
    return firebase.auth.GoogleAuthProvider.credential(token);
  }

  withCredential(credential) {
    return firebase.auth().signInWithCredential(credential);
  }

  withPhoneNumber(phoneNumber: string, capId: any) {
    phoneNumber = "+" + phoneNumber;
    window.localStorage.setItem("phoneForSignIn", phoneNumber);

    return firebase.auth().signInWithPhoneNumber(phoneNumber, capId);
  }

  withEmailLink(email: string, actionCodeSettings: any) {
    window.localStorage.setItem("emailForSignIn", email);

    return firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);
  }

  anonymously() {
    return firebase.auth().signInAnonymously();
  }

  onAuthChanged(callback) {
    firebase.auth().onAuthStateChanged(async session => {
      if (
        !session ||
        (!session.emailVerified &&
          session.providerData &&
          session.providerData[0].providerId === "password")
      ) {
        return false;
      }
      if (session) {
        localStorage.setItem(
          this.config.authLocalStorageKey,
          JSON.stringify(session)
        );
        localStorage.setItem(
          this.config.tokenLocalStorageKey,
          await firebase.auth().currentUser.getIdToken(true)
        );
      }
      if (callback && typeof callback === "function") {
        callback(session);
      }
    });

    if (!localStorage.getItem(this.config.authLocalStorageKey)) {
      callback(null);
    }
  }

  getFromStorage() {
    return localStorage.getItem(this.config.authLocalStorageKey)
      ? JSON.parse(localStorage.getItem(this.config.authLocalStorageKey))
      : null;
  }

  isLoggedIn(): any {
    const session = firebase.auth().currentUser;
    if (
      session &&
      session.providerData &&
      session.providerData[0].providerId === "password" &&
      !session.emailVerified
    ) {
      return null;
    }

    return session ? session : this.getFromStorage();
  }

  emitLoggedInEvent(data) {
    document.body.dispatchEvent(
      new CustomEvent("authLoggedIn", { detail: { data } })
    );
  }

  emitLoggedOutEvent() {
    document.body.dispatchEvent(
      new CustomEvent("authLoggedOut", { detail: {} })
    );
  }

  createUser(
    email: string,
    password: string
  ): Promise<firebase.auth.UserCredential> {
    return new Promise((resolve, reject) => {
      try {
        firebase
          .auth()
          .createUserWithEmailAndPassword(email, password)
          .then(data => {
            resolve(data);
          })
          .catch(error => {
            reject(error);
          });
      } catch (e) {
        reject(e);
      }
    });
  }

  sendEmailVerification(options?) {
    return firebase
      .auth()
      .currentUser.sendEmailVerification(options ? options : null);
  }

  sendPasswordReset(emailAddress: string, options?) {
    return firebase
      .auth()
      .sendPasswordResetEmail(emailAddress, options ? options : null);
  }

  withEmail(email: string, password: string) {
    return new Promise((resolve, reject) => {
      try {
        firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then(user => {
            this.emitLoggedInEvent({ user });
            resolve({ data: { user } });
          })
          .catch(error => {
            reject(error);
          });
      } catch (e) {
        reject(e);
      }
    });
  }

  updateEmail(newEmail: string, actionOptions: any) {
    const currentUser = firebase.auth().currentUser;

    return new Promise((resolve, reject) => {
      try {
        currentUser
          .updateEmail(newEmail)
          .then(user => {
            resolve({ data: { user } });
            this.sendEmailVerification(actionOptions);
          })
          .catch(error => {
            reject(error);
          });
      } catch (e) {
        reject(e);
      }
    });
  }

  async facebookNative(): Promise<any> {
    const result = await this.facebook.login(this.config.facebook.permissions);

    return this.withCredential(
      firebase.auth.FacebookAuthProvider.credential(
        result.authResponse.accessToken
      )
    );
  }

  async googleNative(): Promise<any> {
    let result;
    try {
      result = await this.googlePlus.login(this.config.googlePlus.options);
    } catch (error) {
      console.log("Error with Google Native Login...");
      console.log(error);
    }

    return this.withCredential(
      firebase.auth.GoogleAuthProvider.credential(result.idToken)
    );
  }

  async twitterNative(): Promise<any> {
    const result = await this.twitter.login();

    return this.withCredential(
      firebase.auth.TwitterAuthProvider.credential(result.token, result.secret)
    );
  }

  withSocial(network: string, redirect = false): Promise<any> {
    let provider;
    let shouldRedirect = redirect;
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("Running in PWA mode...");
      shouldRedirect = true;
    }

    return new Promise((resolve, reject) => {
      if ((window as any).cordova) {
        if (network === "google") {
          this.googleNative()
            .then((result: any) => {
              this.emitLoggedInEvent(result);
              resolve(result);
            })
            .catch(error => {
              console.log(error);
              reject(error);
            });
        } else if (network === "facebook") {
          this.facebookNative()
            .then((result: any) => {
              this.emitLoggedInEvent(result);
              resolve(result);
            })
            .catch(error => {
              console.log(error);
              reject(error);
            });
        } else if (network === "twitter") {
          this.twitterNative()
            .then(result => {
              this.emitLoggedInEvent(result);
              resolve(result);
            })
            .catch(error => {
              console.log(error);
              reject(error);
            });
        }
      } else {
        if (network === "facebook") {
          provider = new firebase.auth.FacebookAuthProvider();
        } else if (network === "google") {
          provider = new firebase.auth.GoogleAuthProvider();
        } else if (network === "twitter") {
          provider = new firebase.auth.TwitterAuthProvider();
        } else {
          reject({
            message:
              "A social network is required or the one provided is not yet supported."
          });
        }
        const authService: any = firebase.auth();
        authService[shouldRedirect ? "signInWithRedirect" : "signInWithPopup"](
          provider
        )
          .then(data => {
            this.emitLoggedInEvent(data);
            resolve(data);
          })
          .catch(error => {
            reject(error);
          });
      }
    });
  }

  logout() {
    this.emitLoggedOutEvent();

    return firebase.auth().signOut();
  }

  async updatePassword(newPassword: string, credential) {
    const user = firebase.auth().currentUser;
    if (credential) {
      await user.reauthenticateWithCredential(credential);
    }

    return user.updatePassword(newPassword);
  }
}
