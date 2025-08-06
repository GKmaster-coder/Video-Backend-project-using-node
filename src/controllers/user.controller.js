import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.modal.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {

    //1.get user details from frontend
    //2.validation-not empty
    //3.check if user already exists:username ,email
    //4.check for avtar and image 
    //5.upload them to Cloudinary,avtar
    //create user object -create entry in db
    //remove password and refresh token field from reponse
    //check for user creation
    //return res

    const { fullName, email, username, password } = req.body
    console.log(fullName, email);

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    /* 
    Both Woking same
    
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

    const existedUser = User.find({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User With email or Username")
    }

    const avtarLocalPath = req.files?.avtar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avtarLocalPath) {
        throw new ApiError(400, "avtar is Complusory");
    }

    const avtar = await uploadOnCloudinary(avtarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avtar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avtar: avtar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
        //they now not come in the User
    )


    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }


    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User registered successfully"));


});


export {
    registerUser,
};
