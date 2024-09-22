import { invoke } from "@tauri-apps/api/core";
import { fetch } from "@tauri-apps/plugin-http";
import { Store } from "@tauri-apps/plugin-store";

async function pingStatusDot(endpoint: string) {
  const forwardDot = document.getElementById('forwardDot') as HTMLSpanElement
  const backDot = document.getElementById('backDot') as HTMLSpanElement
  backDot.classList.add('animate-ping');

  fetch(endpoint)
    .then(response => {
      if (response.ok) {
        // Server is up, pulse the status dot
        forwardDot.classList.remove('bg-gray-500');
        forwardDot.classList.remove('bg-red-500');
        forwardDot.classList.add('bg-green-500');
        backDot.classList.remove('bg-gray-400');
        backDot.classList.remove('bg-red-400');
        backDot.classList.add('bg-green-400');
        setTimeout(() => {
          backDot.classList.remove('animate-ping');
        }, 600); // Remove the pulse after interval
      } else {
        // Server is down, set the status dot to red
        forwardDot.classList.remove('bg-gray-500');
        forwardDot.classList.remove('bg-green-500');
        forwardDot.classList.add('bg-red-500');
        backDot.classList.remove('bg-gray-400');
        backDot.classList.remove('bg-green-400');
        backDot.classList.add('bg-red-400');
        setTimeout(() => {
          backDot.classList.remove('animate-ping');
        }, 600); // Remove the pulse after interval
      }
    })
    .catch(_error => {
      // Error occurred, assume server is down
      forwardDot.classList.remove('bg-gray-500');
      forwardDot.classList.remove('bg-green-500');
      forwardDot.classList.add('bg-red-500');
      backDot.classList.remove('bg-gray-400');
      backDot.classList.remove('bg-green-400');
      backDot.classList.add('bg-red-400');
      setTimeout(() => {
        backDot.classList.remove('animate-ping');
      }, 600); // Remove the pulse after interval
    });
}

function initUpdateAvatarPlaceHolder() {
  const usernameInput = document.getElementById('usernameInput') as HTMLInputElement;
  const avatarPlaceholder = document.getElementById('avatarLetter') as HTMLSpanElement;

  usernameInput.addEventListener("input", () => {
    const username = usernameInput.value.trim();
    if (username.length > 0) {
      const words = username.split(" ");
      const initials = words.slice(0, 2).map(word => word[0]).join(''); // Takes the first letter of two words
      avatarPlaceholder.textContent = initials.toUpperCase();
    } else {
      avatarPlaceholder.textContent = '';
    }
  })
}

function initMediaPreview() {
  const mediaInput = document.getElementById("mediaInput") as HTMLInputElement;
  const mediaPreview = document.getElementById("mediaPreview") as HTMLImageElement;

  const messageTopInput = document.getElementById("messageTopInput") as HTMLInputElement;
  const messageBottomInput = document.getElementById("messageBottomInput") as HTMLInputElement;

  const topMessage = document.getElementById("topMessage") as HTMLSpanElement;
  const bottomMessage = document.getElementById("bottomMessage") as HTMLSpanElement;

  const sendMediaButton = document.getElementById("sendMediaButton") as HTMLButtonElement;
  sendMediaButton.classList.add("btn-disabled");

  mediaInput.addEventListener("change", () => {
    mediaPreview.style.display = "block";
    const file = mediaInput!.files![0];
    if (file) {
      mediaPreview.src = URL.createObjectURL(file);
      mediaPreview.addEventListener("load", () => {
        URL.revokeObjectURL(mediaPreview.src);
      })

      sendMediaButton.classList.remove("btn-disabled");
    }
  })

  messageTopInput.addEventListener("input", () => {
    topMessage.textContent = messageTopInput.value;
  });

  messageBottomInput.addEventListener("input", () => {
    bottomMessage.textContent = messageBottomInput.value;
  });
}

function getServerDomain(): string {
  const serverInput = document.getElementById("serverInput") as HTMLInputElement;
  const url = serverInput.value;

  let urlParts = url.split('://');
  let strippedUrl = urlParts.length > 1 ? urlParts[1] : urlParts[0];
  if (strippedUrl.endsWith('/')) {
    strippedUrl = strippedUrl.slice(0, -1); // Remove trailing slash
  }

  return strippedUrl
}

function initServerToggle() {
  let connected = false;
  const serverToggle = document.getElementById("serverToggle") as HTMLButtonElement;

  serverToggle.addEventListener("click", async () => {
    if (!connected) {
      let domain = getServerDomain()
      await invoke("connect_to_server", { domain }).then(() => {
        console.log("pitie")
        serverToggle.textContent= "Disconnect"
        connected = true;
      })
    }
    else {
      await invoke("disconnect_from_server").then(() => {
        serverToggle.textContent = "Connect"
        connected = false;
      })
    }
  })
}

function initPingStatus(){
  const endpoint = "https://" + getServerDomain() + "/healthcheck";
  pingStatusDot(endpoint)
  setInterval(() => {
    const endpoint = "https://" + getServerDomain() + "/healthcheck";
    pingStatusDot(endpoint)
  }, 3000)
}

async function restoreStoreValues(store: Store){
  const usernameInput = document.getElementById("usernameInput") as HTMLInputElement;
  const serverInput = document.getElementById("serverInput") as HTMLInputElement;

  const username = await store.get<string>('username');
  const url= await store.get<string>('url');

  if(username){
    usernameInput.value = username;
  }

  if(url){
    serverInput.value = url;
  }
}

function initStoredValues(store: Store){
  const usernameInput = document.getElementById("usernameInput") as HTMLInputElement;
  const serverInput = document.getElementById("serverInput") as HTMLInputElement;

  usernameInput.addEventListener("change", async () => {
    await store.set("username", usernameInput.value);
    await store.save();
  })

  serverInput.addEventListener("change", async () => {
    await store.set("url", serverInput.value);
    await store.save();
  })
}

window.addEventListener("DOMContentLoaded", async () => {
  const store = new Store('store.bin');
  restoreStoreValues(store);
  initPingStatus();
  initUpdateAvatarPlaceHolder();
  initMediaPreview();
  initServerToggle();
  initStoredValues(store);
});
