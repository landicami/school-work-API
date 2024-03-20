import { User } from "@shared/types/Models";
import prisma from "../prisma";

/**
 * Get users currently online in a room
 * @param roomId id of room
 * @returns
 */
export const getUsersInRoom = (roomId: string) => {
	return prisma.user.findMany({
			where: {
				roomId,
			},
			orderBy: {
				username: "asc"
			}
		});
};

/**
 * Delete all the users
 *
 */
export const deleteAllUsers = () => {
	return prisma.user.deleteMany();
}


export const getAUser = (userId: string) => {
	return prisma.user.findUnique({
		where: {
			id: userId
		}
	})
}


export const createUser = (data: User) => {
	return prisma.user.create({
		data,
	})
}

export const deleteUser = (userId: string) => {
	return prisma.user.delete({
	where: {
		id: userId,
	},
})}
