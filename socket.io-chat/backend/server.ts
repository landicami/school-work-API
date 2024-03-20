import app from "./src/app";
import http from "http";
import * as dotenv from "dotenv";
import { Server } from "socket.io";
import { handleConnection } from "./src/controllers/socket_controller";
import { ClientToServerEvents,
		ServerToClientEvents
		} from "@shared/types/SocketTypes";
import { deleteAllUsers } from "./src/services/user_service";
import { instrument } from "@socket.io/admin-ui";

// Initialize dotenv so it reads our `.env`-file
dotenv.config();

// Read port to start server on from `.env`, otherwise default to port 3000
const PORT = process.env.PORT || 3000;

/**
 * Create HTTP server and socket.io server
 */
const httpServer = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
	cors: {
		origin: [
			"http://localhost:5173",
			"https://admin.socket.io",
		],
		credentials: true,
	}
});
/**
 * Set up Socket.IO Admin (if we have a password)
 */
if (process.env.SOCKET_ADMIN_PSWD) {
	console.log("👨🏻‍💻 Setting up Socket.IO Admin");
	instrument(io, {
		auth: {
			type: "basic",
			username: "admin",
			password: process.env.SOCKET_ADMIN_PSWD
		}
	});
}

/**
 * När någon kopplar upp sig vill vi skriva en console.log
 */
io.on("connection", (socket) => {
	//Someone connected 2 me from controller
	handleConnection(socket, io);
})

/**
 * Delete all users
 */

deleteAllUsers()
.then(()=> {
	console.log("🧹 Deleted all the users");
		/**
 		* Listen on provided port, on all network interfaces.
		*/
		httpServer.listen(PORT);
})
.catch((err => {
	console.error("Could not delete all users");
}))


/**
 * Event listener for HTTP server "error" event.
 */
httpServer.on("error", (err: NodeJS.ErrnoException) => {
	if (err.syscall !== "listen") {
		throw err;
	}

	switch (err.code) {
		case "EACCES":
			console.error(`🦸🏻 Port ${PORT} requires elevated privileges`);
			process.exit(1);
			break;
		case "EADDRINUSE":
			console.error(`🛑 Port ${PORT} is already in use in another of your fifty thousand terminals 😜`);
			process.exit(1);
			break;
		default:
			throw err;
	}
});

/**
 * Event listener for HTTP server "listening" event.
 */
httpServer.on("listening", () => {
	console.log(`🚀 Yay, server started on http://localhost:${PORT}`);
});
