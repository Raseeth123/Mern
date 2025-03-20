import Message from "../models/Message.js";
import ChatRoom from "../models/ChatRoom.js";
import Course from "../models/Course.js";
import User from "../models/User.js";


export const getChatRoom = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    let chatRoom = await ChatRoom.findOne({ courseId });
    
    if (!chatRoom) {
      const participants = [course.faculty, ...course.students];
      chatRoom = new ChatRoom({
        courseId,
        participants
      });
      
      await chatRoom.save();
    }
    
    return res.status(200).json(chatRoom);
  } catch (error) {
    console.error("Error in getChatRoom:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getChatMessages = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await Message.find({ courseId })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender', 'name role');
    
    const totalMessages = await Message.countDocuments({ courseId });
    
    return res.status(200).json({
      messages: messages.reverse(),
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error in getChatMessages:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const isUserAuthorized = async (userId, courseId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) return false;
    if (course.faculty.toString() === userId.toString()) {
      return true;
    }
    
    return course.students.some(student => student.toString() === userId.toString());
  } catch (error) {
    console.error("Error checking user authorization:", error);
    return false;
  }
};
