import firebase from "firebase/app";
import "firebase/firestore";

export class DatabaseService {
  service: any;
  watchers: any = {};

  constructor() {
    this.service = firebase.firestore();
    this.service
      .enablePersistence()
      .then(() => {
        console.log("Offline data enabled!");
      })
      .catch(error => {
        console.log(error.message);
      });
  }

  async all(collectionName: string): Promise<any> {
    const collection = await this.get(collectionName);
    const data = {};

    await collection.forEach(doc => {
      data[doc.id] = doc.data();
    });

    return data;
  }

  async list(
    collectionName: string,
    options?: {
      orderBy?: any;
      limit?: number;
    }
  ) {
    let collectionRef = this.collection(collectionName);
    const data = [];

    if (options && options.orderBy) {
      options.orderBy.map(order => {
        const isNegative: boolean = order.charAt(0) === "-";
        collectionRef = collectionRef.orderBy(
          isNegative ? order.substr(1) : order,
          isNegative ? "desc" : "asc"
        );
      });
    }
    if (options && options.limit) {
      collectionRef = collectionRef.limit(options.limit);
    }

    const collection = await collectionRef.get();

    await collection.forEach(doc => {
      data.push({ ...doc.data(), id: doc.id });
    });

    return data;
  }

  async add(collectionName: string, data: any, id?: number | string) {
    let document = await this.collection(collectionName);
    document = id ? document.doc(id) : document.doc();

    return document.set(data);
  }

  collection(collectionName: string) {
    return this.service.collection(collectionName);
  }

  get(collectionName: string) {
    return this.collection(collectionName).get();
  }

  document(collectionName: string, id: string) {
    return this.collection(collectionName).doc(id);
  }

  getDocument(collectionName: string, id: string) {
    return this.document(collectionName, id).get();
  }

  async find(collectionName: string, id: string) {
    const document = await this.getDocument(collectionName, id);

    return { ...document.data(), id: document.id };
  }

  async update(collectionName: string, id: string, data: any) {
    const document = this.document(collectionName, id);
    await document.set(data, { merge: true });
    const newDocument = await document.get();

    return newDocument.data();
  }

  async clearWatchers() {
    for (const watcherKey of Object.keys(this.watchers)) {
      this.watchers[watcherKey]();
    }

    return true;
  }

  watchDocument(collectionName: string, id: string, callback) {
    this.watchers[`${collectionName}:${id}`] = this.document(
      collectionName,
      id
    ).onSnapshot(async doc => {
      if (callback && typeof callback === "function") {
        callback({ data: doc.data() });
      }
    });
  }

  unwatchDocument(collectionName: string, id: string) {
    const watcherName = `${collectionName}:${id}`;
    if (
      this.watchers[watcherName] &&
      typeof this.watchers[watcherName] === "function"
    ) {
      this.watchers[watcherName]();

      return true;
    } else {
      console.log(`There is no watcher running on ${watcherName} document.`);

      return false;
    }
  }
}
