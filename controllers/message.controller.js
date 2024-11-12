import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { io } from "../socket/socket.js";
import { setObj, getObj, delObj } from "../utils/redis.js";
import { fMsg, fError } from "../utils/libby.js";
import {
  uploadImageToSupabase,
  uploadDocumentToSupabase,
} from "../utils/supabaseUpload.js";

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message && !req.files.images && !req.files.documents) {
      return fError(res, "Message or files are required", 505);
    }
    const { id: receiverId } = req.params;
    if (!receiverId) {
      return fError(res, "Receiver id is required", 505);
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return fError(res, "Receiver not found", 505);
    }
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    let images = [];
    let documents = [];

    if (req.files && req.files.images) {
      // Check if contentPictures are present
      try {
        for (const file of req.files.images) {
          const imageUrl = await uploadImageToSupabase(file, "chat-images");
          images.push(imageUrl); // Save the URL to the array
        }
      } catch (uploadError) {
        return fError(res, `File upload failed: ${uploadError.message}`, 505);
      }
    } else {
      // console.warn("No images uploaded."); // Log if no images are uploaded
    }

    if (req.files && req.files.documents) {
      // Check if contentPictures are present
      try {
        for (const file of req.files.documents) {
          const documentUrl = await uploadDocumentToSupabase(
            file,
            "chat-documents"
          );
          documents.push(documentUrl); // Save the URL to the array
        }
      } catch (uploadError) {
        return fError(res, `File upload failed: ${uploadError.message}`, 505);
      }
    } else {
      // console.warn("No documents uploaded."); // Log if no documents are uploaded
    }

    const newMessage = new Message({
      senderId: senderId,
      receiverId: receiverId,
      message: message,
      image: images,
      document: documents,
    });

    conversation.messages.push(newMessage._id);

    await Promise.all([conversation.save(), newMessage.save()]);

    // Get receiver's socket ID from Redis
    const receiverSocketId = await getObj(`user_socket:${receiverId}`);

    if (receiverSocketId) {
      // console.log("Emitting to socket:", receiverSocketId);
      io.of("/chat").to(receiverSocketId).emit("newMessage", {
        message: newMessage,
        conversation: conversation._id,
      });
    } else {
      // console.log("Receiver not online, storing offline message");
      const offlineMessages =
        (await getObj(`offline_messages:${receiverId}`)) || [];
      offlineMessages.push({
        message: newMessage,
        conversation: conversation._id,
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
      participants: { $all: [userToChatId, senderId] },
    }).populate("messages");

    if (!conversation) {
      return fMsg(res, "No conversation found", [], 200);
    }

    // Check for any offline messages
    const offlineMessages = await getObj(`offline_messages:${senderId}`);
    if (offlineMessages && offlineMessages.length > 0) {
      // Add offline messages to the conversation
      for (let offlineMessage of offlineMessages) {
        if (
          offlineMessage.conversation.toString() === conversation._id.toString()
        ) {
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
      return res
        .status(403)
        .json({ message: "Not authorized to delete this message" });
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
      return res
        .status(403)
        .json({ message: "Not authorized to edit this message" });
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

export const sendGroupMessage = async(req, res) => {
  try{
    const { message } = req.body;
    if(!message){
      return fError(res, "Message is required", 505)
    }

    const senderId = req.user._id;

    const { classId } = req.params;
    if(!classId){
      return fError(res, "Class Id is required", 505)
    }

    const newMessage = new Message({
      senderId: senderId,
      classId: classId,
      message: message
    });

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, classId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, classId],
      });
    }

    const groupSocketId = await getObj(`class_chat_room:${classId}`);
    if (groupSocketId) {
      // console.log("Emitting to socket:", receiverSocketId);
      io.of("/chat").to(groupSocketId).emit("newMessage", {
        message: newMessage,
        conversation: conversation._id,
      });
    }
    
    fMsg(res, "Message sent successfully", newMessage, 201);

  }catch(error){
    console.error("Error in sendMessage:", error);
    fError(res, "Internal server error", 505);
  }
}
