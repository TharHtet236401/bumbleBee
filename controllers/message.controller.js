import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import { fMsg, fError } from "../utils/libby.js";

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    //check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      //create new conversation
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({ senderId, receiverId, message });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    //save both conversation and message parallelly
    await Promise.all([conversation.save(), newMessage.save()]);

    fMsg(res, "Message sent successfully", { newMessage }, 200);
  } catch (error) {
    fError(res, error.message, 500);
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate("messages");

    if (!conversation) return fError(res, "Conversation not found", 404);

    fMsg(res, "Messages fetched successfully", { conversation }, 200);
  } catch (error) {
    fError(res, error.message, 500);
  }
};
