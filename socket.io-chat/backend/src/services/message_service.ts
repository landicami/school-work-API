import { ChatMessageData } from "@shared/types/SocketTypes";
import prisma from "../prisma";

export const createMessage = (msg: ChatMessageData) => {
	return prisma.message.create({
		data: {
			content: msg.content,
			username: msg.username,
			timestamp: msg.timestamp,
			roomId: msg.room
		}
	})
}

export const getMessages = (roomId: string) => {
	const now = Date.now()
	const calc = 20 * 60 * 60 * 1000; // 86400000
	const past = now - calc;


	return prisma.message.findMany({
		where: {
			timestamp: {
				gte: past

			},
			roomId,
		},
		take: -5,


	})
}
