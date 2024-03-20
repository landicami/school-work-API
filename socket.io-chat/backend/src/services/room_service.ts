import prisma from "../prisma";

export const getRooms = () => {
	return prisma.room.findMany();
};

export const getAroom = (roomId: string) => {
	return prisma.room.findUnique({
		where: {
		id: roomId
		}
	})
}
