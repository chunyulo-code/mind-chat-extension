import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getFirestore,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { nanoid } from "https://cdn.jsdelivr.net/npm/nanoid/nanoid.js";

// background.js
const firebaseConfig = {
  apiKey: "AIzaSyBbCc_FxEcg9jnqvASCREn1VAjlCrasdus",
  authDomain: "mindchat-ba82e.firebaseapp.com",
  projectId: "mindchat-ba82e",
  storageBucket: "mindchat-ba82e.appspot.com",
  messagingSenderId: "33301755306",
  appId: "1:33301755306:web:c98ca427062b3eb859a7d3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateContextMenu(userUid) {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      title: "Go to Mind Chat",
      id: "goToMindChat",
      contexts: ["page"]
    });

    chrome.contextMenus.create({
      title: "Add to Mind Chat",
      id: "addToMindChat",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      title: "Add to Mind Chat and go",
      id: "addToMindChatAndGo",
      contexts: ["selection"]
    });

    getAllMaps(userUid);
  });
}

async function getAllMaps(userUid) {
  const allMaps = [];

  const allMapsSnapshot = await getDocs(
    query(collection(db, "users", userUid, "maps"), orderBy("updatedTime"))
  );
  allMapsSnapshot.forEach((doc) =>
    allMaps.push({ mapId: doc.id, mapName: doc.data().mapName })
  );

  allMaps.reverse().forEach((map) => {
    chrome.contextMenus.create({
      title: map.mapName,
      id: `add/${userUid}/${map.mapId}/${nanoid()}`,
      contexts: ["selection"],
      parentId: "addToMindChat"
    });
    chrome.contextMenus.create({
      title: map.mapName,
      id: `addAndGo/${userUid}/${map.mapId}/${nanoid()}`,
      contexts: ["selection"],
      parentId: "addToMindChatAndGo"
    });
  });

  console.log(allMaps);
}

async function addKeyword(userUid, mapToAdd, keywordToAdd) {
  const productionUrl = "https://www.mindchat.me/";
  const developmentUrl = "http://localhost:3000/";
  const url = productionUrl;

  await fetch(`${url}api/library/addKeyword`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userUid: userUid,
      mapToAdd: mapToAdd,
      keywordToAdd: keywordToAdd
    })
  });
}

function contextClick(info, tab) {
  const { menuItemId, selectionText } = info;

  if (menuItemId === "addToMindChat") {
    console.log(selectionText);
  }

  if (menuItemId === "addToMindChatAndGo") {
    console.log(selectionText);
  }

  if (menuItemId === "goToMindChat") {
    chrome.tabs.update(tab.id, { url: "https://www.mindchat.me/map" });
  }

  if (menuItemId.split("/")[0] === "add") {
    const userUid = menuItemId.split("/")[1];
    const mapToAdd = menuItemId.split("/")[2];
    addKeyword(userUid, mapToAdd, selectionText);
  }

  if (menuItemId.split("/")[0] === "addAndGo") {
    const userUid = menuItemId.split("/")[1];
    const mapToAdd = menuItemId.split("/")[2];
    addKeyword(userUid, mapToAdd, selectionText);
    chrome.tabs.update(tab.id, { url: "https://www.mindchat.me/map" });
  }

  updateContextMenu();
}

chrome.identity.getProfileUserInfo(async (userInfo) => {
  const userEmail = userInfo.email;

  let userUid = "";
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", userEmail));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    userUid = querySnapshot.docs[0].id;
    console.log(userUid);
  }

  // updateContextMenu(userUid);

  const unsub = onSnapshot(collection(db, "users", userUid, "maps"), () => {
    updateContextMenu(userUid);
  });
  return () => unsub();
});

chrome.contextMenus.onClicked.addListener(contextClick);
