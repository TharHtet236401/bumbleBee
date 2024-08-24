import School from "../models/school.model.js";
import User from "../models/user.model.js";
import { fMsg } from "../utils/libby.js";

export const createSchool = async (req, res) => {
  try {
    const { schoolName, address, phone, email } = req.body;
    const user = await User.findById(req.user._id);

        // avoid double school name in the list
        if (!user.schools.includes(schoolName)) {
            user.schools.push(schoolName);
        } else {
            return fMsg(res, "School already exists", null, 409);
        }

    // this block is push the admin role to the user when he creates a school
    if (!user.roles.includes("admin")) {
      user.roles.push("admin");
    }

        //update the user by saving
        await user.save();
        const school = new School(req.body);
        await school.save();
        fMsg(res, "School created successfully", school, 201);
    } catch (error) {
        fMsg(res, "error in creating school", error, 500);
    }
};

export const editSchool = async (req, res) => {
    try {
        const { schoolName, address, phone, email } = req.body;
        const schoolId = req.params.school_id;
        const school = await School.findByIdAndUpdate(
            schoolId,
            {
                schoolName,
                address,
                phone,
                email,
            },
            { new: true }
        );
        fMsg(res, "School updated successfully", school, 200);
    } catch (error) {
        fMsg(res, "error in updating school", error, 500);
    }
};
