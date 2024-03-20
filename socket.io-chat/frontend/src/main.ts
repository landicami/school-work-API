import { io } from "socket.io-client"; //client
import "./assets/scss/style.scss";
import { ChatMessageData, ClientToServerEvents, ServerToClientEvents, UserJoinResponse } from "@shared/types/SocketTypes";
import { Socket } from "socket.io-client";
import { User } from "@shared/types/Models";

const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;

//chat elements
const messageEl = document.querySelector("#message") as HTMLInputElement;
const messageFormEl = document.querySelector("#message-form") as HTMLFormElement;
const messagesEl = document.querySelector("#messages") as HTMLUListElement;

//start elements
const usernameFormEl = document.querySelector("#username-form") as HTMLFormElement;
const usernameInputEl = document.querySelector("#username") as HTMLInputElement;

//views
const chatView = document.querySelector("#chat-wrapper") as HTMLDivElement;
const startView = document.querySelector("#start") as HTMLDivElement;

const connectBtnEl = document.querySelector("#connectBtn") as HTMLButtonElement;
const roomsEl = document.querySelector("#room") as HTMLSelectElement;


//Userdetails avsaknad av värde när vi startar upp
let username: string | null = null;
let room: string | null = null;


// connect to socket.io server
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST);

//show chatview
const showChat = () => {
    chatView.classList.remove("hide");
    startView.classList.add("hide");
}

// Show welcome/"start" view
const showWelcomeView = () => {
	//referenser 


	connectBtnEl.disabled = true;
	roomsEl.innerHTML = `<option value="" selected>Loading...</option>`;

    // Request a list of rooms from the server
    socket.on("sendRoomList", (rooms) => {
		// Skapa en HTML-sträng med alla rum som alternativ
		const roomOptions = rooms.map(room => `<option value="${room.id}">${room.name}</option>`).join('');

		// Tilldela HTML-strängen till innerHTML för roomsEl
		roomsEl.innerHTML = roomOptions;
		connectBtnEl.disabled= false;
		console.log("got rooms", roomOptions);
	})

	// Once we get them, populate the dropdown with rooms

	// After that, enable the Connect button
	console.log("🏨 Requesting rooms");
	socket.emit("getRoomList", (rooms) => {
		// We gots lots of rooms
		console.log("YAY ROOMS!", rooms);
	});
	chatView.classList.add("hide");
	startView.classList.remove("hide");
}
// listen when established
socket.on("connect", () => {
    showWelcomeView();
    console.log("Connected to the server from front end", socket.id);
});

//listen when disconnected when server is off
socket.on("disconnect", () => {
    console.log("Disconnected to the server from front end", socket.id, room);
});

socket.on("userhasDisconnected", (username, timestamp) => {
    addNoticetoChat(`${username} disconnected`, timestamp)
})

//listen for reconnection(either due to our or the servers connection)
socket.io.on("reconnect", () => {
    console.log("Reconnected.")
    //emot userjoinreq but only if we were in the chat
    if(username && room){
        socket.emit("userJoinReq", username, room, (success) => {
            addNoticetoChat("You're reconnected", Date.now());

            console.log("join was successfull", success);
            if(!success) {
                alert("No access 4 thou");
                return;
            }
            showChat();

    }
)}
});

//listen for when servers says hello from controller
socket.on("hello", () => {
    console.log("Listened on hello, got it");
});

// a function that adds a message to the ul
const addMessageToChat = (msg: ChatMessageData, isMine: boolean) => {
    const newChatMsg = document.createElement("li");
    // get human readable time
    const time = new Date(msg.timestamp).toLocaleTimeString();
    newChatMsg.innerHTML = `
    <span class="user">${msg.username}</span>
    <span class="content">${msg.content}</span>
    <span class="time">${time}</span>
    `;
    newChatMsg.classList.add("message");
    if(isMine){ //kolla om meddelandet är från mig
        newChatMsg.classList.add("own-message");
        newChatMsg.innerHTML = `
        <span class="content">${msg.content}</span>
        <span class="time">${time}</span>
        `;
    }
    messagesEl.appendChild(newChatMsg);

    newChatMsg.scrollIntoView({ behavior: "smooth"});
};

//listen for new chat MSG from 
socket.on("chatMsg", (msg) => {
    console.log("Back from socket_controller", msg);

    //create a function addMessageToChat that takews the msg object as a parameter and creates a new Li element
    //meddelandet är inte från mig
    addMessageToChat(msg, false);

});

socket.on("onlineUsers", (users) => {
    onlineUserFunction(users);

});


// get username from form and then show chat
usernameFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const trimmedUsername = usernameInputEl.value.trim();
  
    username = trimmedUsername;
	room = roomsEl.value;
	console.log("Username", username, "Room", room);
    if(!trimmedUsername || !room){
        return;
    };

    //emit UserJoinReq event to server and wait for acknowledgement before showing chat view
    socket.emit("userJoinReq", username, room, (response: UserJoinResponse) => {
        console.log("join was successfull", response);
        if(!response.success || !response.roomInfo) {
            alert("No access 4 thou");
            return;
        }
        //Update chatview title with room.info
        const chattitleEl = document.querySelector("#chat-title") as HTMLHeadingElement;
        chattitleEl.innerText = response.roomInfo.name;
        showChat();
        console.log("Emitted 'userJoinRequest' event to server", username, room);
        onlineUserFunction(response.roomInfo.users);
        messageEl.focus(); // fokus på inputfältet
        socket.on("sendLatestChat", (messages) => {
            const oldMessages = messages.map(message => 
                `<li class="message">
                    <span class="user">${message.username}</span>
                    <span class="content">${message.content}</span>
                    <span class="time">${new Date(message.timestamp).toLocaleTimeString()}</span>
                </li>
            `).
            join("");
            messagesEl.innerHTML = oldMessages;
        })
    })


});
//function of showing onlineusers in ul list
const onlineUserFunction = (users: User[]) => {
    // Skapa en lista med användarnamnen från response.roomInfo.users
    const loggedinUserList = document.querySelector("#online-users") as HTMLUListElement;
    const loggedinUser = users.map(user =>
        user.id === socket.id // om användaren är jag, gör det här
        ? `<li class="me">${user.username} <i class="fa-solid fa-skull" style="color: #B197FC;"></i></li>`
        : `<li>${user.username}<i class="fa-solid fa-circle-user"></i></li>`).join("");
    loggedinUserList.innerHTML = loggedinUser;
}



// function for adding the info in the DOM
const addNoticetoChat = (msg: string, timestamp: number) => {
    const newLi = document.createElement("li");
    newLi.classList.add("notice");
    const time = new Date(timestamp).toLocaleTimeString();

    newLi.innerHTML = `
            <span class="content">${msg}</span>
			<span class="time">${time}</span>`;
    messagesEl.appendChild(newLi);
    newLi.scrollIntoView({ behavior: "smooth"});
}

//listen for a server to tell that a user has joined and take username and timestamp as parameters
socket.on("userhasJoined", (username, timestamp) => {
    addNoticetoChat(`${username} has joined the chatroom`, timestamp);
})


//send a message to the server when form is submit
messageFormEl.addEventListener("submit", (e) => {
    e.preventDefault();

    if(!messageEl.value.trim()){
        return;
    } // om meddelande tomt skicka inte

    //construct message payload
    const msg: ChatMessageData = {
        content: messageEl.value.trim(),
        username: usernameInputEl.value.trim(),
        timestamp: Date.now(),
		room: roomsEl.value
    };

    socket.emit("sendChatMsg", msg);
    addMessageToChat(msg, true);
    //meddelandet är från mig

    console.log("Jag skrev", msg);
    messageEl.value = ""; //töm fältet when submitted
    messageEl.focus(); // fokus på inputfältet
   
})

function slumpaTal() {
    // Generera ett slumpmässigt decimaltal mellan 0 (inklusive) och 1 (exklusive)
    const slumpTal = Math.random();

    // Skala om det slumpmässiga talet till intervallet 1-25 och avrunda neråt till närmaste heltal
    const slumpatHeltal = Math.floor(slumpTal * 25) + 1;

    return slumpatHeltal;
}

// Använda funktionen för att generera ett slumpat heltal mellan 1 och 25
const slumpatNummer = slumpaTal();
console.log(slumpatNummer);