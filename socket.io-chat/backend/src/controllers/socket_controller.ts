/**
 * Socket Controller
 */
import { ClientToServerEvents, ServerToClientEvents } from "@shared/types/SocketTypes";
import Debug from "debug";
import { Server, Socket } from "socket.io";
import prisma from "../prisma";
import { createUser, deleteUser, getAUser, getUsersInRoom } from "../services/user_service";
import { getAroom, getRooms } from "../services/room_service";
import { createMessage, getMessages } from "../services/message_service";
// Create a new debug instance
const debug = Debug("chat:socket_controller");

//Handle the user connecting och sätt socket till datatypren Socket
export const handleConnection = (socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>) => {
	debug("A user connected, info from controller", socket.id);

	//say hello to the user
	socket.emit("hello");
	debug("Said hello to user from controller", socket.id);

	//handle user disconnecting när användaren kopplar ner sig
	socket.on("disconnect", async () => {
		debug("A user disconnected, info from controller", socket.id);
		// Find user in order to know which room he/she was in
		const user = await getAUser(socket.id);

		// If user didn't exist, do nothing
		if(!user){
			return;
		}
		//io.to
		socket.broadcast.to(user.roomId).emit("userhasDisconnected", user.username, Date.now());
		debug(`This is what goes in userHasdisconnetected: ${user.username} disconnected from ${user.roomId}`);

		await deleteUser(socket.id);

		const usersInAroom = await getUsersInRoom(user.roomId);
		socket.broadcast.to(user.roomId).emit("onlineUsers", usersInAroom) // broadcast list of online users when a new user exist the room
		debug("This is users in a room after disconnect", usersInAroom)


	});

	// listen for incoming chat message
	socket.on("sendChatMsg", async (msg) => {
		// Broadcast message to everyone connected EXCEPT the sender
		// Mind the two different messages depending on server to client and client to server types
		socket.broadcast.to(msg.room).emit("chatMsg", msg);
		//skicka meddelandet före vi sparar ner pga delay för användare
		const message = await createMessage(msg);

		debug("this message is created", message);

	});

	//listen for a user join request
	socket.on("userJoinReq", async (username, room, callback) => {
		debug("User %s wants to join the chat", username, room);
		// Broadcast message to everyone connected EXCEPT the sender
		// Get room from database
		const roomfromMongo = await getAroom(room);
		debug("this is room from mongo", roomfromMongo);

		// If room was not found, respond with success=false
		if (!roomfromMongo) {
			callback({
				success: false,
				roomInfo: null,
			});
			return;
		}

		// Join room `roomId`
		socket.join(room);

		//create a user in the database and set roomId
		await createUser({
			id: socket.id,
			username: username,
			roomId: room
		});

		//retrieve a list of users for the room

		const usersInAroom = await getUsersInRoom(room);
		// debug("List of users in room %s (%s): %O", roomfromMongo.name, room, usersInAroom);

		// (here we could also check the username and deny access if it was already in use)
		callback({
			success: true,
			roomInfo: {
				id: roomfromMongo.id,
				name: roomfromMongo.name,
				users: usersInAroom
			},
		});

		const messages = await getMessages(room);
		debug("The Messages from the room is", messages)
		io.to(room).emit("sendLatestChat", messages);


		socket.join(room);
		// let everyone in the room know shit
		io.to(room).emit("userhasJoined", username, Date.now());
		// socket.broadcast.emit("userhasJoined", username, room, Date.now());
		socket.broadcast.to(room).emit("onlineUsers", usersInAroom) // broadcast list of online users when a new user joins the room
		debug("users in a room is", usersInAroom)

	})

	//listen for rooms
	socket.on("getRoomList", async (rooms) => {
		try {
			const rooms = await getRooms(); // här kan vi ta order by: ["name"]
			socket.emit("sendRoomList", rooms)
			debug("this the rooms", rooms);
		} catch (error) {
			debug("Error fetching room list:", error);
		}
});

}
