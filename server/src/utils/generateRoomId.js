import { randomBytes } from "crypto";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ROOM_ID_LENGTH = 8;

export const generateRoomId = () => {
  const bytes = randomBytes(ROOM_ID_LENGTH);
  return Array.from(bytes)
    .map((b) => CHARS[b % CHARS.length])
    .join("");
};
