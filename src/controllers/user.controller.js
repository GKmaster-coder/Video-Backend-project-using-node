import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.modal.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {

    // 1. Get user details from frontend
    const { fullName, email, username, password } = req.body;
    console.log(fullName, email);

    // 2. Validation - not empty
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    /*
    Both working the same:

    if (!fullName || fullName.trim() === "") {
      throw new ApiError(400, "Full name is required");
    } else if (!email || email.trim() === "") {
      throw new ApiError(400, "Email is required");
    } else if (!username || username.trim() === "") {
      throw new ApiError(400, "Username is required");
    } else if (!password || password.trim() === "") {
      throw new ApiError(400, "Password is required");
    }
    */

    // 3. Check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }

    // 4. Check for avatar and image
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is compulsory");
    }

    // 5. Upload them to Cloudinary (avatar, coverImage)
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Create user object - create entry in DB
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    // Remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
        // They now won't come in the response
    );

    // Check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // Return response
    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User registered successfully"));

});



export {
    registerUser,
};
