import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import { fMsg ,fError} from "../utils/libby.js";

export const getConversations = async (req, res) => {
    try {
        const currentUser = req.user._id;
        const conversations = await Conversation.find({
            participants: { $in: [currentUser] },
        }).populate("participants");
``
        // Transform the conversations to remove the current user from participants
        //as we only need the other user to show in the conversation list
        const transformedConversations = conversations.map(conversation => {
            const { messages, ...rest } = conversation.toObject();
            return {
                ...rest,
                participants: conversation.participants.filter(participant => participant._id.toString() !== currentUser.toString())
            };
        });

        fMsg(res, "Conversation fetched successfully", transformedConversations, 200);
    } catch (error) {
        fError(res, error.message, 500);
    }
};

