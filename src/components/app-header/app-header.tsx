import { Component, ComponentInterface, Element, Prop, h } from "@stencil/core";

@Component({
  tag: "app-header",
  styleUrl: "app-header.css"
})
export class AppHeader implements ComponentInterface {
  ionMenu: HTMLIonMenuElement;
  hasTitleSlot: boolean;
  hasEndSlot: boolean;
  hasStartSlot: boolean;

  @Element() hostElement: HTMLElement;

  @Prop() pageTitle: string;

  componentWillLoad() {
    this.hasEndSlot = !!this.hostElement.querySelector('[slot="end"]');
    this.hasStartSlot = !!this.hostElement.querySelector('[slot="start"]');
    this.hasTitleSlot = !!this.hostElement.querySelector('[slot="title"]');
  }

  componentDidLoad() {
    this.ionMenu = document.querySelector("ion-menu");
  }

  toggleMenu(event: UIEvent) {
    event.preventDefault();
    this.ionMenu.toggle();
  }

  render() {
    return (
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            {this.hasStartSlot ? (
              <slot name="start" />
            ) : (
              <ion-button
                fill="clear"
                class="menu-button"
                onClick={(event: UIEvent) => this.toggleMenu(event)}
              >
                <ion-icon name="menu" />
              </ion-button>
            )}
          </ion-buttons>
          <ion-title>
            {this.hasTitleSlot ? (
              <slot name="title" />
            ) : this.pageTitle ? (
              this.pageTitle
            ) : (
              <img src="/assets/images/TrackMyGiving-Light.svg" />
            )}
          </ion-title>
          <ion-buttons
            class={{
              "custom-buttons": this.hasEndSlot
            }}
            slot="end"
          >
            <slot name="end" />
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
    );
  }
}
