import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import { io } from '../socket/socket.js';
import { setObj, getObj, delObj } from '../utils/redis.js';
import { fMsg, fError } from '../utils/libby.js';

export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;
       

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });
        
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
        }

        const newMessage = new Message({
            senderId: senderId,
            receiverId: receiverId,
            message: message,
        });

        conversation.messages.push(newMessage._id);
        
        await Promise.all([conversation.save(), newMessage.save()]);

        // Get receiver's socket ID from Redis
        const receiverSocketId = await getObj(`user_socket:${receiverId}`);

        if (receiverSocketId) {
            // console.log("Emitting to socket:", receiverSocketId);
            io.of("/chat").to(receiverSocketId).emit("newMessage", {
                message: newMessage,
                conversation: conversation._id
            });
        } else {
            // console.log("Receiver not online, storing offline message");
            const offlineMessages = await getObj(`offline_messages:${receiverId}`) || [];
            offlineMessages.push({
                message: newMessage,
                conversation: conversation._id
            });
            await setObj(`offline_messages:${receiverId}`, offlineMessages);
        }

        fMsg(res, "Message sent successfully", newMessage, 201);

    } catch (error) {
        console.error("Error in sendMessage:", error);
        fError(res, "Internal server error", 505);
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user._id;

        let conversation = await Conversation.findOne({
            participants: { $all: [userToChatId, senderId] }
        }).populate("messages");

        if (!conversation) {
            return fMsg(res, "No conversation found", [], 200);
        }

        // Check for any offline messages
        const offlineMessages = await getObj(`offline_messages:${senderId}`);
        if (offlineMessages && offlineMessages.length > 0) {
            // Add offline messages to the conversation
            for (let offlineMessage of offlineMessages) {
                if (offlineMessage.conversation.toString() === conversation._id.toString()) {
                    conversation.messages.push(offlineMessage.message);
                }
            }
            // Clear offline messages for this conversation
            await delObj(`offline_messages:${senderId}`);
        }

        // Sort messages by timestamp
        conversation.messages.sort((a, b) => a.createdAt - b.createdAt);

        fMsg(res, "Messages fetched successfully", conversation.messages, 200);
    } catch (error) {
        console.error("Error in getMessages:", error);
        fError(res, "Internal server error", 505);
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this message" });
        }

        await Message.findByIdAndDelete(messageId);

        // Remove message from conversation
        await Conversation.updateOne(
            { messages: messageId },
            { $pull: { messages: messageId } }
        );

        res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error("Error in deleteMessage:", error);
        fError(res, "Internal server error", 505);
    }
};

export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { newContent } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to edit this message" });
        }

        message.message = newContent;
        message.edited = true;
        await message.save();

        res.status(200).json(message);
    } catch (error) {
        console.error("Error in editMessage:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};