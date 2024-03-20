import { Room, User } from "./Models"
export {}

// Events emitted by the server to the client
export interface ServerToClientEvents {
    hello: () => void;
    chatMsg: (msg: ChatMessageData) => void;
    userhasJoined: (username: string, timestamp: number) => void; 
    userhasDisconnected: (username: string, timestamp: number) => void; 
    onlineUsers: (users: User[]) => void;
    sendRoomList: (rooms: Room[]) => void; 
    sendLatestChat: (msg: ChatMessageDatafromRoom[]) => void;
    // callback: (sucess: boolean) => void) => void;

}

// Events emitted by the client to the server
export interface ClientToServerEvents {
    getRoomList: (callback: (rooms: Room[]) => void) => void;
    sendChatMsg: (msg: ChatMessageData) => void;
    userJoinReq: (username: string, room: string, callback: (response: UserJoinResponse) => void) => void;
}

// Hade kunnat göra en payload för userhasJoined som hade sett ut så här
// export interface UserJoinedData
// username: string
// timestamp: number
// och sätta den på userhasJoined i ServertoClient (payload: UserJoinedData)

// Message payload
export interface ChatMessageData {
    content: string;
    username: string;
    timestamp: number;
    room: string;
}

export interface ChatMessageDatafromRoom {
    id: string;
    content: string;
    roomId: string;
    timestamp: number;
    username: string;
}

//Room with users
export interface RoomwithUser extends Room{
    users: User[];
}

//Userjoinresponse
export interface UserJoinResponse {
    success: boolean;
    roomInfo: RoomwithUser | null;
}