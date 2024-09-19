import LeaveRequestType from "../models/leaveRequestType.model.js";
import { fMsg } from "../utils/libby.js";

// Creates a new request type based on the provided name
// just the function for the developers to add new request types
export const createLeaveRequestType = async (req, res, next) => {
  try {
    const { leaveRequestTypeName } = req.body;
    //might delete later when the frontend is ready to handle error
    if (!leaveRequestTypeName)
      return next(new Error("Leave request type name is required"));
    const requestType = await LeaveRequestType.create({ leaveRequestTypeName });
    fMsg(res, "Leave request type created successfully", requestType, 200);
  } catch (error) {
    next(error);
  }
};

//this is to get all the leave request types to display in the dropdown menu in the frontend
export const getLeaveRequestTypes = async (req, res, next) => {
  try {
    const leaveRequestTypes = await LeaveRequestType.find();

    //if no leave request types found, display an error message
    if (leaveRequestTypes.length === 0)
      return next(new Error("No leave request types found"));

    //if leave request types found, display the leave request types
    fMsg(
      res,
      "Leave request types fetched successfully",
      leaveRequestTypes,
      200
    );
  } catch (error) {
    next(error);
  }
};

//this is to update the leave request type
export const updateLeaveRequestType = async (req, res, next) => {
  try {
    const { leaveRequestTypeName } = req.body;
    const { requestTypeId } = req.params;

    if(!requestTypeId) return next(new Error("Request type id is required"));

    //check if the leave request type name is already exis
    const leaveRequestType = await LeaveRequestType.findByIdAndUpdate(
      requestTypeId,
      { leaveRequestTypeName },
      { new: true }
    );
    fMsg(res, "Leave request type updated successfully", leaveRequestType, 200);
  } catch (error) {
    next(error);
  }
};

//this is to delete the leave request type
export const deleteLeaveRequestType = async (req, res, next) => {
  try {
    const { requestTypeId } = req.params;
    await LeaveRequestType.findByIdAndDelete(requestTypeId);
    fMsg(res, "Leave request type deleted successfully", null, 200);
  } catch (error) {
    next(error);
  }
};

//note these functions are for the developers to manage the leave request types may not be essential for the users who are using the system
